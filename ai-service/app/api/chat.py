import logging
from fastapi import APIRouter

from pydantic import BaseModel

from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore

logger = logging.getLogger("ai_service")

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):

    question: str

    document_id: str | None = None


@router.post("/search")
async def search(request: ChatRequest):

    logger.info("Chat search requested for document %s", request.document_id)

    if not request.document_id:
        logger.warning("Chat search rejected without document selection")
        raise ValueError("A selected document is required for retrieval")

    embedding = EmbeddingService.generate_query_embedding(
        request.question
    )

    results = VectorStore.search(
        embedding,
        request.document_id
    )

    logger.info("Chat search completed for document %s", request.document_id)

    return {
        "question": request.question,
        "document_id": request.document_id,
        "results": results["documents"][0]
    }

from app.services.rag_service import RAGService


@router.post("/ask")
async def ask(request: ChatRequest):

    logger.info("Chat ask requested for document %s", request.document_id)

    if not request.document_id:
        logger.warning("Chat ask rejected without document selection")
        raise ValueError("A selected document is required for retrieval")

    try:
        result = RAGService.ask(

            request.question,

            request.document_id

        )
    except Exception as exc:
        logger.exception("Chat ask failed for document %s", request.document_id)
        raise exc

    logger.info("Chat ask completed for document %s", request.document_id)
    return result