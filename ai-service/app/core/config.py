from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Network Documentation AI Service"

    UPLOAD_DIR: str = "uploads"

    CHROMA_DB_DIR: str = "chroma_db"

    GROQ_API_KEY: str

    MODEL_NAME: str = "llama-3.1-8b-instant"

    class Config:
        env_file = ".env"


settings = Settings()