package com.netpilot.networkassistant.dto.document;

import com.netpilot.networkassistant.entity.ProcessingStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private Long id;

    private String fileName;

    private Long fileSize;

    private String uploadedAt;

    private ProcessingStatus processingStatus;

}