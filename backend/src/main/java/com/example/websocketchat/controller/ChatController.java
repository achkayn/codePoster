package com.example.websocketchat.controller;

import com.example.websocketchat.model.ChatMessage;
import com.example.websocketchat.model.User;
import com.example.websocketchat.repository.UserRepository;
import com.example.websocketchat.service.MessagingService;
import com.example.websocketchat.service.RoomService;
import com.example.websocketchat.service.userService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@CrossOrigin(origins="http://localhost:5173/")
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final RoomService roomService;
    private final userService userService;
    private final MessagingService messagingService;

    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/waiting/{roomId}")
    public ChatMessage sendMessage(@Payload ChatMessage message,
                                   @DestinationVariable String roomId) {
        return message;
    }

    @MessageMapping("/chat-removeUser/{roomId}")
    @SendTo("/topic/waiting/{roomId}")
    public ChatMessage removePlayer(@Payload ChatMessage message,
                                   @DestinationVariable String roomId) {

        return message;
    }


    @MessageMapping("/chat-addUser/{roomId}")
    public void addUser(@Payload ChatMessage message,
                        @DestinationVariable String roomId,
                        SimpMessageHeaderAccessor headers) {

        String sessionId = headers.getSessionId();

        Principal user = headers.getUser();
        String principalId= (user !=null)? user.getName():null;
        headers.getSessionAttributes().put("username", message.getSender());
        headers.getSessionAttributes().put("waitingid", roomId);
        headers.getSessionAttributes().put("sessionid", sessionId);

        RoomService.JoinResult result =
                roomService.addUserToRoom(roomId, message.getSender(), sessionId);

        switch (result) {
            case ROOM_NOT_FOUND -> messagingService.sendError(message.getSender(), "Room doesn't exist");
            case ROOM_FULL      -> messagingService.sendError(message.getSender(), "Room is full");
            case DUPLICATE_USERNAME -> messagingService.sendToUserOne(principalId, "/queue/errors", "Username already exists");
            case OK -> messagingService.sendToTopic("/topic/waiting/" + roomId, message);
        }
    }

    @MessageMapping("/player-ready/{roomId}")
    public void playerReady(@Payload ChatMessage message,
                            @DestinationVariable String roomId) {
        roomService.handlePlayerReady(roomId, message.getSender());
        messagingService.sendToTopic("/topic/waiting/" + roomId, message);
    }
}