package com.netpilot.networkassistant.controller;

import com.netpilot.networkassistant.dto.chat.ChatRequest;
import com.netpilot.networkassistant.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AIService aiService;

    @PostMapping("/ask")
    public Map ask(
            @RequestBody ChatRequest request,
            Authentication authentication
    ) {

        return aiService.askQuestion(
                request.getQuestion(),
                authentication.getName(),
                request.getDocumentId()
        );

    }

}