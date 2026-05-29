package com.example.websocketchat.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "analytics_events")
public class AnalyticsEvent {
    @Id
    private String id;
    private String eventType;
    private String roomId;
    private String username;
    private String payload;

    @Builder.Default
    @Indexed(expireAfterSeconds = 604800)
    private Instant createdAt = Instant.now();
}
