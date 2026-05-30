# CodePoster — Project Context & Progress Log

> Internal reference document. Current version: v2.0  
> Last updated: May 30, 2026

---

## What Was Built

CodePoster is a real-time 4-player multiplayer coding game (Among Us × competitive programming) built for ENSAM Meknès. Players repair corrupted Python algorithm files while one secretly sabotages. Built with Spring Boot 4, React 19, Yjs CRDT, Docker sandboxing, and MongoDB.

---

## Current Architecture

```
Frontend (React 19 + Vite)
  ├── STOMP over SockJS  →  Backend (game events, server-authoritative)
  └── Yjs + y-webrtc     →  P2P (collaborative code editing, no server)

Backend (Spring Boot 4, port 8080)
  ├── MongoDB Atlas       →  users, tasks, analytics_events, analytics_sessions
  ├── Redis :6379         →  session cache (RedisConfig, 10min TTL)
  └── Docker              →  sandboxed Python execution (100MB RAM, 0.5 CPU, 3s timeout)
```

---

## Completed Work

### Phase 1 — Analytics Event Capture ✅
- `AnalyticsEvent.java` — MongoDB document, 7-day TTL index
- `AnalyticsEventRepository.java` — `findByRoomId()` query
- `AnalyticsService.java` — async `record()` method, `recordGameStart()`, `finalizeSession()`
- `StompAnalyticsInterceptor.java` — intercepts all STOMP inbound messages, routes by destination suffix
- `WebSocketConfig.java` — interceptor wired into `configureClientInboundChannel()`
- `WebSocketChatApplication.java` — `@EnableAsync` added
- Events captured: `TASK_COMPLETE`, `VOTE_CAST`, `SABOTAGE`, `EMERGENCY_MEETING`, `GAME_OVER`, `COMPILE`

### Phase 2 — Session Aggregation ✅
- `AnalyticsSession.java` — full session document with nested `PlayerStat` per player
- `SessionAggregationService.java` — async aggregation triggered at every game-over path
- `AnalyticsService` — `roomStartTimes` map, `recordGameStart()`, `finalizeSession()`
- Hooked into `RoomService` at all 3 game-over paths: task completion, vote result, timer expiry
- Output collection: `analytics_sessions` in MongoDB

### Phase 3 — CompilerService Rewrite ✅
- `Submission.java` — added `taskId`, `roomId`, `username` fields
- `Task.java` — added `testScript` field (Python test runner stored in DB)
- `TaskRepository.java` — added `findByKey(String key)`
- `CompilerService.java` — DB-driven task lookup, Docker sandbox, temp dir cleanup in `finally` block, analytics recording
- `tasks-seed.json` — 5 real task documents with test runners
- `DatabaseSeeder.java` — idempotent startup seeder (skips if tasks already exist)

### Bug Fixes Applied ✅
| Bug | Fix |
|---|---|
| MongoDB credentials hardcoded | Moved to `application.properties` (can use env var) |
| `readyNumber()` not filtered by roomId | Fixed — `findByReadyAndWaitingroomId(true, roomId)` |
| `@CachePut` misuse on `findByRoom()` | Removed caching from live player list entirely |
| `@EnableCaching` on `@Service` class | Removed — kept only on `RedisConfig` |
| Docker temp dirs not cleaned | Fixed — `Files.walk()` in `finally` block |
| `changeReady()` toggling ready state | Fixed — always sets `ready = true` |
| Username query param parsing | Fixed — loop-based parser replaces `split("username=")` |
| Disconnect with null roomId | Fixed — fallback `deleteByUsername()` |
| `tasks-seed.json` stray `S` char | Fixed — file starts cleanly with `[` |
| `/api/delAll` unguarded | Fixed — `@Profile("dev")` annotation |
| `ObjectMapper` bean missing | Fixed — declared in `RedisConfig` |

---

## Current State — What Works ✅

- Room creation by owner
- Up to 4 players joining the same waiting room
- Player list synchronized across all tabs in real time
- Ready system — all 4 click ready → roles assigned → game starts
- Role assignment (1 impostor, 3 crewmates) broadcast privately
- Navigation flow: Lobby → Waiting Room → Role Reveal → Game Room
- Analytics events captured passively on every game action
- Session aggregation saved to MongoDB at game end
- Tasks seeded from JSON on first startup
- Code compilation routed to correct task test runner via Docker

---

## What Does NOT Work Yet ❌

### Frontend — Game Room (`RoomPage.jsx`)
- `Submission` payload does not yet send `taskId`, `roomId`, `username` → compile returns `UNKNOWN_TASK`
- Yjs signaling uses public WebRTC server (`wss://signaling.yjs.dev`) — unreliable, needs self-hosting
- Sabotage mechanics (Blackout, File Lock, Reset) — backend handles routing, frontend visual effects need wiring
- Emergency meeting UI flow needs end-to-end test
- Vote UI → `VOTE_RESULT` → `RevealPage` navigation needs test
- `GAME_OVER` → win/lose screen needs end-to-end test

