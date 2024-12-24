package com.SafeChat.websocket;

import com.SafeChat.websocket.repository.AbuseTrieLoader;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;

@SpringBootApplication
public class ChatApplication {
	private final AbuseTrieLoader abuseTrieLoader;
	private final AbuseTrieService abuseTrieService;

	@Value("${firebase.database-url}")
	private String firebaseDatabaseUrl;

	@Value("${firebase.credentials-json}")
	private String firebaseCredentialsJson;

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

	@PostConstruct
	public void initFirebase() {
		try {
			ObjectMapper objectMapper = new ObjectMapper();
			Map<String, Object> credentialsMap = objectMapper.readValue(firebaseCredentialsJson,
					new TypeReference<Map<String, Object>>() {
					});
			FirebaseOptions options = FirebaseOptions.builder()
					.setCredentials(GoogleCredentials
							.fromStream(new ByteArrayInputStream(objectMapper.writeValueAsBytes(credentialsMap))))
					.setDatabaseUrl(firebaseDatabaseUrl)
					.build();
			FirebaseApp.initializeApp(options);
			System.out.println("Firebase initialized");
		} catch (IOException e) {
			System.err.println("Failed to initialize Firebase: " + e.getMessage());
		}
	}

	// TODO: improve design
	// TODO: Add private room
	// TODO: file upload + emoji

}
