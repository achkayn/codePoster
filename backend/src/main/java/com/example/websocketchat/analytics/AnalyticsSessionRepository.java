package com.example.websocketchat.analytics;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AnalyticsSessionRepository
        extends MongoRepository<AnalyticsSession, String> {
    Optional<AnalyticsSession> findByRoomId(String roomId);
}
