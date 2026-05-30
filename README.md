# CodePoster

> A real-time multiplayer coding game built for ENSAM Meknès.  
> 4 players. 5 corrupted files. 1 impostor. 3 minutes.

---

## What is CodePoster?

CodePoster is an Among Us-inspired collaborative coding game. Players join a room, receive secret roles, and must repair 5 corrupted Python algorithm files using a shared code editor — while one player among them is secretly trying to sabotage the mission.

---

## Game Flow

```
Lobby → Create/Join Room → Waiting Room → Role Reveal → Game Room → Vote/Win
```

1. **Lobby** — enter username + room ID, connect via WebSocket
2. **Waiting Room** — up to 4 players join, all click Ready
3. **Role Assignment** — server randomly assigns 1 Impostor, 3 Crewmates
4. **Game Room** — collaborative coding on 5 Python tasks via shared Yjs editor
5. **Sabotage** — Impostor can Blackout, Lock Files, or Reset code
6. **Emergency Meeting** — any player can call a vote to eject a suspect
7. **Win/Lose** — crewmates win by completing all tasks or ejecting the impostor; impostor wins if timer expires or a crewmate is ejected

### Win Conditions

| Crewmates Win | Impostor Wins |
|---|---|
| All 5 tasks completed | Timer expires (3 min) |
| Impostor correctly ejected by vote | Innocent crewmate ejected |

---

## Tech Stack

### Backend
| Technology | Role |
|---|---|
| Java 21 | Runtime |
| Spring Boot 4.0 | Application framework |
| Spring WebSocket + STOMP | Real-time game events (server-authoritative) |
| MongoDB Atlas | User data, analytics, task storage |
| Redis | Session caching |
| Docker | Sandboxed Python code execution |
| Spring Actuator | Health monitoring |

### Frontend
| Technology | Role |
|---|---|
| React 19 + Vite | UI framework |
| Tailwind CSS | Styling |
| SockJS + STOMP.js | WebSocket client |
| Yjs + y-webrtc | P2P collaborative code editing (CRDT) |
| Three.js + GSAP | Visual effects |
| Lottie | Animations |

### Architecture

```
Browser A ──STOMP──┐                    ┌── MongoDB Atlas
Browser B ──STOMP──┤  Spring Boot 8080  ├── Redis :6379
Browser C ──STOMP──┤  (game authority)  ├── Docker (Python sandbox)
Browser D ──STOMP──┘                    └── Actuator /health

Browsers A↔B↔C↔D ── Yjs/WebRTC ── (P2P code sync, no server load)
```

STOMP handles all game events (join, vote, sabotage, game-over).
Yjs handles collaborative editing peer-to-peer.
Docker handles code execution in isolation.

---

## The 5 Tasks

Each task is stored in MongoDB and loaded at runtime. Players fix Python functions with corrupted or missing implementations.

| Task ID | Function | Difficulty |
|---|---|---|
| `neural_hash` | SHA-256 hex digest of a string | Normal |
| `data_sort` | Sort records by score desc, name asc | Easy |
| `auth_check` | Validate Bearer token format | Normal |
| `key_rotation` | Right-rotate a list by N positions | Normal |
| `grid_scan` | Find all positions of a value in a 2D grid | Hard |

---

## Project Structure

```
codePoster/
├── backend/
│   └── src/main/java/com/example/websocketchat/
│       ├── analytics/          # Event capture + session aggregation
│       │   ├── AnalyticsEvent.java
│       │   ├── AnalyticsEventRepository.java
│       │   ├── AnalyticsService.java
│       │   ├── AnalyticsSession.java
│       │   ├── SessionAggregationService.java
│       │   └── StompAnalyticsInterceptor.java
│       ├── config/             # WebSocket, Redis, Seeder, Handshake
│       ├── controller/         # Room, Chat, Compile, User endpoints
│       ├── model/              # User, Task, ChatMessage, Submission...
│       ├── repository/         # MongoDB repositories
│       └── service/            # RoomService, CompilerService, userService...
│   └── src/main/resources/
│       ├── application.properties
│       └── tasks-seed.json     # 5 tasks auto-seeded on first startup
│
└── frontend/
    └── src/
        ├── pages/              # Lobby, WaitingRoom, Room, Role, Reveal...
        ├── components/         # CodeEditor, LiveActivityPanel, UI kit
        ├── context/            # SocketContext (STOMP), YjsRoomContext
        └── assets/             # Animations, sounds, images
```

