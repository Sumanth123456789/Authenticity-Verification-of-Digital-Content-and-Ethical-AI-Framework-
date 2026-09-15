"""
AI-Content Verification Hub — Audio Processing & Stream Decoding Engine

Uses standalone imageio-ffmpeg binaries to probe audio metadata
and decode input formats (MP3, AAC, FLAC, OGG, M4A, WAV) into 16kHz mono PCM WAV.
"""

import os
import subprocess
from typing import Any, Dict
import imageio_ffmpeg


class AudioProcessor:
    """Executes FFmpeg operations for audio decoding and stream metadata probing."""

    @staticmethod
    def get_ffmpeg_cmd() -> str:
        """Returns executable path for FFmpeg binary."""
        return imageio_ffmpeg.get_ffmpeg_exe()

    @staticmethod
    def get_audio_metadata(audio_path: str) -> Dict[str, Any]:
        """
        Probes audio stream parameters (duration, sample rate, channels, bitrate, codec).
        """
        ffmpeg_exe = AudioProcessor.get_ffmpeg_cmd()
        cmd = [ffmpeg_exe, "-hide_banner", "-i", audio_path]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        stderr_out = proc.stderr or ""

        duration = 0.0
        sample_rate = 44100
        channels = 2
        bitrate = "192 kbps"
        audio_codec = "mp3"

        for line in stderr_out.splitlines():
            line_str = line.strip()

            if "Duration:" in line_str:
                try:
                    dur_part = line_str.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = dur_part.split(":")
                    duration = round(float(h) * 3600 + float(m) * 60 + float(s), 2)
                except Exception:
                    pass

                if "bitrate:" in line_str:
                    try:
                        bitrate = line_str.split("bitrate:")[1].strip()
                    except Exception:
                        pass

            if "Audio:" in line_str:
                try:
                    audio_info = line_str.split("Audio:")[1]
                    parts = [p.strip() for p in audio_info.split(",")]
                    audio_codec = parts[0] if parts else "mp3"

                    for part in parts:
                        if "Hz" in part:
                            sr = part.split("Hz")[0].strip()
                            if sr.isdigit():
                                sample_rate = int(sr)

                        if "stereo" in part:
                            channels = 2
                        elif "mono" in part:
                            channels = 1
                except Exception:
                    pass

        file_size = os.path.getsize(audio_path) if os.path.exists(audio_path) else 0

        return {
            "duration_seconds": duration or 5.0,
            "sample_rate_hz": sample_rate,
            "channels": channels,
            "bitrate": bitrate,
            "audio_codec": audio_codec,
            "file_size_bytes": file_size,
        }

    @staticmethod
    def convert_to_pcm_wav(audio_path: str, output_wav_path: str, sample_rate: int = 16000) -> str:
        """
        Converts any audio container format into a normalized 16kHz 16-bit Mono PCM WAV file.
        """
        ffmpeg_exe = AudioProcessor.get_ffmpeg_cmd()
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i",
            audio_path,
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            str(sample_rate),
            "-ac",
            "1",
            output_wav_path,
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_wav_path
