package com.netpilot.networkassistant.controller;

import com.netpilot.networkassistant.dto.document.DocumentResponse;
import com.netpilot.networkassistant.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public DocumentResponse uploadDocument(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        return documentService.uploadDocument(file);

    }

    @GetMapping("/{documentId}/status")
    public DocumentResponse getDocumentStatus(@PathVariable Long documentId) {
        return documentService.getDocumentStatus(documentId);
    }
}