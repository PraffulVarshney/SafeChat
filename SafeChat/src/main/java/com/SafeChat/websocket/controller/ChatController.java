package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.service.AbuseTrieService;
import com.SafeChat.websocket.service.FirebaseMessageService;
import com.SafeChat.websocket.service.FirebaseRoomService;

import java.util.*;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.*;

@RestController
public class ChatController {

    @Autowired
    AbuseTrieService abuseTrieService;
    @Autowired
    FirebaseMessageService firebaseMessageService;
    @Autowired
    private FirebaseRoomService firebaseRoomService;

    @MessageMapping("/room/{roomId}/sendMessage")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage sendMessage(@DestinationVariable String roomId, @Payload ChatMessage chatMessage) {
        processChatMessage(chatMessage);
        firebaseMessageService.saveMessage(chatMessage); // Now using the new service
        return chatMessage;
    }
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getChatMessages(@PathVariable String roomId, @RequestParam String password) {
        try {
            boolean isValid = firebaseRoomService.validateRoomPassword(roomId, password);
            if (isValid) {
                CompletableFuture<List<ChatMessage>> future = firebaseMessageService.fetchMessages(roomId);
                List<ChatMessage> messages = future.get(); // Waits until the future is completed
                System.out.println("Room messages retrieved from Firebase (Room: " + roomId + "): " + messages.size());
                return ResponseEntity.ok(messages);
            }
            else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
            }
        } catch (Exception e) {
//            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
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

    @MessageMapping("/room/{roomId}/addUser")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage addUser(@DestinationVariable String roomId, @Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        firebaseMessageService.saveMessage(chatMessage); // Now using the new service
        return chatMessage;
    }

    @MessageMapping("/room/{roomId}/leaveUser")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage leaveUser(@DestinationVariable String roomId, @Payload ChatMessage chatMessage) {
        firebaseMessageService.saveMessage(chatMessage);
        return chatMessage;
    }

    @PostMapping("/createRoom")
    public Map<String, String> createRoom(@RequestBody Map<String, String> payload) {
        String password = payload.get("password");
        Map<String, String> response = new HashMap<>();

        try {
            String roomId = firebaseRoomService.createRoom(password);
            response.put("roomId", roomId);
        } catch (Exception e) {
//            e.printStackTrace();
            response.put("error", "Failed to create room: " + e.getMessage());
        }
        return response;
    }

}
