package com.netpilot.networkassistant.dto.chat;

import lombok.Data;

@Data
public class ChatRequest {

    private String question;
    private Long documentId;

}