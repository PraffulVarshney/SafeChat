package com.SafeChat.websocket.service;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.SafeChat.websocket.model.ChatMessage;
import java.util.function.Consumer;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class FirebaseMessageService {

    private final DatabaseReference databaseReference;

    public FirebaseMessageService() {
        this.databaseReference = FirebaseDatabase.getInstance().getReference("chats");
    }

    public void saveMessage(ChatMessage chatMessage) {
        databaseReference.push().setValueAsync(chatMessage);
    }

    public DatabaseReference getDatabaseReference() {
        return databaseReference;
    }


    public void fetchMessages(Consumer<List<ChatMessage>> callback) {
        // Get reference to the 'chats' node in the Firebase database
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("chats");

        // Query the last 10 messages ordered by timestamp
        ref.orderByChild("timestamp") // Assuming the timestamp is the field to order by
                .limitToLast(10) // Fetch only the last 10 messages
                .addValueEventListener(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        List<ChatMessage> chatMessages = new ArrayList<>();
                        for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                            ChatMessage chatMessage = snapshot.getValue(ChatMessage.class);
                            chatMessages.add(chatMessage);
                        }
                        // Callback with the list of chat messages
                        callback.accept(chatMessages);
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        System.err.println("Error fetching messages: " + error.getMessage());
                    }
                });
    }

}
