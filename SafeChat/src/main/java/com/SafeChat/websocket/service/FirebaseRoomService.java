package com.SafeChat.websocket.service;

import com.SafeChat.websocket.model.EncryptionUtil;
import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseRoomService {

    @Autowired
    private EncryptionUtil encryptionUtil;

    private final Firestore db = FirestoreClient.getFirestore();

    public String createRoom(String password) throws Exception {
        // Reference to counter document
        DocumentReference counterRef = db.collection("counters").document("roomCounter");

        // Run Firestore transaction
        return db.runTransaction(transaction -> {
            DocumentSnapshot snapshot = transaction.get(counterRef).get();

            // Default to 1000 if no counter exists yet
            long currentValue = snapshot.exists() && snapshot.contains("value")
                    ? snapshot.getLong("value")
                    : 1000;
            long newRoomId = currentValue + 1;

            // Create or update counter value
            Map<String, Object> counterData = new HashMap<>();
            counterData.put("value", newRoomId);
            counterData.put("lastUpdated", Timestamp.now());

            if (snapshot.exists()) {
                transaction.update(counterRef, counterData);
            } else {
                transaction.set(counterRef, counterData);
            }

            // Encrypt password
            String encryptedPassword = encryptionUtil.encrypt(password);
//            String encryptedPassword = password;

            // Store room data
            Map<String, Object> roomData = new HashMap<>();
            roomData.put("roomId", String.valueOf(newRoomId));
            roomData.put("password", encryptedPassword);
            roomData.put("createdAt", Timestamp.now());
            roomData.put("updatedAt", Timestamp.now());

            DocumentReference newRoomRef = db.collection("rooms").document(String.valueOf(newRoomId));
            transaction.set(newRoomRef, roomData);

            return String.valueOf(newRoomId);
        }).get(); // get() waits for result
    }

    public Boolean validateRoomPassword(String roomId, String password){
//        for global room
        if (roomId.equals("1000")) {
            return true;
        }

        DocumentReference roomRef = db.collection("rooms").document(roomId);
        String encryptedPassword = encryptionUtil.encrypt(password);
//        String encryptedPassword = password;

        try {
            // Asynchronously retrieve the document
            ApiFuture<DocumentSnapshot> future = roomRef.get();
            DocumentSnapshot document = future.get();

            if (document.exists()) {
                String storedPassword = document.getString("password");
                return storedPassword != null && storedPassword.equals(encryptedPassword);
            } else {
                System.out.println("Room ID not found");
                return false;
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return false;
        }
    }
}