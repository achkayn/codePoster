package com.example.websocketchat.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

public class CustomHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        // Example: ws://localhost:8080/ws?username=John
        URI uri = request.getURI();
        String query = uri.getQuery();
        String sessionId = UUID.randomUUID().toString();
        attributes.put("sessionId", sessionId);

        if (query != null) {
            String[] params = query.split("&");
            for (String param : params) {
                String[] pair = param.split("=", 2);
                if (pair.length == 2 && "username".equals(pair[0])) {
                    attributes.put("username", pair[1]);
                    break;
                }
            }
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception ex) {
        // no-op
    }
}