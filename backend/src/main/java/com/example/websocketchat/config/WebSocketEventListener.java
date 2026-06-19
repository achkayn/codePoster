package com.example.websocketchat.config;


import com.example.websocketchat.model.ChatMessage;
import com.example.websocketchat.model.User;
import com.example.websocketchat.repository.UserRepository;
import com.example.websocketchat.service.userService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {



    private final userService userService;
    private final SimpMessageSendingOperations messagingTemplate;//Permet d’envoyer des messages à n’importe quelle destination STOMP depuis le serveur.
    private final UserRepository userRepository;


    

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        User user = userService.findBySessionId(sessionId);
        if (user == null) {
            return;
        }

        String username = user.getUsername();
        String roomId = user.getWaitingroomId();
        log.info("user disconnected: {} room {}", username, roomId);

        userService.deleteBySessionId(sessionId);

        if (roomId != null) {
            var chatMessage = ChatMessage.builder()
                    .type(ChatMessage.MsgType.LEAVE)
                    .sender(username)
                    .build();
            messagingTemplate.convertAndSend("/topic/waiting/" + roomId, chatMessage);
        }
    }
    /*@EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event)
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(even.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (username != null) {
            log.info("user connected: {}", username);

            // Save in MongoDB
            User user = new User(null, username);
            userService.save(user);

            // Send a JOIN message to the frontend
            ChatMessage chatMessage = ChatMessage.builder()
                    .type(ChatMessage.MsgType.JOIN)
                    .sender(username)
                    .content(username + " joined the chat")
                    .build();

            messagingTemplate.convertAndSend("/topic/room", chatMessage);
        }*/
    }






