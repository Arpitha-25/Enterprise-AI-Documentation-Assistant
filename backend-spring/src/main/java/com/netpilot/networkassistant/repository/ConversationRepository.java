package com.netpilot.networkassistant.repository;

import com.netpilot.networkassistant.entity.Conversation;
import com.netpilot.networkassistant.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserOrderByTimestampDesc(User user);

    void deleteByUser(User user);
}
