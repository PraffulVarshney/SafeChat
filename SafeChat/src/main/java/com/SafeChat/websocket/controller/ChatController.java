package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.SafeChat.websocket.service.FirebaseMessageService;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
// import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
public class ChatController {

    @Autowired
    AbuseTrieService abuseTrieService;
    @Autowired
    FirebaseMessageService firebaseMessageService;

    // @MessageMapping("/chat.sendMessage")
    // @SendTo("/topic/{roomId}")
    // public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
    // processChatMessage(chatMessage);
    // String roomId = chatMessage.getRoomId();
    // System.out.println("roomid" + roomId);
    // firebaseMessageService.saveMessage(chatMessage, roomId); // Now using the new
    // service
    // return chatMessage;
    // }

    @MessageMapping("/chat.sendMessage/{roomId}")
    @SendTo("/topic/{roomId}")
    public ChatMessage sendMessage(@DestinationVariable String roomId, ChatMessage chatMessage) {
        processChatMessage(chatMessage);
        chatMessage.setRoomId(roomId);
        firebaseMessageService.saveMessage(chatMessage, roomId);
        return chatMessage;
    }

    // @PreAuthorize("isAuthenticated()")
    @GetMapping("/chats/{roomId}")
    public List<ChatMessage> getChatMessages(@PathVariable String roomId) {
        System.out.println("roomed" + roomId);
        CompletableFuture<List<ChatMessage>> future = firebaseMessageService.fetchMessages(roomId);
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

    @MessageMapping("/chat.addUser/{roomId}")
    @SendTo("/topic/{roomId}")
    public ChatMessage addUser(@DestinationVariable String roomId, ChatMessage chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        firebaseMessageService.saveMessage(chatMessage, roomId);
        return chatMessage;
    }

    @MessageMapping("/chat.leaveUser/{roomId}")
    @SendTo("/topic/{roomId}")
    public ChatMessage leaveUser(@DestinationVariable String roomId, ChatMessage chatMessage) {
        firebaseMessageService.saveMessage(chatMessage, roomId);
        return chatMessage;
    }

}
