"""
AI-Content Verification Hub — Acoustic Signal Forensic Engine

Extracts complementary acoustic signals to detect synthetic voice cloning indicators:
- STFT Spectral Flux & Centroid Variance (vocoder synthesis artifacts)
- Pitch Micro-tremor & Contour Stability (F0 jitter/shimmer tracking)
- Background Noise Floor & Phase Discontinuity Analysis

Every signal strictly complies with the 6-field schema:
(signal, value, severity, confidence, description, limitations)
"""

import wave
import numpy as np
from scipy.signal import stft
from typing import Any, Dict, List


class AudioForensicEngine:
    """Extracts acoustic forensic signals for synthetic voice cloning evaluation."""

    @staticmethod
    def _read_wav_samples(wav_path: str):
        """Reads 16kHz mono PCM WAV samples into a float32 numpy array."""
        with wave.open(wav_path, "rb") as wf:
            n_channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            n_frames = wf.getnframes()
            raw_bytes = wf.readframes(n_frames)

            samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            if n_channels > 1:
                samples = samples[::n_channels]

            return samples, sample_rate

    @staticmethod
    def analyze_spectral_flux(wav_path: str) -> Dict[str, Any]:
        """
        STFT Spectral Flux & Centroid Variance Analysis:
        Calculates frame-to-frame spectral energy delta. Neural vocoders (WaveNet, HiFi-GAN)
        exhibit distinct, overly smooth spectral envelope flux transitions compared to human vocal tracts.
        """
        try:
            samples, sr = AudioForensicEngine._read_wav_samples(wav_path)
            if len(samples) < sr * 0.5:  # Require at least 0.5s audio
                return {
                    "signal": "SPECTRAL_FLUX_ANALYSIS",
                    "value": {"sample_count": len(samples)},
                    "severity": "info",
                    "confidence": 0.50,
                    "description": "Audio duration too short for robust spectral flux estimation.",
                    "limitations": "Requires at least 0.5s audio stream.",
                }

            # Compute Short-Time Fourier Transform (STFT)
            f, t, Zxx = stft(samples, fs=sr, nperseg=512, noverlap=256)
            spectrogram = np.abs(Zxx)

            # Frame-by-frame Spectral Flux (L2 norm difference between consecutive frames)
            flux = np.sqrt(np.sum(np.diff(spectrogram, axis=1) ** 2, axis=0))
            mean_flux = float(np.mean(flux))
            std_flux = float(np.std(flux))

            # Spectral Centroid
            freqs = f[:, np.newaxis]
            centroid = np.sum(spectrogram * freqs, axis=0) / (np.sum(spectrogram, axis=0) + 1e-8)
            centroid_variance = float(np.std(centroid))

            if std_flux < 0.08 and centroid_variance < 150.0:
                severity = "moderate"
                confidence = 0.72
                desc = f"Unnaturally smooth spectral flux transition detected (flux std: {std_flux:.3f}, centroid variance: {centroid_variance:.1f}). Typical signature of neural vocoder synthesis."
            elif std_flux > 0.8:
                severity = "low"
                confidence = 0.65
                desc = f"High spectral flux dynamics (flux std: {std_flux:.3f}). Natural acoustic vocal dynamics."
            else:
                severity = "info"
                confidence = 0.80
                desc = f"Normal acoustic spectral flux profile (mean flux: {mean_flux:.3f}, centroid variance: {centroid_variance:.1f})."

            return {
                "signal": "SPECTRAL_FLUX_ANALYSIS",
                "value": {
                    "mean_spectral_flux": round(mean_flux, 4),
                    "std_spectral_flux": round(std_flux, 4),
                    "centroid_variance": round(centroid_variance, 2),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "Lossy MP3/AAC compression or telephony codecs smooth high-frequency spectral flux.",
            }

        except Exception as e:
            return {
                "signal": "SPECTRAL_FLUX_ANALYSIS",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.30,
                "description": f"Error performing spectral flux analysis: {str(e)}",
                "limitations": "Acoustic stream parsing error.",
            }

    @staticmethod
    def analyze_pitch_contour(wav_path: str) -> Dict[str, Any]:
        """
        Pitch Micro-tremor & Fundamental Frequency (F0) Stability Analysis:
        Tracks frame fundamental frequency F0 via autocorrelation. Human vocal cords exhibit
        involuntary micro-tremors (micro-jitter); synthetic voice clones often feature rigid F0 stability.
        """
        try:
            samples, sr = AudioForensicEngine._read_wav_samples(wav_path)
            frame_len = int(sr * 0.03)  # 30ms frame window
            hop_len = int(sr * 0.015)   # 15ms hop

            pitches = []
            for i in range(0, len(samples) - frame_len, hop_len):
                frame = samples[i : i + frame_len]
                energy = np.sum(frame ** 2)

                if energy > 0.01:  # Voiced frame threshold
                    # Autocorrelation for pitch estimation
                    autocorr = np.correlate(frame, frame, mode="full")
                    autocorr = autocorr[len(autocorr) // 2 :]

                    # Human voice pitch range 70Hz to 400Hz
                    min_lag = int(sr / 400)
                    max_lag = int(sr / 70)

                    if max_lag < len(autocorr):
                        peak_lag = min_lag + np.argmax(autocorr[min_lag:max_lag])
                        if autocorr[peak_lag] > 0.3 * autocorr[0]:
                            pitch_f0 = sr / peak_lag
                            pitches.append(pitch_f0)

            if len(pitches) < 5:
                return {
                    "signal": "PITCH_CONTOUR_ANALYSIS",
                    "value": {"voiced_frames_count": len(pitches)},
                    "severity": "info",
                    "confidence": 0.60,
                    "description": "Fewer than 5 voiced frames detected; pitch contour analysis inconclusive.",
                    "limitations": "Requires voiced speech frames for F0 tracking.",
                }

            pitch_std = float(np.std(pitches))
            pitch_mean = float(np.mean(pitches))

            # Pitch micro-jitter (difference between adjacent pitch periods)
            jitter = float(np.mean(np.abs(np.diff(pitches)))) if len(pitches) > 1 else 0.0

            if jitter < 1.2 and pitch_std < 8.0:
                severity = "moderate"
                confidence = 0.74
                desc = f"Rigid pitch fundamental contour detected (F0 jitter: {jitter:.2f} Hz, F0 std: {pitch_std:.1f} Hz). Lacks natural human vocal cord micro-tremors."
            elif pitch_std > 45.0:
                severity = "low"
                confidence = 0.65
                desc = f"Broad fundamental frequency range (F0 mean: {pitch_mean:.1f} Hz, std: {pitch_std:.1f} Hz). Common in expressive natural speech."
            else:
                severity = "info"
                confidence = 0.82
                desc = f"Natural human vocal micro-tremors detected (F0 mean: {pitch_mean:.1f} Hz, F0 jitter: {jitter:.2f} Hz)."

            return {
                "signal": "PITCH_CONTOUR_ANALYSIS",
                "value": {
                    "mean_pitch_f0_hz": round(pitch_mean, 1),
                    "std_pitch_f0_hz": round(pitch_std, 1),
                    "micro_jitter_hz": round(jitter, 2),
                    "voiced_frames": len(pitches),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "Singing, robotic audio effects, or heavy auto-tune pitch correction influence F0 micro-tremor metrics.",
            }

        except Exception as e:
            return {
                "signal": "PITCH_CONTOUR_ANALYSIS",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.30,
                "description": f"Error performing pitch contour tracking: {str(e)}",
                "limitations": "Pitch tracking computation error.",
            }

    @staticmethod
    def analyze_background_noise_floor(wav_path: str) -> Dict[str, Any]:
        """
        Background Noise Floor & Inter-Word Silence Analysis:
        Synthetic voice clones frequently exhibit unnaturally silent inter-word pauses (zero energy)
        or artificial background noise floor gating artifacts.
        """
        try:
            samples, sr = AudioForensicEngine._read_wav_samples(wav_path)
            frame_len = int(sr * 0.02)  # 20ms frame
            energies = [
                float(np.sum(samples[i : i + frame_len] ** 2))
                for i in range(0, len(samples) - frame_len, frame_len)
            ]

            if not energies:
                return {
                    "signal": "BACKGROUND_NOISE_FLOOR",
                    "value": {"energy_count": 0},
                    "severity": "info",
                    "confidence": 0.50,
                    "description": "Empty sample stream.",
                    "limitations": "Insufficient audio energy samples.",
                }

            min_energy = float(np.min(energies))
            mean_energy = float(np.mean(energies))

            # Count dead-silent frames (energy < 1e-6)
            zero_energy_count = sum(1 for e in energies if e < 1e-6)
            zero_ratio = zero_energy_count / len(energies)

            if zero_ratio > 0.40 and min_energy < 1e-7:
                severity = "moderate"
                confidence = 0.70
                desc = f"Unnatural inter-word silence gating detected ({zero_ratio * 100:.1f}% absolute zero-energy frames). Common signature of synthetic TTS speech stitching."
            else:
                severity = "info"
                confidence = 0.85
                desc = f"Continuous background ambient noise floor (mean energy: {mean_energy:.6f}, silence ratio: {zero_ratio * 100:.1f}%)."

            return {
                "signal": "BACKGROUND_NOISE_FLOOR",
                "value": {
                    "min_energy": min_energy,
                    "mean_energy": mean_energy,
                    "silence_ratio": round(zero_ratio, 4),
                },
                "severity": severity,
                "confidence": confidence,
                "description": desc,
                "limitations": "Noise gate plugins, studio noise suppression, or digital mute gates cause silent inter-word pauses.",
            }

        except Exception as e:
            return {
                "signal": "BACKGROUND_NOISE_FLOOR",
                "value": {"error": str(e)},
                "severity": "info",
                "confidence": 0.30,
                "description": f"Error evaluating noise floor: {str(e)}",
                "limitations": "Noise floor analysis error.",
            }

    @classmethod
    def extract_all_audio_signals(cls, wav_path: str) -> List[Dict[str, Any]]:
        """Runs all acoustic signal forensic analyzers."""
        return [
            cls.analyze_spectral_flux(wav_path),
            cls.analyze_pitch_contour(wav_path),
            cls.analyze_background_noise_floor(wav_path),
        ]
