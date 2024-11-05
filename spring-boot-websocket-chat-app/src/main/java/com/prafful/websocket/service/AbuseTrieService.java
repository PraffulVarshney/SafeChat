package com.prafful.websocket.service;

import com.prafful.websocket.model.AbuseTrie;
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
        if(abuseTrie.search(word)) return "*".repeat(word.length());
        else return word;
    }
}
