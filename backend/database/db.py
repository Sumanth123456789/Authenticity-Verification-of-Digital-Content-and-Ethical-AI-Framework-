"""
AI-Content Verification Hub — Database Engine & Session

Supports:
  - SQLite   (local dev)    : sqlite+aiosqlite:///./aicvhub.db
  - PostgreSQL (Supabase)   : postgresql+asyncpg://user:password@host:5432/postgres

Switch between them by setting DATABASE_URL in your .env file — no code changes needed.
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import get_settings

settings = get_settings()

_is_sqlite = "sqlite" in settings.database_url

# Build engine kwargs — SQLite needs check_same_thread=False; PostgreSQL uses asyncpg natively
_engine_kwargs: dict = {"echo": settings.debug}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # asyncpg connection pool settings suitable for Supabase free tier
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 10
    _engine_kwargs["pool_timeout"] = 30
    _engine_kwargs["pool_recycle"] = 1800  # recycle connections every 30 min

engine = create_async_engine(settings.database_url, **_engine_kwargs)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def init_db() -> None:
    """Create all tables on startup."""
    async with engine.begin() as conn:
        from database import models  # noqa: F401 — import to register tables
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """FastAPI dependency: yield an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
