package com.netpilot.networkassistant.controller;

import com.netpilot.networkassistant.dto.conversation.ConversationResponse;
import com.netpilot.networkassistant.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    public List<ConversationResponse> getHistory(Authentication authentication) {
        return conversationService.getHistory(authentication.getName());
    }

    @DeleteMapping
    public void deleteHistory(Authentication authentication) {
        conversationService.deleteHistory(authentication.getName());
    }

    @GetMapping("/conversation/{id}")
    public ConversationResponse getConversation(
            @PathVariable("id") Long conversationId,
            Authentication authentication
    ) {
        return conversationService.getConversation(authentication.getName(), conversationId);
    }
}
