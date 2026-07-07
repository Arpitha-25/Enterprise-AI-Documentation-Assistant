from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.documents import router as document_router

app = FastAPI(
    title="Network Documentation AI Service",
    version="1.0.0"
)

app.include_router(health_router)
app.include_router(document_router)
app.include_router(chat_router)


@app.get("/")
def home():
    return {
        "message": "Network Documentation AI Service"
    }