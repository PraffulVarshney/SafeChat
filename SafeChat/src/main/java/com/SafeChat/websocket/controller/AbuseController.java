package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.AbuseTrie;
import com.SafeChat.websocket.service.AbuseTrieService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/abuse")
public class AbuseController {

    @Autowired
    AbuseTrieService abuseTrieService;

    @GetMapping("/search/{word}")
    public boolean searchAbuseWord(@PathVariable String word) {
        return abuseTrieService.isAbuseWord(word);
    }
}
