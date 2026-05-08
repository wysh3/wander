from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.engine.url import make_url, URL

from app.config import get_settings

settings = get_settings()

_db_url = make_url(settings.DATABASE_URL)
# Convert psycopg2-style sslmode to asyncpg-compatible ssl parameter
_query = dict(_db_url.query)
if "sslmode" in _query:
    sslmode_val = _query.pop("sslmode")
    _query["ssl"] = sslmode_val
_db_url = _db_url.set(drivername="postgresql+asyncpg", query=_query)

engine = create_async_engine(
    _db_url, echo=False, pool_size=20, max_overflow=10
)
async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
