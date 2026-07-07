import logging
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.llm_service import LLMService


logger = logging.getLogger("ai_service")


class RAGService:

    @staticmethod
    def ask(
            question,
            document_id
    ):

        logger.info("Retrieval started for document %s", document_id)

        if not document_id:
            logger.warning("Retrieval rejected without document selection")
            raise ValueError("A selected document is required for retrieval")

        embedding = EmbeddingService.generate_query_embedding(
            question
        )

        results = VectorStore.search(
            embedding,
            document_id
        )

        chunks = results["documents"][0]
        metadatas = results["metadatas"][0]

        context = "\n\n".join(chunks)

        logger.info("Retrieved %s chunks for document %s", len(chunks), document_id)

        answer = LLMService.generate_answer(
            question,
            context
        )

        sources = []

        for metadata in metadatas:
            if not metadata:
                continue

            sources.append({
                "filename": metadata.get("filename"),
                "page_number": metadata.get("page_number"),
                "chunk_number": metadata.get("chunk_number")
            })

        logger.info("Response generated for document %s", document_id)

        return {

            "answer": answer,

            "sources": sources

        }