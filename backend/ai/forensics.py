"""
AI-Content Verification Hub — Forensic Image Analysis Engine

Computes complementary physical and mathematical forensic signals:
- Error Level Analysis (ELA)
- High-Pass Noise Variance Analysis
- 2D FFT Frequency-Domain Spectral Analysis
- JPEG Quantization Matrix Analysis

Every signal strictly adheres to the 6-field schema:
(signal, value, severity, confidence, description, limitations)
"""

import io
import math
from typing import Any, Dict, List
import numpy as np
from PIL import Image, ImageChops, ImageFilter


class ForensicEngine:
    """Computes forensic image analysis signals."""

    @staticmethod
    def analyze_ela(image_path: str, quality: int = 90) -> Dict[str, Any]:
        """
        Error Level Analysis (ELA):
        Resaves the image at a known quality level (90%) and calculates
        the pixel difference between original and resaved images.
        """
        try:
            original = Image.open(image_path).convert("RGB")

            # Resave to memory buffer at quality 90
            buffer = io.BytesIO()
            original.save(buffer, format="JPEG", quality=quality)
            buffer.seek(0)
            resaved = Image.open(buffer).convert("RGB")

            # Compute absolute error delta
            diff = ImageChops.difference(original, resaved)
            diff_np = np.array(diff, dtype=np.float32)

            # Compute error stats
            mean_error = float(np.mean(diff_np))
            max_error = float(np.max(diff_np))
            std_error = float(np.std(diff_np))

            # Determine severity based on error variance across image
            if std_error > 25.0:
                severity = "moderate"
                confidence = 0.70
                desc = f"Elevated Error Level Analysis variance (std: {std_error:.1f}, mean: {mean_error:.1f}), indicating potential localized re-compression or regional edit."
            elif std_error > 15.0:
                severity = "low"
                confidence = 0.65
                desc = f"Moderate ELA error variance (std: {std_error:.1f}, mean: {mean_error:.1f}). Typical of standard JPEG save cycles."
            else:
                severity = "info"
                confidence = 0.80
                desc = f"Uniform ELA error distribution (std: {std_error:.1f}, mean: {mean_error:.1f}). No localized re-compression anomalies detected."

            return {
                "signal": "ERROR_LEVEL_ANALYSIS",
                "value": {
                    "mean_error": round(mean_error, 2),
                    "max_error": round(max_error, 2),
                    "std_error": round(std_error, 2),
                    "resave_quality": quality,
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "ELA results depend heavily on original file format and compression history. Lossless PNGs exhibit lower baseline ELA variance.",
            }

        except Exception as e:
            return {
                "signal": "ERROR_LEVEL_ANALYSIS",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.3,
                "description": f"Error performing ELA analysis: {str(e)}",
                "limitations": "Could not parse image for ELA computation.",
            }

    @staticmethod
    def analyze_noise(image_path: str) -> Dict[str, Any]:
        """
        Spatial Noise Variance Analysis:
        Subtracts median-filtered image from original to isolate high-frequency sensor noise,
        then evaluates noise standard deviation consistency across spatial grid cells.
        """
        try:
            img = Image.open(image_path).convert("L")  # Convert to grayscale
            img_np = np.array(img, dtype=np.float32)

            # High-pass spatial noise extraction via median filter subtraction
            median_img = img.filter(ImageFilter.MedianFilter(size=3))
            median_np = np.array(median_img, dtype=np.float32)

            noise_map = np.abs(img_np - median_np)
            global_std = float(np.std(noise_map))
            global_mean = float(np.mean(noise_map))

            # Partition into 8x8 grid cells to test spatial uniformity
            h, w = noise_map.shape
            grid_h, grid_w = max(1, h // 8), max(1, w // 8)
            cell_stds = []

            for i in range(8):
                for j in range(8):
                    cell = noise_map[i * grid_h : (i + 1) * grid_h, j * grid_w : (j + 1) * grid_w]
                    if cell.size > 0:
                        cell_stds.append(float(np.std(cell)))

            noise_inconsistency = float(np.std(cell_stds)) if cell_stds else 0.0

            if noise_inconsistency > 8.0:
                severity = "moderate"
                confidence = 0.72
                desc = f"Inconsistent spatial noise pattern across grid regions (inconsistency metric: {noise_inconsistency:.2f})."
            elif global_std < 0.5:
                severity = "low"
                confidence = 0.65
                desc = f"Unusually low sensor noise floor (std: {global_std:.2f}), common in synthetic renders or heavy noise reduction filters."
            else:
                severity = "info"
                confidence = 0.85
                desc = f"Consistent spatial noise profile (global noise std: {global_std:.2f}, grid variation: {noise_inconsistency:.2f})."

            return {
                "signal": "NOISE_VARIANCE",
                "value": {
                    "global_noise_std": round(global_std, 2),
                    "global_noise_mean": round(global_mean, 2),
                    "grid_inconsistency": round(noise_inconsistency, 2),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "Post-processing filters, heavy blurring, or image downscaling reduce natural sensor noise signatures.",
            }

        except Exception as e:
            return {
                "signal": "NOISE_VARIANCE",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.3,
                "description": f"Error performing noise variance analysis: {str(e)}",
                "limitations": "Could not parse noise features.",
            }

    @staticmethod
    def analyze_fft(image_path: str) -> Dict[str, Any]:
        """
        2D Frequency-Domain (FFT) Spectral Analysis:
        Applies 2D Fast Fourier Transform to compute log-magnitude spectrum,
        checking for high-frequency periodic grid/lattice artifacts typical of AI generators.
        """
        try:
            img = Image.open(image_path).convert("L")
            # Resize for fast, uniform FFT computation (512x512)
            img_resized = img.resize((512, 512), Image.Resampling.BILINEAR)
            img_np = np.array(img_resized, dtype=np.float32)

            # 2D Fast Fourier Transform & shift zero frequency to center
            f_transform = np.fft.fft2(img_np)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.log(1 + np.abs(f_shift))

            # High-frequency radial energy ratio
            cy, cx = 256, 256
            y, x = np.ogrid[:512, :512]
            radius = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

            high_freq_mask = radius > 128
            high_freq_energy = float(np.sum(magnitude_spectrum[high_freq_mask]))
            total_energy = float(np.sum(magnitude_spectrum))

            high_freq_ratio = high_freq_energy / (total_energy + 1e-8)

            # Detect spectral energy peaks away from DC center
            center_masked_spectrum = magnitude_spectrum.copy()
            center_masked_spectrum[radius <= 30] = 0.0
            max_peak = float(np.max(center_masked_spectrum))
            mean_spectrum = float(np.mean(center_masked_spectrum))

            spectral_peak_ratio = max_peak / (mean_spectrum + 1e-8)

            if spectral_peak_ratio > 3.8:
                severity = "moderate"
                confidence = 0.75
                desc = f"Periodic frequency-domain spectral spikes detected (peak ratio: {spectral_peak_ratio:.2f}). Common signature of generator lattice artifacts."
            elif high_freq_ratio < 0.20:
                severity = "low"
                confidence = 0.60
                desc = f"Smoothed high-frequency spectrum (ratio: {high_freq_ratio:.2f})."
            else:
                severity = "info"
                confidence = 0.80
                desc = f"Natural Fourier frequency distribution (high freq ratio: {high_freq_ratio:.2f}, peak ratio: {spectral_peak_ratio:.2f})."

            return {
                "signal": "FFT_SPECTRAL_ANALYSIS",
                "value": {
                    "high_freq_ratio": round(high_freq_ratio, 4),
                    "spectral_peak_ratio": round(spectral_peak_ratio, 2),
                    "spectrum_mean": round(mean_spectrum, 2),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "2D FFT frequency analysis evaluates spatial periodicity. Image resizing or sharpening algorithms can affect high-frequency spectrum metrics.",
            }

        except Exception as e:
            return {
                "signal": "FFT_SPECTRAL_ANALYSIS",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.3,
                "description": f"Error performing FFT spectral analysis: {str(e)}",
                "limitations": "Could not compute 2D FFT spectrum.",
            }

    @staticmethod
    def analyze_jpeg_quantization(image_path: str) -> Dict[str, Any]:
        """
        JPEG Quantization Table Analysis:
        Inspects DQT (Define Quantization Table) markers in JPEG headers to estimate
        compression quality and detect non-standard quantization matrices.
        """
        try:
            img = Image.open(image_path)
            format_name = (img.format or "").upper()

            if format_name not in ("JPEG", "JPG"):
                return {
                    "signal": "JPEG_QUANTIZATION",
                    "value": {"format": format_name, "is_jpeg": False},
                    "severity": "info",
                    "confidence": 0.90,
                    "description": f"Asset format is {format_name} (Lossless / non-JPEG format). Quantization tables are not applicable.",
                    "limitations": "Quantization table inspection applies only to lossy JPEG formatted media.",
                }

            quantization = getattr(img, "quantization", None)
            if not quantization:
                return {
                    "signal": "JPEG_QUANTIZATION",
                    "value": {"format": "JPEG", "has_quantization_table": False},
                    "severity": "info",
                    "confidence": 0.70,
                    "description": "Standard JPEG format detected, but custom quantization tables are omitted from image headers.",
                    "limitations": "Quantization matrix details omitted in JPEG stream.",
                }

            # Estimate approximate JPEG quality from luminance quantization table (table 0)
            table_0 = quantization.get(0, [])
            table_vals = list(table_0) if table_0 else []

            if table_vals:
                avg_q = float(np.mean(table_vals))
                # Rough quality estimation heuristic based on standard JPEG IJG quality matrix
                estimated_quality = max(1, min(100, int(100 - (avg_q - 1) * 2)))
            else:
                estimated_quality = 85

            return {
                "signal": "JPEG_QUANTIZATION",
                "value": {
                    "format": "JPEG",
                    "estimated_quality": estimated_quality,
                    "tables_found": len(quantization),
                },
                "severity": "info",
                "confidence": 0.85,
                "description": f"JPEG stream analyzed with estimated compression quality of {estimated_quality}%.",
                "limitations": "Quality estimation is heuristic based on standard luminance quantization matrix tables.",
            }

        except Exception as e:
            return {
                "signal": "JPEG_QUANTIZATION",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.3,
                "description": f"Error parsing JPEG quantization tables: {str(e)}",
                "limitations": "Could not extract JPEG quantization markers.",
            }

    @classmethod
    def extract_all_signals(cls, image_path: str) -> List[Dict[str, Any]]:
        """Runs all physical and mathematical forensic signal analyzers."""
        return [
            cls.analyze_ela(image_path),
            cls.analyze_noise(image_path),
            cls.analyze_fft(image_path),
            cls.analyze_jpeg_quantization(image_path),
        ]
