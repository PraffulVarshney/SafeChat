package com.SafeChat.websocket;

import com.SafeChat.websocket.repository.AbuseTrieLoader;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.FileInputStream;
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

	@PostConstruct
	public void initFirebase() {
		try {
			FileInputStream serviceAccount = new FileInputStream(
					"C:/Users/raosa/Downloads/chat-box-c37b8-firebase-adminsdk-zgzko-e78b09753e.json");
			FirebaseOptions options = FirebaseOptions.builder()
					.setCredentials(GoogleCredentials.fromStream(serviceAccount))
					.setDatabaseUrl("https://chat-box-c37b8-default-rtdb.firebaseio.com/")
					.build();
			FirebaseApp.initializeApp(options);
			System.out.println("Firebase initialized");
		} catch (IOException e) {
			System.err.println("Failed to initialize Firebase: " + e.getMessage());
		}
	}

	// TODO: add ext button
	// TODO: improve design
	// TODO: deploy and add DB
	// TODO: add encription
	// TODO: Add private room
	// TODO: file upload + emoji

}
