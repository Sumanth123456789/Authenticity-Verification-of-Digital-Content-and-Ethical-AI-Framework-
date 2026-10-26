"""
AI-Content Verification Hub — Image Metadata Extraction Service

Extracts file properties, SHA-256 asset hash, and EXIF metadata.
Provides conservative EXIF signal evaluation:
Missing EXIF or software editing tags (Photoshop/GIMP) are treated as contextual signals
and NEVER automatically trigger a synthetic or manipulated verdict.
"""

from __future__ import annotations

import hashlib
import mimetypes
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from PIL import Image, ExifTags, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True


class ImageMetadataService:
    """Service for extracting image metadata and conservative EXIF signals."""

    @staticmethod
    def calculate_sha256(file_path: str) -> str:
        """Calculate SHA256 hash of the file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def extract_exif(image: Image.Image) -> Dict[str, str]:
        """Extract raw EXIF key-value dictionary."""
        metadata = {}
        try:
            exif = image.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    metadata[str(tag)] = str(value)
            else:
                metadata["info"] = "No EXIF metadata found."
        except Exception as e:
            metadata["error"] = str(e)
        return metadata

    @staticmethod
    def extract_exif_signal(metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Produce a conservative EXIF metadata signal complying with the 6-field schema.
        Photoshop metadata or missing EXIF tags are treated conservatively as contextual notes.
        """
        exif = metadata.get("exif", {})
        software_tag = exif.get("Software", "") if isinstance(exif, dict) else ""
        make_tag = exif.get("Make", "") if isinstance(exif, dict) else ""
        model_tag = exif.get("Model", "") if isinstance(exif, dict) else ""

        if software_tag:
            soft_lower = software_tag.lower()
            if any(s in soft_lower for s in ["photoshop", "gimp", "canva", "lightroom", "affinity"]):
                severity = "info"
                confidence = 0.80
                desc = f"Image header metadata lists editing software signature ({software_tag}). Standard post-processing tools are widely used for cropping, resizing, and color adjustment."
            elif any(s in soft_lower for s in ["midjourney", "stable diffusion", "dall-e", "novelai"]):
                severity = "moderate"
                confidence = 0.85
                desc = f"Image metadata header indicates generative AI software framework ({software_tag})."
            else:
                severity = "info"
                confidence = 0.85
                desc = f"Image metadata indicates software pipeline: {software_tag}."
        elif make_tag or model_tag:
            severity = "info"
            confidence = 0.90
            desc = f"Original camera EXIF provenance detected: {make_tag} {model_tag}."
        else:
            severity = "info"
            confidence = 0.70
            desc = "No camera EXIF metadata present. Missing EXIF is common due to privacy stripping on social media platforms or chat applications."

        return {
            "signal": "EXIF_METADATA",
            "value": {
                "make": make_tag or "Unknown",
                "model": model_tag or "Unknown",
                "software": software_tag or "None",
                "has_exif": bool(make_tag or model_tag or software_tag),
            },
            "severity": severity,
            "confidence": confidence,
            "description": desc,
            "limitations": "EXIF metadata can be stripped by messaging platforms or social networks, and can be edited or forged.",
        }

    @staticmethod
    def get_metadata(file_path: str) -> Dict[str, Any]:
        """Extract complete forensic metadata from an image asset."""
        path = Path(file_path)
        exif_dict = {}
        width, height = 800, 600
        img_format = "PNG" if path.suffix.lower() == ".png" else "JPEG"
        img_mode = "RGB"

        try:
            with Image.open(file_path) as image:
                width, height = image.size
                img_format = image.format or img_format
                img_mode = image.mode or img_mode
                exif_dict = ImageMetadataService.extract_exif(image)
        except Exception as e:
            exif_dict = {"info": f"Could not read full EXIF image header: {str(e)}"}

        base_meta = {
            "filename": path.name,
            "extension": path.suffix,
            "format": img_format,
            "mode": img_mode,
            "width": width,
            "height": height,
            "resolution": f"{width}x{height}",
            "mime_type": mimetypes.guess_type(file_path)[0] or "image/jpeg",
            "file_size_bytes": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            "sha256": ImageMetadataService.calculate_sha256(file_path) if os.path.exists(file_path) else "",
            "created_time": datetime.fromtimestamp(os.path.getctime(file_path)).isoformat() if os.path.exists(file_path) else "",
            "modified_time": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat() if os.path.exists(file_path) else "",
            "exif": exif_dict,
        }

        base_meta["signal"] = ImageMetadataService.extract_exif_signal(base_meta)
        return base_meta