---

## Prerequisites

Before running the project, make sure you have:

- **Java 21** — `java -version`
- **Maven 3.9+** — included via `./mvnw`
- **Node.js 20+** — `node -v`
- **Redis** — running on `localhost:6379`
- **Docker** — running, with `python:3.11-slim` image pulled
- **MongoDB Atlas** — connection URI (or local MongoDB)

---

## Running Locally

### 1. Start Redis

```bash
# Option A — native
redis-server

# Option B — Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Pull the Python Docker image

```bash
docker pull python:3.11-slim
```

This is used for sandboxed code execution. Pull it once to avoid cold-start delays.

### 3. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

Expected output on first run:
```
✅ Mongo OK
Seeded 5 tasks into MongoDB tasks collection.
```

On subsequent runs:
```
✅ Mongo OK
Tasks collection already seeded (5 tasks found), skipping.
```

Backend runs on **http://localhost:8080**

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## How to Play (Local Test)

1. Open 4 browser tabs at `http://localhost:5173`
2. In each tab: enter a unique username + the same room ID → **Join Room**  
   *(or use one tab to create a room, others to join)*
3. In the Waiting Room, all 4 players click **Ready**
4. Roles are assigned — each player is redirected to their Role Reveal screen
5. Game begins — crewmates fix tasks in the shared editor, impostor sabotages
6. Call Emergency Meetings to vote out the impostor
7. Win or lose — session analytics are saved to MongoDB automatically

---

## Analytics

Every game session is automatically tracked:

- **`analytics_events`** collection — raw events (TTL: 7 days)  
  Captures: task completions, votes, sabotages, emergency meetings, compiles, game-over

- **`analytics_sessions`** collection — aggregated per-game summary  
  Contains: outcome, duration, impostor identity, per-player stats (tasks, votes, sabotages, compile results)

No auth required — analytics are keyed by username and roomId.

---

## API Reference

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/compile/` | Submit code for sandboxed execution |
| `GET` | `/api/getAllByRoom/{roomId}` | Get all players in a room |
| `GET` | `/api/{username}` | Get user by username |
| `GET` | `/health` | Spring Actuator health check |

### STOMP Destinations (send to `/app/...`)

| Destination | Description |
|---|---|
| `/app/createRoom/{roomId}` | Create a new room |
| `/app/chat-addUser/{roomId}` | Join waiting room |
| `/app/player-ready/{roomId}` | Mark player as ready |
| `/app/room/{roomId}/task` | Report task completion |
| `/app/room/{roomId}/vote` | Cast a vote |
| `/app/room/{roomId}/sabotage` | Trigger sabotage (impostor) |
| `/app/room/{roomId}/emergency` | Call emergency meeting |
| `/app/room/{roomId}/game-over` | Signal game over (timer) |
| `/app/compile` | Submit code via STOMP |

### STOMP Subscriptions (listen on `/topic/...` or `/queue/...`)

| Destination | Description |
|---|---|
| `/topic/waiting/{roomId}` | Waiting room events (JOIN, LEAVE, READY, START_GAME) |
| `/topic/room/{roomId}` | Game events (TASK_COMPLETE, VOTE_RESULT, GAME_OVER, SABOTAGE) |
| `/queue/role/{username}` | Private role assignment |
| `/queue/errors/{username}` | Private error messages |

---

## Known Limitations (MVP)

- No authentication — username only, no JWT
- Yjs signaling uses public WebRTC servers (self-host recommended for production)
- Frontend hardcoded to `localhost:8080` — needs env config for deployment
- Single-instance backend — no horizontal scaling yet

---

## Built at ENSAM Meknès
Academic project — Game Design meets Software Engineering.
