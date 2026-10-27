"""
Alembic migration environment — AI-Content Verification Hub

Async-compatible env.py that:
  - Reads DATABASE_URL from the app's settings (.env)
  - Auto-discovers all ORM models via database.models import
  - Works with both SQLite (local dev) and PostgreSQL/Supabase (production)

Run migrations:
  alembic revision --autogenerate -m "initial schema"
  alembic upgrade head
"""

import sys
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------------------------
# Ensure backend/ is on the path so our app imports work
# ---------------------------------------------------------------------------
backend_dir = os.path.join(os.path.dirname(__file__), "..", )
sys.path.insert(0, os.path.abspath(backend_dir))

# ---------------------------------------------------------------------------
# Import app config & models — must happen after sys.path is set
# ---------------------------------------------------------------------------
from config import get_settings                     # noqa: E402
from database.db import Base                        # noqa: E402
import database.models                              # noqa: E402, F401 — registers all tables on Base.metadata

# ---------------------------------------------------------------------------
# Alembic Config object (gives access to alembic.ini values)
# ---------------------------------------------------------------------------
config = context.config

# Set up Python logging from alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point Alembic at our models' metadata for autogenerate support
target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Read DATABASE_URL from our app settings (respects .env file)
# ---------------------------------------------------------------------------
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)


# ---------------------------------------------------------------------------
# Offline mode (generates SQL without connecting to DB)
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — useful for generating raw SQL scripts."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online / async mode (runs migrations against the live database)
# ---------------------------------------------------------------------------
def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using an async engine (required for asyncpg / aiosqlite)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # NullPool is safest for migration scripts
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online (connected) migration mode."""
    import asyncio
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
