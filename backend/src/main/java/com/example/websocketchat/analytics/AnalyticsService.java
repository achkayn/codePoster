package com.example.websocketchat.analytics;

// Requires @EnableAsync on WebSocketChatApplication
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    private final AnalyticsEventRepository analyticsEventRepository;
    private final SessionAggregationService sessionAggregationService;
    private final ConcurrentHashMap<String, Instant> roomStartTimes = new ConcurrentHashMap<>();

    @Async
    public void record(String eventType, String roomId, String username, String payload) {
        try {
            AnalyticsEvent event = AnalyticsEvent.builder()
                    .eventType(eventType)
                    .roomId(roomId)
                    .username(username)
                    .payload(payload)
                    .build();
            analyticsEventRepository.save(event);
        } catch (Exception e) {
            logger.error("Analytics record failed", e);
        }
    }

    public void recordGameStart(String roomId) {
        roomStartTimes.putIfAbsent(roomId, Instant.now());
    }

    public void finalizeSession(String roomId, String outcome, String actualImpostor) {
        Instant startedAt = roomStartTimes.getOrDefault(roomId, Instant.now());
        sessionAggregationService.buildAndSaveSession(roomId, outcome, actualImpostor, startedAt);
        roomStartTimes.remove(roomId);
    }
}
