package com.example.websocketchat.controller;

import com.example.websocketchat.model.Task;
import com.example.websocketchat.repository.TaskRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173/")
@AllArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<RoomTaskPlanResponse> getRoomTaskPlan(
            @PathVariable String roomId,
            @RequestParam String username
    ) {
        List<Task> tasks = taskRepository.findAll(Sort.by(Sort.Direction.ASC, "key"));
        if (tasks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Task> assigned = new ArrayList<>(tasks);
        assigned.sort((left, right) -> left.getKey().compareToIgnoreCase(right.getKey()));

        List<RoomTaskPlanResponse.TaskAssignment> assignedTasks = assigned.stream()
                .map(task -> RoomTaskPlanResponse.TaskAssignment.builder()
                        .key(task.getKey())
                        .title(task.getTitle())
                        .description(task.getDescription())
                        .resourceUrl(task.getResourceUrl())
                        .starterCode(task.getStarterCode())
                        .difficulty(task.getDifficulty())
                        .miniTaskLabel(buildMiniTaskLabel(task))
                        .build())
                .toList();

        Map<String, String> initialCode = new LinkedHashMap<>();
        for (Task task : assigned) {
            initialCode.put(task.getKey(), task.getStarterCode() == null ? "" : task.getStarterCode());
        }

        return ResponseEntity.ok(RoomTaskPlanResponse.builder()
                .roomId(roomId)
                .username(username)
                .tasks(assignedTasks)
                .initialCode(initialCode)
                .build());
    }

    private String buildMiniTaskLabel(Task task) {
        String title = task.getTitle() == null ? task.getKey() : task.getTitle();
        return "Mini task: " + title;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomTaskPlanResponse {
        private String roomId;
        private String username;
        private List<TaskAssignment> tasks;
        private Map<String, String> initialCode;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class TaskAssignment {
            private String key;
            private String title;
            private String description;
            private String resourceUrl;
            private String starterCode;
            private int difficulty;
            private String miniTaskLabel;
        }
    }
}
