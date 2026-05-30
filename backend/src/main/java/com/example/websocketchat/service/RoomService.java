package com.example.websocketchat.service;

import com.example.websocketchat.analytics.AnalyticsService;
import com.example.websocketchat.model.ChatMessage;
import com.example.websocketchat.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final userService userService;
    private final MessagingService messagingService;
    private final AnalyticsService analyticsService;

    // Prevent double role-assignment per room
    private final ConcurrentHashMap<String, Boolean> rolesAssignedByRoom = new ConcurrentHashMap<>();

    // Vote tracking: roomId → { voter → votedFor }
    private final ConcurrentHashMap<String, Map<String, String>> votesByRoom = new ConcurrentHashMap<>();

    // Task completion tracking: roomId → { set of usernames that finished all tasks }
    private final ConcurrentHashMap<String, Set<String>> completedPlayersByRoom = new ConcurrentHashMap<>();

    // ─── Join ────────────────────────────────────────────────────────────────

    public JoinResult addUserToRoom(String roomId, String username, String sessionId) {
        if (!userService.checkExistingRoom(roomId)) {
            return JoinResult.ROOM_NOT_FOUND;
        }
        List<User> users = userService.findByRoom(roomId);
        if (users.size() >= 4) {
            return JoinResult.ROOM_FULL;
        }
        boolean duplicate = users.stream()
                .anyMatch(u -> u.getUsername().equals(username)
                        && !u.getSessionId().equals(sessionId));
        if (duplicate) {
            return JoinResult.DUPLICATE_USERNAME;
        }
        boolean alreadySaved = userService.findBySessionId(sessionId) != null;
        if (!alreadySaved) {

            userService.save(new User(null, username, roomId, false, false, false, sessionId));

        }

        return JoinResult.OK;

    }

    // ─── Ready / Role assignment ─────────────────────────────────────────────

    public void handlePlayerReady(String roomId, String username) {
        userService.changeReady(username,roomId);
        int readyCount = userService.readyNumber(roomId);

        rolesAssignedByRoom.putIfAbsent(roomId, false);
        if (readyCount == 4 && rolesAssignedByRoom.replace(roomId, false, true)) {
            assignRoles(roomId, username);
        }
    }

    private void assignRoles(String roomId, String triggeringUser) {
        List<User> users = userService.findByRoom(roomId);
        int impostorIndex = ThreadLocalRandom.current().nextInt(users.size());

        for (int i = 0; i < users.size(); i++) {
            User player = users.get(i);
            boolean isImpostor = (i == impostorIndex);
            player.setImposter(isImpostor);
            userService.save(player);

            String role = isImpostor ? "imposter" : "crewmate";
            System.out.println("Role: " + role+"user"+player.getUsername());
            messagingService.sendToUser(player.getUsername(), "/queue/role", role);
        }

        messagingService.sendToTopic("/topic/waiting/" + roomId,
                ChatMessage.builder()
                        .type(ChatMessage.MsgType.START_GAME)
                        .sender(triggeringUser)
                        .build());
        analyticsService.recordGameStart(roomId);
    }

    // ─── Task completion ─────────────────────────────────────────────────────

    /**
     * Called when a crewmate finishes all their tasks.
     * Returns a GAME_OVER message if all crewmates are done.
     */
    public Optional<ChatMessage> handleTaskComplete(String roomId, String username) {
        List<User> allPlayers = userService.findByRoom(roomId);

        // Imposters completing tasks don't count toward crewmate victory
        boolean isImposter = allPlayers.stream()
                .filter(u -> u.getUsername().equals(username))
                .findFirst()
                .map(User::isImposter)
                .orElse(false);
        if (isImposter) return Optional.empty();

        completedPlayersByRoom.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        completedPlayersByRoom.get(roomId).add(username);

        long crewmateCount = allPlayers.stream().filter(u -> !u.isImposter()).count();
        long doneCount = completedPlayersByRoom.get(roomId).size();

        if (doneCount >= crewmateCount && crewmateCount > 0) {
            String imposterName = allPlayers.stream()
                    .filter(User::isImposter)
                    .findFirst()
                    .map(User::getUsername)
                    .orElse("Unknown");
            analyticsService.finalizeSession(roomId, "crewmates_win", imposterName);
            cleanupRoom(roomId);
            return Optional.of(ChatMessage.builder()
                    .type(ChatMessage.MsgType.GAME_OVER)
                    .content("crewmates_win")
                    .sender("SYSTEM")
                    .target(imposterName)
                    .build());
        }
        return Optional.empty();
    }

    // ─── Voting ──────────────────────────────────────────────────────────────

    /**
     * Records a vote. Once a majority is reached (or all players have voted),
     * broadcasts VOTE_RESULT to the room.
     */
    public void handleVote(String roomId, ChatMessage voteMsg) {
        votesByRoom.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());
        Map<String, String> votes = votesByRoom.get(roomId);
        votes.put(voteMsg.getSender(), voteMsg.getContent()); // content = voted-for username

        List<User> allPlayers = userService.findByRoom(roomId);
        int total = allPlayers.size();
        int majority = (total / 2) + 1;

        Map<String, Long> tally = votes.values().stream()
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()));

        boolean majorityReached = tally.values().stream().anyMatch(c -> c >= majority);
        boolean allVoted = votes.size() >= total;

        if (!majorityReached && !allVoted) return; // keep waiting

        // Determine who gets ejected
        String ejected = tally.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("nobody");

        String actualImposter = allPlayers.stream()
                .filter(User::isImposter)
                .findFirst()
                .map(User::getUsername)
                .orElse("Unknown");

        boolean ejectedIsImposter = allPlayers.stream()
                .filter(u -> u.getUsername().equals(ejected))
                .findFirst()
                .map(User::isImposter)
                .orElse(false);

        String outcome = ejectedIsImposter ? "crewmates_win" : "imposter_wins";


        votesByRoom.remove(roomId);
        analyticsService.finalizeSession(roomId, outcome, actualImposter);
        cleanupRoom(roomId);


        messagingService.sendToTopic("/topic/room/" + roomId,
                ChatMessage.builder()
                        .type(ChatMessage.MsgType.VOTE_RESULT)
                        .sender(ejected)          // ejected player
                        .content(outcome)          // win condition
                        .target(actualImposter)    // reveal true imposter
                        .build());
    }

    // ─── Game over (timeout) ─────────────────────────────────────────────────

    /**
     * Called when the client-side timer expires.
     * Resolves the imposter name and broadcasts GAME_OVER to the room.
     */
    public void handleGameOver(String roomId, String triggerContent) {
        List<User> allPlayers = userService.findByRoom(roomId);
        String imposterName = allPlayers.stream()
                .filter(User::isImposter)
                .findFirst()
                .map(User::getUsername)
                .orElse("Unknown");

        analyticsService.finalizeSession(roomId, triggerContent, imposterName);
        cleanupRoom(roomId);

        messagingService.sendToTopic("/topic/room/" + roomId,
                ChatMessage.builder()
                        .type(ChatMessage.MsgType.GAME_OVER)
                        .content(triggerContent)   // "imposter_wins" or "crewmates_win"
                        .sender("SYSTEM")
                        .target(imposterName)
                        .build());
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    private void cleanupRoom(String roomId) {
        votesByRoom.remove(roomId);
        completedPlayersByRoom.remove(roomId);
    }

    public enum JoinResult { OK, ROOM_NOT_FOUND, ROOM_FULL, DUPLICATE_USERNAME }
}