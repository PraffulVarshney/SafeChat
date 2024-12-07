package com.SafeChat.websocket.repository;
import com.SafeChat.websocket.service.AbuseTrieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

@Repository
public class AbuseTrieLoader {
    private final AbuseTrieService abuseTrieService;

    @Autowired
    public AbuseTrieLoader(AbuseTrieService abuseTrieService) {
       this.abuseTrieService = abuseTrieService;
    }


    public void loadTrieFromFile(String fileName) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ClassPathResource(fileName).getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                abuseTrieService.addAbusiveWord(line.trim());
            }
        }
    }
}
