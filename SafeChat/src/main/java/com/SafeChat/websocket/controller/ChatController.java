package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.SafeChat.websocket.service.FirebaseMessageService;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class ChatController {

    @Autowired
    AbuseTrieService abuseTrieService;
    @Autowired
    FirebaseMessageService firebaseMessageService;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        processChatMessage(chatMessage);
        firebaseMessageService.saveMessage(chatMessage); // Now using the new service
        return chatMessage;
    }

    @GetMapping("/chats")
    public List<ChatMessage> getChatMessages() {
        CompletableFuture<List<ChatMessage>> future = firebaseMessageService.fetchMessages();
        try {
            List<ChatMessage> messages = future.get(); // Waits until the future is completed
            System.out.println("Messages retrieved from Firebase: " + messages.size());
            return messages;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public static boolean isEmoji(int codePoint) {
        return (codePoint > 255);
        // (codePoint >= 0x1F600 && codePoint <= 0x1F64F) || // Emoticons
        // (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) || // Symbols & Pictographs
        // (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) || // Transport & Map Symbols
        // (codePoint >= 0x1F700 && codePoint <= 0x1F77F); // Alchemical Symbols
    }

    private void processChatMessage(ChatMessage chatMessage) {
        String message = chatMessage.getContent();
        StringBuilder maskedMessage = new StringBuilder();
        StringBuilder curr = new StringBuilder();

        for (int i = 0; i < message.length();) {
            int codePoint = message.codePointAt(i);
            i += Character.charCount(codePoint);
            // Check if the codePoint is an emoji
            if (Character.isWhitespace(codePoint) || (((char) codePoint) == ' ') || isEmoji(codePoint)) {
                maskedMessage.append(abuseTrieService.maskAbusiveWord(curr.toString()));
                maskedMessage.append(Character.toChars(codePoint));
                curr.setLength(0);
            } else {
                curr.append((char) codePoint);
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
        firebaseMessageService.saveMessage(chatMessage); // Now using the new service
        return chatMessage;
    }

    @MessageMapping("/chat.leaveUser")
    @SendTo("/topic/public")
    public ChatMessage leaveUser(@Payload ChatMessage chatMessage) {
        firebaseMessageService.saveMessage(chatMessage);
        return chatMessage;
    }

}
