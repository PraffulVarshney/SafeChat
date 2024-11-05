package com.prafful.websocket;


import com.prafful.websocket.repository.AbuseTrieLoader;
import com.prafful.websocket.service.AbuseTrieService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;

@SpringBootApplication
public class ChatApplication {
	private final AbuseTrieLoader abuseTrieLoader;
	private final AbuseTrieService abuseTrieService;

	@Autowired
	public ChatApplication(AbuseTrieLoader abuseTrieLoader, AbuseTrieService abuseTrieService) {
		this.abuseTrieLoader = abuseTrieLoader;
		this.abuseTrieService = abuseTrieService;
	}

	public static void main(String[] args) {
		SpringApplication.run(ChatApplication.class, args);
	}

	@PostConstruct
	public void init() {
		try {
			abuseTrieLoader.loadTrieFromFile("abuseList.txt");
			System.out.println("Trie built successfully from words.txt");
		} catch (IOException e) {
			System.err.println("Failed to load words: " + e.getMessage());
		}
	}


	//TODO: add exit button
	//TODO: improve design
	//TODO: deploy

}
