package com.example.websocketchat.controller;

import com.example.websocketchat.analytics.AnalyticsService;
import com.example.websocketchat.analytics.AnalyticsSession;
import com.example.websocketchat.analytics.AnalyticsSessionRepository;
import com.example.websocketchat.analytics.PlayerMetrics;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173/")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AnalyticsSessionRepository analyticsSessionRepository;

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsController.class);

    @PostMapping("/player-metrics")
    public ResponseEntity<Void> receiveMetrics(@RequestBody PlayerMetrics metrics) {
        logger.info("Received metrics for {} in room {}: fileSwitches={}, timePerFile={}",
            metrics.getUsername(), metrics.getRoomId(),
            metrics.getFileSwitches(), metrics.getTimePerFile());
        analyticsService.storePlayerMetrics(metrics);
        return ResponseEntity.ok().build();
    }
    /*@PostMapping("/player-metrics")
    public ResponseEntity<Void> receiveMetrics(
            @RequestBody PlayerMetrics metrics) {
        analyticsService.storePlayerMetrics(metrics);
        return ResponseEntity.ok().build();
    }*/
    @GetMapping("/session/{roomId}")
    public ResponseEntity<AnalyticsSession> getSession(
            @PathVariable String roomId) {
        return analyticsSessionRepository.findByRoomId(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
