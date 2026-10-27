"""
AI-Content Verification Hub — Application Configuration
Reads values from .env file via Pydantic Settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server & Security Settings
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    debug: bool = True

    # JWT Authentication Security
    jwt_secret_key: str = "super_secret_jwt_key_change_in_production_12345"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 Hours

    # OpenAI API Key (legacy)
    openai_api_key: str = ""

    # GROQ API Key (primary LLM provider)
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"  # fast, free-tier model

    # Rate Limiting
    rate_limit_requests_per_minute: int = 60

    # Database
    # Local dev   : sqlite+aiosqlite:///./aicvhub.db
    # Supabase    : postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    # Supabase (session pooler, recommended for serverless): 
    #              postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
    database_url: str = "sqlite+aiosqlite:///./aicvhub.db"

    # Supabase project credentials (optional — only needed if using supabase-py client)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # File upload security limits
    max_upload_size_bytes: int = 52_428_800  # 50 MB for images
    max_video_upload_size_bytes: int = 209_715_200  # 200 MB for videos
    max_audio_upload_size_bytes: int = 104_857_600  # 100 MB for audio
    temp_upload_dir: str = "./tmp_uploads"
    temp_file_ttl_seconds: int = 300

    # Video Sampling Configuration
    video_max_frames: int = 15
    video_sample_interval_sec: float = 2.0

    # AI Provider configuration ("demo" | "huggingface" | "local")
    ai_provider: str = "demo"

    # HuggingFace (optional)
    huggingface_api_token: str = ""
    huggingface_api_url: str = "https://api-inference.huggingface.co/models"
    huggingface_model_id: str = "umm-maybe/AI-image-detector"
    huggingface_fallback_model_id: str = "google/vit-base-patch16-224"

    # External APIs (optional)
    google_safe_browsing_api_key: str = ""
    google_fact_check_api_key: str = ""
    google_fact_check_api_url: str = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    fact_check_provider: str = "google"
    fact_check_timeout_seconds: float = 5.0

    # Whisper transcription
    whisper_model_size: str = "small"
    inference_device: str = "cpu"

    # Risk engine thresholds
    suspicious_threshold: int = 35
    high_risk_threshold: int = 55

    # Multi-Signal Image Heuristic Aggregation Weights
    # NOTE: Initial heuristic weights — not scientifically validated.
    weight_ai_model: float = 0.40
    weight_ela: float = 0.20
    weight_noise: float = 0.15
    weight_fft: float = 0.15
    weight_exif: float = 0.10

    # Multi-Signal Video Heuristic Aggregation Weights
    weight_video_frames: float = 0.50
    weight_temporal: float = 0.30
    weight_video_metadata: float = 0.20

    # Multi-Signal Audio & Synthetic Voice Heuristic Aggregation Weights
    weight_spectral_flux: float = 0.35
    weight_pitch_contour: float = 0.35
    weight_noise_floor: float = 0.30

    @property
    def has_huggingface(self) -> bool:
        return bool(self.huggingface_api_token)

    @property
    def has_safe_browsing(self) -> bool:
        return bool(self.google_safe_browsing_api_key)

    @property
    def has_fact_check(self) -> bool:
        return bool(self.google_fact_check_api_key)


@lru_cache()
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()
