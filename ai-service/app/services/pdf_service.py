import fitz


class PDFService:

    @staticmethod
    def extract_text(file_path: str):

        document = fitz.open(file_path)

        # Store page count BEFORE closing
        page_count = len(document)

        extracted_text = ""
        page_texts = []

        for page in document:
            page_text = page.get_text()
            page_texts.append(page_text)
            extracted_text += page_text

        character_count = len(extracted_text)

        document.close()

        return {
            "pages": page_count,
            "characters": character_count,
            "text": extracted_text,
            "page_texts": page_texts
        }