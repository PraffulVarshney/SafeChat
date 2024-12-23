package com.SafeChat.websocket.service;

import com.SafeChat.websocket.model.AbuseTrie;
import org.springframework.stereotype.Service;

@Service

public class AbuseTrieService {
    private final AbuseTrie abuseTrie;

    public AbuseTrieService() {
        this.abuseTrie = new AbuseTrie();
    }

    public void addAbusiveWord(String word) {
        abuseTrie.insert(word);
    }

    public String maskAbusiveWord(String word) {
        if (abuseTrie.search(word)) {
            return word.charAt(0) + "*".repeat((int) word.length() - 1);
        } else
            return word;
    }
}
