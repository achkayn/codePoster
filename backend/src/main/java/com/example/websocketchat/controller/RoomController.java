package com.example.websocketchat.controller;

import com.example.websocketchat.model.ChatMessage;
import com.example.websocketchat.model.Sabotage;
import com.example.websocketchat.model.User;
import com.example.websocketchat.service.MessagingService;
import com.example.websocketchat.service.RoomService;
import com.example.websocketchat.service.userService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;
import java.util.List;
import java.util.Random;

@CrossOrigin(origins = "http://localhost:5173/")
@Controller
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final userService userService;
    private final MessagingService messagingService;

    // ─── Room lifecycle ──────────────────────────────────────────────────────

    @MessageMapping("/createRoom/{roomId}")
    public void createRoom(
            @Payload ChatMessage message,
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headers
    ) {
        String sessionId = headers.getSessionId();
        Principal user = headers.getUser();
        String principalId= (user !=null)? user.getName():null;
        headers.getSessionAttributes().put("sessionid", sessionId);
        System.out.println("testing to see diff "+"\n" + message.getDifficulty());
        if (userService.checkExistingRoom(roomId)) {
            System.out.println("Room already exists");
           /* messagingService.sendToUserOne(principalId, "/queue/errors", "Room already exists");
            */messagingService.sendError(message.getSender(), "You can't create room" + roomId);
        } else {
            User owner = new User(null, message.getSender(), roomId, false, false, true, sessionId);
            userService.save(owner);
            messagingService.sendToUser(message.getSender(), "/queue/room", message);
        }
    }

    @MessageMapping("/room/{roomId}/join")
    public void joinRoom(
            @Payload ChatMessage message,
            @DestinationVariable String roomId,
            SimpMessageHeaderAccessor headers
    ) {
        String sessionId = headers.getSessionId();
        headers.getSessionAttributes().put("username", message.getSender());
        headers.getSessionAttributes().put("sessionid", sessionId);

        RoomService.JoinResult result =
                roomService.addUserToRoom(roomId, message.getSender(), sessionId);

        switch (result) {
            case ROOM_NOT_FOUND     -> messagingService.sendError(message.getSender(), "Room doesn't exist");
            case ROOM_FULL          -> messagingService.sendError(message.getSender(), "Room is full");
            case DUPLICATE_USERNAME -> messagingService.sendError(message.getSender(), "Username already taken");
            case OK                 -> messagingService.sendToTopic("/topic/room/" + roomId, message);
        }
    }

    // ─── In-game chat ────────────────────────────────────────────────────────

    @MessageMapping("/room/{roomId}/chat")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage sendMessageInRoom(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        return message;
    }

    // ─── Task completion ─────────────────────────────────────────────────────

    @MessageMapping("/room/{roomId}/task")
    public void handleTask(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        // Broadcast progress update so other players can see it
        messagingService.sendToTopic("/topic/room/" + roomId, message);

        if (message.getType() == ChatMessage.MsgType.TASK_COMPLETE) {
            roomService.handleTaskComplete(roomId, message.getSender())
                    .ifPresent(gameOver -> messagingService.sendToTopic("/topic/room/" + roomId, gameOver));
        }
    }

    // ─── Voting ──────────────────────────────────────────────────────────────

    @MessageMapping("/room/{roomId}/vote")
    public void handleVote(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        roomService.handleVote(roomId, message);
    }

    // ─── Sabotage (imposter) ─────────────────────────────────────────────────

   /* @MessageMapping("/room/{roomId}/sabotage")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage handleSabotage(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {

        return message;
    }*/
   @MessageMapping("/room/{roomId}/sabotage")//to implement in service instead of controller
  /* @SendTo("/topic/room/{roomId}")*/
   public void handleSabotaging(
           @Payload ChatMessage message  /*should be type sabotage in frontend    */,
           @DestinationVariable String roomId
         /*  @Payload Sabotage sabotage,
           @Payload String userSabotaged /* username of the sabotaged player*/
   ) {
       String userSabotaged=message.getTarget();
       System.out.println("message"+"\n"+userSabotaged);
       List<User> list = userService.findByRoom(roomId);
       System.out.println("sabotage"+message.getSabotage());
       if(userSabotaged==null){
        Random rand = new Random();
        int randomNum=rand.nextInt(3);
        User user = list.get(randomNum);
        String username = user.getUsername();
        System.out.println(user);

        messagingService.sendToUser(username, "/queue/room/" + roomId + "/sabotage", message);
        return;
       }

       messagingService.sendToUser(userSabotaged, "/queue/room/" + roomId + "/sabotage", message);
   }

    // ─── Emergency meeting (vote notification) ─────────────────────────────────────

    @MessageMapping("/room/{roomId}/emergency")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage handleEmergency(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        return message;
    }

    // ─── Compile Vote ─────────────────────────────────────
    @MessageMapping("/room/{roomId}/compile-vote-start")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage handleCompileVoteStart (
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        return message;
    }
    @MessageMapping("/room/{roomId}/compile-vote")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage handleCompileVoteCast(   @Payload ChatMessage message,
                                                @DestinationVariable String roomId) {
       return message;
    }

    // ─── Live code broadcast ──────────────────────────────────────────────────
    @MessageMapping("/room/{roomId}/code")
    @SendTo("/topic/room/{roomId}")
    public ChatMessage handleCodeUpdate(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        return message;
    }






    // ─── Game over (timer expired) ───────────────────────────────────────────

    @MessageMapping("/room/{roomId}/game-over")
    public void handleGameOver(
            @Payload ChatMessage message,
            @DestinationVariable String roomId
    ) {
        roomService.handleGameOver(roomId, message.getContent());
    }

    @MessageExceptionHandler
    public void handleException(Exception e) {
        System.out.println("WebSocket error: " + e.getMessage());
    }
}