from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Network Documentation AI Service"

    UPLOAD_DIR: str = "uploads"

    CHROMA_DB_DIR: str = "chroma_db"

    GROQ_API_KEY: str

    MODEL_NAME: str = "llama-3.1-8b-instant"

    CHUNK_SIZE: int = 1000

    CHUNK_OVERLAP: int = 200

    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    CHROMA_COLLECTION_NAME: str = "network_docs"

    LLM_TEMPERATURE: float = 0.2

    class Config:
        env_file = ".env"


settings = Settings()