package com.SafeChat.websocket.chat;

import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.SafeChat.websocket.service.FirebaseMessageService;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class ChatController {

    private final AbuseTrieService abuseTrieService;
    private final FirebaseMessageService firebaseMessageService;

    @Autowired
    public ChatController(AbuseTrieService abuseTrieService, FirebaseMessageService firebaseMessageService) {
        this.abuseTrieService = abuseTrieService;
        this.firebaseMessageService = firebaseMessageService;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        processChatMessage(chatMessage);
        firebaseMessageService.saveMessage(chatMessage); // Now using the new service
        return chatMessage;
    }

    @GetMapping("/chats")
    public List<ChatMessage> getChatMessages() {
        List<ChatMessage> messages = new ArrayList<>();
        firebaseMessageService.fetchMessages(messages::addAll);
        System.out.println("Messages retrieved from Firebase: " + messages);

        return messages;
    }

    private void processChatMessage(ChatMessage chatMessage) {
        String message = chatMessage.getContent();
        StringBuilder maskedMessage = new StringBuilder();
        StringBuilder curr = new StringBuilder();

        for (char c : message.toCharArray()) {
            if (c != ' ')
                curr.append(c);
            else {
                maskedMessage.append(abuseTrieService.maskAbusiveWord(curr.toString()));
                maskedMessage.append(" ");
                curr.setLength(0);
            }
        }

        maskedMessage.append(abuseTrieService.maskAbusiveWord(curr.toString()));
        chatMessage.setContent(maskedMessage.toString());
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }
}
