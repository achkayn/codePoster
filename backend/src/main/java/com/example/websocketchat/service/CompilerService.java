package com.example.websocketchat.service;


import com.example.websocketchat.model.Submission;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Service
public class CompilerService {
    public String compileAndTestPython(Submission request) throws Exception {

        Path tempDir = Files.createTempDirectory("submission-");

        // 1. Write user files
        for (Map.Entry<String, String> entry : request.getFiles().entrySet()) {
            Path filePath = tempDir.resolve(entry.getKey());
            Files.createDirectories(filePath.getParent());
            Files.writeString(filePath, entry.getValue());
        }

        // 2. Create a test runner file
        String testRunner = """
                import sys
                import traceback
                
                try:
                    from solution import pattern_match
                
                    g = ["axnexus", "bznexus", "cwnone"]
                    result = pattern_match(g, "nexus")
                
                    expected = [(0, 2), (1, 2)]
                
                    if result == expected:
                        print("ACCEPTED")
                    else:
                        print("WRONG_ANSWER")
                        print("Expected:", expected)
                        print("Got:", result)
                
                except Exception as e:
                    print("RUNTIME_ERROR")
                    traceback.print_exc()
                """;

        Files.writeString(tempDir.resolve("test_runner.py"), testRunner);

        // 3. Run inside Docker
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

        boolean finished = process.waitFor(3, java.util.concurrent.TimeUnit.SECONDS);

        if (!finished) {
            process.destroyForcibly();
            return "TIME_LIMIT_EXCEEDED";
        }

        return output.toString();

    }
}