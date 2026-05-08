from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Union


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:54322/postgres"
    REDIS_URL: str = "redis://localhost:6379/0"

    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    GOOGLE_MAPS_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    LLM_PROVIDER: str = "nvidia"
    LLM_MODEL: str = "nvidia/nemotron-3-nano-30b-a3b"

    # Accept string or list, will be parsed in property
    CORS_ORIGINS: Union[str, list[str]] = "http://localhost:3000"

    DIGILOCKER_CLIENT_ID: str = ""
    DIGILOCKER_CLIENT_SECRET: str = ""

    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env")
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS_ORIGINS as a list."""
        # Default origins to include
        default_origins = [
            "http://localhost:3000",
            "https://wander-five-woad.vercel.app"
        ]
        
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        
        if isinstance(self.CORS_ORIGINS, str):
            # Handle empty string - return defaults
            if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "":
                return default_origins
            
            # Try to parse as JSON first
            import json
            try:
                parsed = json.loads(self.CORS_ORIGINS)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
            
            # Fall back to comma-separated values
            origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
            return origins if origins else default_origins
        
        return default_origins


@lru_cache()
def get_settings() -> Settings:
    return Settings()
