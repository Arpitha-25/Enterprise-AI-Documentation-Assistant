from sentence_transformers import SentenceTransformer
from app.core.config import settings


class EmbeddingService:

    model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)

    @classmethod
    def generate_embeddings(cls, chunks):

        embeddings = cls.model.encode(
            chunks,
            convert_to_numpy=True
        )

        return embeddings.tolist()

    @classmethod
    def generate_query_embedding(cls, query):

        embedding = cls.model.encode(
            query,
            convert_to_numpy=True
        )

        return embedding.tolist()