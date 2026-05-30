package com.example.websocketchat.analytics;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AnalyticsEventRepository extends MongoRepository<AnalyticsEvent, String> {
    List<AnalyticsEvent> findByRoomId(String roomId);
}
