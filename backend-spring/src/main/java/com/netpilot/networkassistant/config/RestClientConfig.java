package com.netpilot.networkassistant.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    @Bean
    public RestClient restClient(){

        return RestClient.builder()

                .baseUrl(aiServiceUrl)

                .build();

    }

}