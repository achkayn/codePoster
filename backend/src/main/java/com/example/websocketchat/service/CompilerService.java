package com.example.websocketchat.service;


import com.example.websocketchat.analytics.AnalyticsService;
import com.example.websocketchat.model.Submission;
import com.example.websocketchat.model.Task;
import com.example.websocketchat.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CompilerService {
    private final TaskRepository taskRepository;
    private final AnalyticsService analyticsService;

    public String compileAndTestPython(Submission request) throws Exception {
        if (request.getTaskId() == null || request.getTaskId().isBlank()) {
            return "UNKNOWN_TASK";
        }

        Task task = taskRepository.findByKey(request.getTaskId())
                .orElse(null);
        if (task == null || task.getTestScript() == null) {
            return "UNKNOWN_TASK";
        }

        Path tempDir = Files.createTempDirectory("submission-");

        try {
            for (Map.Entry<String, String> entry : request.getFiles().entrySet()) {
                Path filePath = tempDir.resolve(entry.getKey());
                Files.createDirectories(filePath.getParent());
                Files.writeString(filePath, entry.getValue());
            }

            Files.writeString(tempDir.resolve("test_runner.py"), task.getTestScript());

            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "run",
                    "--rm",
                    "--network", "none",
                    "--memory", "100m",
                    "--cpus", "0.5",
                    "-v", tempDir.toAbsolutePath() + ":/app",
                    "-w", "/app",
                    "python:3.11-slim",
                    "python", "test_runner.py"
            );

            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            while ((line = errorReader.readLine()) != null) {
                output.append(line).append("\n");
            }

            boolean finished = process.waitFor(3, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                recordCompile(request, "TIME_LIMIT_EXCEEDED");
                return "TIME_LIMIT_EXCEEDED";
            }

            String outputText = output.toString();
            recordCompile(request, outputText);
            return outputText;
        } finally {
            try (Stream<Path> walk = Files.walk(tempDir)) {
                walk.sorted(Comparator.reverseOrder())
                        .forEach(p -> p.toFile().delete());
            } catch (Exception ignored) {
            }
        }
    }

    private void recordCompile(Submission request, String output) {
        String verdict = output.lines().findFirst().orElse("UNKNOWN").trim();
        analyticsService.record(
                "COMPILE",
                request.getRoomId(),
                request.getUsername(),
                request.getTaskId() + ":" + verdict
        );
    }
}