from fastapi import APIRouter, UploadFile, File, Form
import shutil
import os
import uuid
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.pdf_service import PDFService
from app.services.chunk_service import ChunkService

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/extract-text")
async def extract_text(
        file: UploadFile = File(...),
        document_id: str | None = Form(None),
        filename: str | None = Form(None),
        uploaded_by: str | None = Form(None)
):

    document_id = document_id or str(uuid.uuid4())
    filename = filename or file.filename
    uploaded_by = uploaded_by or "unknown"

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted = PDFService.extract_text(file_path)

    chunks = []
    page_numbers = []

    for page_number, page_text in enumerate(extracted["page_texts"], start=1):
        page_chunks = ChunkService.chunk_text(page_text)
        if not page_chunks:
            continue

        chunks.extend(page_chunks)
        page_numbers.extend([page_number] * len(page_chunks))

    embeddings = EmbeddingService.generate_embeddings(chunks)

    VectorStore.add_document(
        chunks,
        embeddings,
        document_id=document_id,
        filename=filename,
        uploaded_by=uploaded_by,
        page_numbers=page_numbers
    )

    return {

        "document_id": document_id,
        "filename": filename,
        "uploaded_by": uploaded_by,
        "pages": extracted["pages"],
        "characters": extracted["characters"],
        "chunks": len(chunks),
        "embedding_dimension": len(embeddings[0]) if embeddings else 0,
        "status": "Stored in ChromaDB"

    }