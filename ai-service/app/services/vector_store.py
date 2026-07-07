import chromadb
from app.core.config import settings


class VectorStore:

    client = chromadb.PersistentClient(
        path=settings.CHROMA_DB_DIR
    )

    collection = client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME
    )

    @classmethod
    def add_document(
            cls,
            chunks,
            embeddings,
            document_id,
            filename,
            uploaded_by,
            page_numbers=None
    ):

        existing = cls.collection.count()

        ids = []

        metadatas = []

        for i in range(len(chunks)):

            ids.append(str(existing + i))

            page_number = None
            if page_numbers is not None and i < len(page_numbers):
                page_number = page_numbers[i]

            metadatas.append({

                "document_id": str(document_id),

                "filename": filename,

                "page_number": page_number,

                "chunk_number": i,

                "uploaded_by": uploaded_by

            })

        cls.collection.add(

            ids=ids,

            documents=chunks,

            embeddings=embeddings,

            metadatas=metadatas

        )

    @classmethod
    def search(
            cls,
            embedding,
            document_id=None
    ):

        query_kwargs = {
            "query_embeddings": [embedding],
            "n_results": 5
        }

        if document_id is not None:
            query_kwargs["where"] = {
                "document_id": str(document_id)
            }

        results = cls.collection.query(**query_kwargs)

        return results