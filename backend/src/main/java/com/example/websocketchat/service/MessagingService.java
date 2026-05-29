package com.example.websocketchat.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private final SimpMessageSendingOperations messagingTemplate;

    public void sendToTopic(String destination, Object payload) {
        messagingTemplate.convertAndSend(destination, payload);
    }

    public void sendToUser(String username, String destination, Object payload) {
        System.out.println("Sending to user " + username + " to topic " + destination +": " + payload);
        messagingTemplate.convertAndSend(destination + "/" + username, payload);
    }

    public void sendError(String username, String error) {
        sendToUser(username, "/queue/errors", error);
    }
    public void sendToUserOne(String principalId, String destination, String error) {
        messagingTemplate.convertAndSendToUser(principalId, "/queue/errors" , error);
    }
    public void sendToUserOneWithPayload(String principalId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(principalId, destination, payload);
    }
}
