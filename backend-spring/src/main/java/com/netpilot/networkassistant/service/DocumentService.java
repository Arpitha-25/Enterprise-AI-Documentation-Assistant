package com.netpilot.networkassistant.service;

import com.netpilot.networkassistant.dto.document.DocumentResponse;
import com.netpilot.networkassistant.entity.Document;
import com.netpilot.networkassistant.entity.ProcessingStatus;
import com.netpilot.networkassistant.exception.DocumentNotFoundException;
import com.netpilot.networkassistant.exception.DocumentProcessingException;
import com.netpilot.networkassistant.exception.InvalidFileException;
import com.netpilot.networkassistant.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public DocumentResponse uploadDocument(MultipartFile file)
            throws IOException {

        log.info("Upload started for file {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            log.warn("Upload rejected because the file was empty");
            throw new InvalidFileException("File cannot be empty.");
        }

        if (!"application/pdf".equals(file.getContentType())) {
            log.warn("Upload rejected for unsupported content type {}", file.getContentType());
            throw new InvalidFileException("Only PDF files are allowed.");
        }

        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String storedFileName = UUID.randomUUID() + ".pdf";
        Path filePath = uploadPath.resolve(storedFileName);

        file.transferTo(filePath);

        Document document = Document.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .filePath(filePath.toString())
                .processingStatus(ProcessingStatus.UPLOADED)
                .build();

        document = documentRepository.save(document);

        log.info("Document {} stored with status {}", document.getId(), document.getProcessingStatus());
        processDocumentAsync(document.getId());

        return DocumentResponse.builder()
                .id(document.getId())
                .fileName(document.getOriginalFileName())
                .fileSize(document.getFileSize())
                .uploadedAt(document.getUploadedAt().toString())
                .processingStatus(document.getProcessingStatus())
                .build();

    }

    @Async
    public void processDocumentAsync(Long documentId) {
        Optional<Document> optionalDocument = documentRepository.findById(documentId);

        if (optionalDocument.isEmpty()) {
            return;
        }

        Document document = optionalDocument.get();

        try {
            log.info("Processing started for document {}", documentId);
            updateStatus(document, ProcessingStatus.PROCESSING);

            // Placeholder processing pipeline: extract, chunk, embed, store.
            // In a real implementation this would call the AI service.
            Thread.sleep(2000);

            log.info("Indexing started for document {}", documentId);
            updateStatus(document, ProcessingStatus.INDEXING);
            Thread.sleep(2000);

            updateStatus(document, ProcessingStatus.READY);
            log.info("Processing completed successfully for document {}", documentId);
        } catch (Exception ex) {
            log.error("Processing failed for document {}", documentId, ex);
            updateStatus(document, ProcessingStatus.FAILED);
            throw new DocumentProcessingException("Document processing failed");
        }
    }

    private void updateStatus(Document document, ProcessingStatus status) {
        document.setProcessingStatus(status);
        documentRepository.save(document);
    }

    public DocumentResponse getDocumentStatus(Long documentId) {
        log.info("Status requested for document {}", documentId);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found"));

        return DocumentResponse.builder()
                .id(document.getId())
                .fileName(document.getOriginalFileName())
                .fileSize(document.getFileSize())
                .uploadedAt(document.getUploadedAt().toString())
                .processingStatus(document.getProcessingStatus())
                .build();
    }

}