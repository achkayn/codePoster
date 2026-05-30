package com.example.websocketchat.analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerMetrics {
    private String roomId;
    private String username;
    private Map<String, Integer> timePerFile;
    private Map<String, Integer> keystrokesPerFile;
    private int fileSwitches;
}
