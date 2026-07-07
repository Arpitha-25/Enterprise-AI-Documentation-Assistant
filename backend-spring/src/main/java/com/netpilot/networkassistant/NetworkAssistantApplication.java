package com.netpilot.networkassistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NetworkAssistantApplication {

	public static void main(String[] args) {
		SpringApplication.run(NetworkAssistantApplication.class, args);
	}

}
