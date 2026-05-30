package com.example.websocketchat.analytics;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionAggregationService {
    private static final Logger logger = LoggerFactory.getLogger(SessionAggregationService.class);

    private final AnalyticsEventRepository eventRepository;
    private final MongoTemplate mongoTemplate;

    @Async
    public void buildAndSaveSession(String roomId, String outcome, String actualImpostor, Instant gameStartedAt) {
        try {
            List<AnalyticsEvent> events = eventRepository.findByRoomId(roomId);
            if (events.isEmpty()) {
                logger.warn("No analytics events found for roomId {}", roomId);
                return;
            }

            Instant endedAt = Instant.now();
            long durationSeconds = ChronoUnit.SECONDS.between(gameStartedAt, endedAt);

            int totalVotes = (int) events.stream()
                    .filter(e -> "VOTE_CAST".equals(e.getEventType()))
                    .count();
            int totalSabotages = (int) events.stream()
                    .filter(e -> "SABOTAGE".equals(e.getEventType()))
                    .count();
            int totalEmergencyMeetings = (int) events.stream()
                    .filter(e -> "EMERGENCY_MEETING".equals(e.getEventType()))
                    .count();
            boolean impostorEjectedByVote = "crewmates_win".equals(outcome) && totalVotes > 0;

            Set<String> usernames = events.stream()
                    .map(AnalyticsEvent::getUsername)
                    .filter(u -> u != null && !"SYSTEM".equals(u))
                    .collect(Collectors.toSet());

            List<AnalyticsSession.PlayerStat> playerStats = usernames.stream()
                    .map(username -> {
                        String role = username.equals(actualImpostor) ? "impostor" : "crewmate";
                        boolean won = "impostor".equals(role)
                                ? "imposter_wins".equals(outcome)
                                : "crewmates_win".equals(outcome);
                        int tasksCompleted = (int) events.stream()
                                .filter(e -> "TASK_COMPLETE".equals(e.getEventType())
                                        && username.equals(e.getUsername()))
                                .count();
                        int votesCast = (int) events.stream()
                                .filter(e -> "VOTE_CAST".equals(e.getEventType())
                                        && username.equals(e.getUsername()))
                                .count();
                        int sabotagesTriggered = (int) events.stream()
                                .filter(e -> "SABOTAGE".equals(e.getEventType())
                                        && username.equals(e.getUsername()))
                                .count();
                        List<String> compileResults = events.stream()
                                .filter(e -> "COMPILE".equals(e.getEventType())
                                        && username.equals(e.getUsername()))
                                .map(AnalyticsEvent::getPayload)
                                .collect(Collectors.toList());

                        return AnalyticsSession.PlayerStat.builder()
                                .username(username)
                                .role(role)
                                .won(won)
                                .tasksCompleted(tasksCompleted)
                                .votesCast(votesCast)
                                .sabotagesTriggered(sabotagesTriggered)
                                .compileResults(compileResults)
                                .build();
                    })
                    .collect(Collectors.toList());

            AnalyticsSession session = AnalyticsSession.builder()
                    .roomId(roomId)
                    .startedAt(gameStartedAt)
                    .endedAt(endedAt)
                    .durationSeconds(durationSeconds)
                    .outcome(outcome)
                    .actualImpostor(actualImpostor)
                    .impostorEjectedByVote(impostorEjectedByVote)
                    .totalVotes(totalVotes)
                    .totalSabotages(totalSabotages)
                    .totalEmergencyMeetings(totalEmergencyMeetings)
                    .players(playerStats)
                    .build();

            mongoTemplate.save(session, "analytics_sessions");
        } catch (Exception e) {
            logger.error("Failed to build analytics session", e);
        }
    }
}
