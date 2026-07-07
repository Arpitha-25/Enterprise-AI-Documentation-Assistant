package com.netpilot.networkassistant.repository;

import com.netpilot.networkassistant.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository
        extends JpaRepository<Document, Long> {

}