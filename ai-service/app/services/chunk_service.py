from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings


class ChunkService:

    @staticmethod
    def chunk_text(text: str):

        splitter = RecursiveCharacterTextSplitter(

            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=[
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ]
        )

        chunks = splitter.split_text(text)

        return chunks