from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    AWS_REGION: str
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_S3_BUCKET: str
    S3_PRESIGNED_URL_EXPIRE_SECONDS: int = 3600

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()