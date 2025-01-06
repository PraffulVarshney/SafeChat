package com.SafeChat.websocket.config;

// import com.SafeChat.websocket.model.ChatMessage;
// import com.SafeChat.websocket.model.MessageType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
// import org.springframework.messaging.handler.annotation.DestinationVariable;
// import org.springframework.messaging.handler.annotation.MessageMapping;
// import org.springframework.messaging.handler.annotation.SendTo;
// import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

// import com.SafeChat.websocket.model.ChatMessage;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {

    // private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            log.info("user disconnected: {}", username);
            // var chatMessage = ChatMessage.builder()
            // .type(MessageType.LEAVE)
            // .sender(username)
            // .build();
            // messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

}