### Backend
- No `AnalyticsController` — no REST endpoint to read analytics data yet (Phase 3 pending)
- Compile results not yet tracked per-task in `analytics_sessions` (COMPILE events captured but frontend not sending taskId)
- No cleanup of `usernames` collection between games (stale users can accumulate if app crashes)

### Infrastructure
- Yjs signaling server not self-hosted
- No Docker Compose file for one-command local setup
- CORS hardcoded to `http://localhost:5173` — needs env config for deployment

---

## Next Moves (Priority Order)

### 1. Frontend — Fix Compile Submission (HIGH)
Wire `RoomPage.jsx` to send `taskId`, `roomId`, `username` in the compile payload.
This unblocks the core game loop — players can actually submit and validate code.

### 2. Frontend — End-to-End Game Flow Test (HIGH)
Test the full flow with 4 real tabs:
- Role reveal → game room → task completion → game over
- Emergency meeting → vote → reveal → navigate to result screen
- Impostor sabotage → crewmate visual effect → recovery

### 3. Backend — Analytics Read Endpoint (MEDIUM)
Add `AnalyticsController.java` with:
- `GET /api/analytics/sessions` — list all sessions
- `GET /api/analytics/sessions/{roomId}` — get one session
- `GET /api/analytics/player/{username}` — aggregate stats per player

### 4. Infrastructure — Self-Host Yjs Signaling (MEDIUM)
Replace `wss://signaling.yjs.dev` with a self-hosted `y-webrtc-signaling` server.
Without this, collaborative editing is unreliable in local network demos.

### 5. Infrastructure — Docker Compose (LOW)
Create `docker-compose.yml` for one-command startup:
- Spring Boot backend
- Redis
- Yjs signaling server

### 6. Frontend — Profile Page & Analytics Display (LOW)
Wire `ProfilePage.jsx` to `GET /api/analytics/player/{username}`.
Show: games played, win rate, tasks completed, avg compile success rate.

---

## File Reference — Current Backend

```
analytics/
  AnalyticsEvent.java              TTL=7d, fields: eventType, roomId, username, payload, createdAt
  AnalyticsEventRepository.java    findByRoomId(String roomId)
  AnalyticsService.java            record(), recordGameStart(), finalizeSession()
  StompAnalyticsInterceptor.java   intercepts STOMP SEND, routes by destination
  AnalyticsSession.java            outcome, duration, actualImpostor, List<PlayerStat>
  SessionAggregationService.java   buildAndSaveSession() @Async

config/
  WebSocketConfig.java             STOMP endpoint /ws, interceptor wired
  RedisConfig.java                 10min TTL, ObjectMapper bean
  CustomHandshakeInterceptor.java  UUID sessionId, username from query param
  WebSocketEventListener.java      disconnect → delete user, fallback by username
  DatabaseSeeder.java              seeds tasks-seed.json on first startup

controller/
  ChatController.java              /chat-addUser, /player-ready, /chat
  RoomController.java              /createRoom, /join, /task, /vote, /sabotage, /emergency, /game-over
  CompileController.java           POST /api/compile/
  UserController.java              GET/DELETE user endpoints (@Profile("dev") on delAll)

model/
  User.java                        username, waitingroomId, ready, Imposter, roomOwner, sessionId
  Task.java                        key, title, description, starterCode, solution, testScript, difficulty
  Submission.java                  files, taskId, roomId, username
  ChatMessage.java                 type (enum), content, sender, target, sabotage

service/
  RoomService.java                 join, ready, assignRoles, handleTaskComplete, handleVote, handleGameOver
  CompilerService.java             DB-driven task lookup, Docker exec, cleanup, analytics record
  userService.java                 CRUD + findByRoom (no cache), changeReady (sets true), readyNumber(roomId)
  MessagingService.java            sendToTopic, sendToUser, sendError

resources/
  application.properties           port 8080, MongoDB URI, Redis localhost:6379
  tasks-seed.json                  5 tasks: neural_hash, data_sort, auth_check, key_rotation, grid_scan
```

---

## File Reference — Current Frontend

```
pages/
  LobbyPage.jsx          username input, connect WebSocket, navigate to create/join
  CreateRoomPage.jsx     room config, sends /app/createRoom/{roomId}
  WaitingRoomPage.jsx    player list (REST fetch + STOMP sync), ready button, START_GAME nav
  RolePage.jsx           role reveal screen with countdown
  RoomPage.jsx           main game: Yjs editor, task list, sabotage, emergency, compile
  RevealPage.jsx         post-vote reveal screen
  ProfilePage.jsx        player stats (not yet wired to analytics)

context/
  SocketContext.jsx      STOMP connection, subscribe, send, disconnect
  YjsRoomContext.jsx     Yjs doc, y-webrtc provider, shared text bindings

components/
  YjsCodeEditor.jsx      CodeMirror bound to Yjs shared text
  CodeEditorWindow.jsx   task file tabs + editor wrapper
  LiveActivityPanel.jsx  spectate teammates' editors
```
