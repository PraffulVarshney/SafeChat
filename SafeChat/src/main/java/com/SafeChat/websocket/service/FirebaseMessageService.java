package com.SafeChat.websocket.service;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.model.EncryptionUtil;
import java.util.concurrent.CompletableFuture;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FirebaseMessageService {

    private final DatabaseReference databaseReference;
    @Autowired
    private EncryptionUtil encryptionUtil;

    public FirebaseMessageService() {
        this.databaseReference = FirebaseDatabase.getInstance().getReference("chats");
    }

    public void saveMessage(ChatMessage chatMessage) {
        ChatMessage dbMessage = new ChatMessage();

        dbMessage.setSender(encryptionUtil.encrypt(chatMessage.getSender()));
        dbMessage.setContent(encryptionUtil.encrypt(chatMessage.getContent())); // Encrypt only for Firebase
        dbMessage.setTimestamp(chatMessage.getTimestamp());
        dbMessage.setType(chatMessage.getType());
        databaseReference.push().setValueAsync(dbMessage);
    }

    public DatabaseReference getDatabaseReference() {
        return databaseReference;
    }

    public CompletableFuture<List<ChatMessage>> fetchMessages() {
        CompletableFuture<List<ChatMessage>> future = new CompletableFuture<>();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("chats");
        long currentTimestamp = System.currentTimeMillis();
        long twentyFourHoursAgo = currentTimestamp - (24 * 60 * 60 * 1000);

        ref.orderByChild("timestamp")
                .startAt(twentyFourHoursAgo)
                // .limitToLast(1000000)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        List<ChatMessage> chatMessages = new ArrayList<>();
                        for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                            ChatMessage chatMessage = snapshot.getValue(ChatMessage.class);
                            if (chatMessage != null) {
                                chatMessage.setSender(encryptionUtil.decrypt(chatMessage.getSender()));
                                chatMessage.setContent(encryptionUtil.decrypt(chatMessage.getContent()));
                                chatMessages.add(chatMessage);
                            }
                        }
                        future.complete(chatMessages); // Completes the future with the result
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        future.completeExceptionally(error.toException()); // Handle errors
                    }
                });
        return future;
    }

}
