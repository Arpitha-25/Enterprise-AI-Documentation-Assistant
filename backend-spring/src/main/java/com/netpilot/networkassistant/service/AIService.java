package com.netpilot.networkassistant.service;

import com.netpilot.networkassistant.exception.AIServiceException;
import com.netpilot.networkassistant.exception.DocumentNotFoundException;
import com.netpilot.networkassistant.exception.InvalidQuestionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final RestClient restClient;
    private final ConversationService conversationService;

    public Map askQuestion(String question, String email, Long documentId) {

        log.info("Chat request received for document {}", documentId);

        if (question == null || question.isBlank()) {
            log.warn("Rejected empty chat question");
            throw new InvalidQuestionException("Question cannot be empty");
        }

        if (documentId == null) {
            log.warn("Rejected chat request without selected document");
            throw new DocumentNotFoundException("A selected document is required for retrieval");
        }

        Map response;

        try {
            response = restClient.post()

                    .uri("/chat/ask")

                    .body(
                            Map.of(
                                    "question",
                                    question,
                                    "document_id",
                                    documentId
                            )
                    )

                    .retrieve()

                    .body(Map.class);
        } catch (Exception ex) {
            log.error("AI service call failed for document {}", documentId, ex);
            throw new AIServiceException("Unable to process the request right now");
        }

        String answer = response != null && response.containsKey("answer")
                ? String.valueOf(response.get("answer"))
                : "";

        log.info("Chat response completed for document {}", documentId);
        conversationService.saveConversation(
                email,
                question,
                answer,
                documentId
        );

        return response;

    }

}