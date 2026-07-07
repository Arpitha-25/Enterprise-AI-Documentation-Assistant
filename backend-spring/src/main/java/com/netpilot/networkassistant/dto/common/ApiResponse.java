package com.netpilot.networkassistant.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ApiResponse {

    private int status;

    private String message;

    private LocalDateTime timestamp;

}