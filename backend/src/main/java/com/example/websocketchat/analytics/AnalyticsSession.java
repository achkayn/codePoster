package com.example.websocketchat.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "analytics_sessions")
public class AnalyticsSession {
    @Id
    private String id;
    private String roomId;
    private Instant startedAt;
    private Instant endedAt;
    private long durationSeconds;
    private String outcome;
    private String actualImpostor;
    private boolean impostorEjectedByVote;
    private int totalVotes;
    private int totalSabotages;
    private int totalEmergencyMeetings;
    private List<PlayerStat> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerStat {
        private String username;
        private String role;
        private boolean won;
        private boolean votedCorrectly;
        private List<String> tasksCompleted;
        private int votesCast;
        private int sabotagesTriggered;
        private Map<String, String> compilationResults;
        private Map<String, Integer> timePerFile;
        private Map<String, Integer> keystrokesPerFile;
        private int fileSwitches;
    }
}
