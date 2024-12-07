package com.SafeChat.websocket.chat;

import com.SafeChat.websocket.model.ChatMessage;
import com.SafeChat.websocket.service.AbuseTrieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final AbuseTrieService abuseTrieService;

    @Autowired
    public ChatController(AbuseTrieService abuseTrieService) {
        this.abuseTrieService = abuseTrieService;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        processChatMessage(chatMessage);
        return chatMessage;
    }

    private void processChatMessage(ChatMessage chatMessage) {
        String message = chatMessage.getContent();
        StringBuilder maskedMessage = new StringBuilder();
        StringBuilder curr = new StringBuilder();

        for(char c : message.toCharArray()){
            if(c != ' ') curr.append(c);
            else{
                maskedMessage.append(abuseTrieService.maskAbusiveWord(curr.toString()));
                maskedMessage.append(" ");
                curr.setLength(0);
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
        return chatMessage;
    }
}
