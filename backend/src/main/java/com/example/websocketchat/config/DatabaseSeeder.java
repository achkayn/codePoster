package com.example.websocketchat.config;

import com.example.websocketchat.model.Task;
import com.example.websocketchat.repository.TaskRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Bean
    public ApplicationRunner seedTasks() {
        return args -> {
            if (taskRepository.count() > 0) {
                logger.info("Tasks collection already seeded ({} tasks found), skipping.",
                        taskRepository.count());
                return;
            }
            try {
                ClassPathResource resource = new ClassPathResource("tasks-seed.json");
                List<Task> tasks = objectMapper.readValue(
                        resource.getInputStream(),
                        new TypeReference<List<Task>>() {}
                );
                taskRepository.saveAll(tasks);
                logger.info("Seeded {} tasks into MongoDB tasks collection.", tasks.size());
            } catch (Exception e) {
                logger.error("Failed to seed tasks collection.", e);
            }
        };
    }
}
