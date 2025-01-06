package com.SafeChat.websocket.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ChatRoomService {

    private final Map<String, String> roomMap = new HashMap<>();

    public boolean createRoom(String roomId, String password) {
        if (roomMap.containsKey(roomId)) {
            return false; // Room already exists
        }
        roomMap.put(roomId, password);
        return true;
    }

    public boolean verifyRoom(String roomId, String password) {
        return roomMap.containsKey(roomId) && roomMap.get(roomId).equals(password);
    }
}
