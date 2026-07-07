package com.netpilot.networkassistant.service;

import com.netpilot.networkassistant.dto.conversation.ConversationResponse;
import com.netpilot.networkassistant.entity.Conversation;
import com.netpilot.networkassistant.entity.User;
import com.netpilot.networkassistant.exception.UserNotFoundException;
import com.netpilot.networkassistant.repository.ConversationRepository;
import com.netpilot.networkassistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public void saveConversation(String email, String question, String answer, Long documentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        log.info("Saving conversation for user {}", email);
        Conversation conversation = Conversation.builder()
                .user(user)
                .question(question)
                .answer(answer)
                .documentId(documentId)
                .build();

        conversationRepository.save(conversation);
    }

    public List<ConversationResponse> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        log.info("Loading history for user {}", email);
        return conversationRepository.findByUserOrderByTimestampDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        log.info("Deleting history for user {}", email);
        conversationRepository.deleteByUser(user);
    }

    public ConversationResponse getConversation(String email, Long conversationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        log.info("Retrieving conversation {} for user {}", conversationId, email);
        if (!conversation.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Conversation does not belong to the authenticated user");
        }

        return toResponse(conversation);
    }

    private ConversationResponse toResponse(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .question(conversation.getQuestion())
                .answer(conversation.getAnswer())
                .timestamp(conversation.getTimestamp())
                .documentId(conversation.getDocumentId())
                .build();
    }
}
