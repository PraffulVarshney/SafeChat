package com.SafeChat.websocket.model;

// import java.util.Set;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatRoom {

    private String roomId;
    private String password;
    // private Set<String> participants; // Optional: for storing user IDs in the

}
