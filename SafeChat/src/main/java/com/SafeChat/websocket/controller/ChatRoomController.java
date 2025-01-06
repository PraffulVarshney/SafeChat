package com.SafeChat.websocket.controller;

import com.SafeChat.websocket.model.ChatRoom;
import com.SafeChat.websocket.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @MessageMapping("/createRoom")
    public ResponseEntity<String> createRoom(ChatRoom room) {
        boolean created = chatRoomService.createRoom(room.getRoomId(), room.getPassword());
        if (created) {
            return ResponseEntity.ok("Room created successfully");
        } else {
            return ResponseEntity.status(409).body("Room ID already exists");
        }
    }

    @MessageMapping("/joinRoom")
    public ResponseEntity<String> joinRoom(ChatRoom room) {
        boolean valid = chatRoomService.verifyRoom(room.getRoomId(), room.getPassword());
        if (valid) {
            return ResponseEntity.ok("Joined room successfully");
        } else {
            return ResponseEntity.status(401).body("Invalid room ID or password");
        }
    }
}
