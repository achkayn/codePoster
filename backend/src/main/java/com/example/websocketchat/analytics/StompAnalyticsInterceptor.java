package com.example.websocketchat.analytics;

import com.example.websocketchat.model.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class StompAnalyticsInterceptor implements ChannelInterceptor {
    private static final Pattern ROOM_PATTERN = Pattern.compile("^/app/room/([^/]+)(/.*)?$");

    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        try {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null || accessor.getCommand() != StompCommand.SEND) {
                return message;
            }

            String destination = accessor.getDestination();
            if (destination == null) {
                return message;
            }

            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            String username = sessionAttributes != null ? (String) sessionAttributes.get("username") : null;
            if (username == null) {
                username = "unknown";
            }

            String roomId = "unknown";
            Matcher matcher = ROOM_PATTERN.matcher(destination);
            if (matcher.find()) {
                roomId = matcher.group(1);
            }

            Object payloadObj = message.getPayload();
            if (!(payloadObj instanceof byte[] payloadBytes)) {
                return message;
            }

            ChatMessage chatMessage = objectMapper.readValue(payloadBytes, ChatMessage.class);

            if (destination.endsWith("/task")) {
                if (chatMessage.getType() == ChatMessage.MsgType.TASK_COMPLETE) {
                    analyticsService.record("TASK_COMPLETE", roomId, username, chatMessage.getContent());
                } else if (chatMessage.getType() == ChatMessage.MsgType.TASK_STEP_COMPLETE) {
                    analyticsService.record("TASK_STEP_COMPLETE", roomId, username, chatMessage.getContent());
                }
            } else if (destination.endsWith("/vote")) {
                analyticsService.record("VOTE_CAST", roomId, username, "voted_for=" + chatMessage.getContent());
            } else if (destination.endsWith("/sabotage")) {
                analyticsService.record("SABOTAGE", roomId, username, "target=" + chatMessage.getTarget());
            } else if (destination.endsWith("/emergency")) {
                analyticsService.record("EMERGENCY_MEETING", roomId, username, "");
            } else if (destination.endsWith("/game-over")) {
                analyticsService.record("GAME_OVER", roomId, "SYSTEM", chatMessage.getContent());
            }
        } catch (Exception e) {
            // Never block or throw from analytics
        }

        return message;
    }
}
