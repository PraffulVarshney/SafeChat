package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.AbuseTrie;
import com.SafeChat.websocket.service.AbuseTrieService;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/abuse")
public class AbuseController {

    @Autowired
    AbuseTrieService abuseTrieService;

    @GetMapping("/search/{words}")
    public boolean searchAbuseWord(@PathVariable ArrayList<String> words) {
        for(String word: words)
        {
            if(abuseTrieService.isAbuseWord(word)){
                return true;
            }
        }
        return false;
    }
}
