# CodePoster — Contexte complet du projet

> Fichier à coller en début de nouvelle session pour reprendre exactement là où on s'est arrêté.
> Dernière mise à jour : 29 mai 2026

---

## 1. Qui suis-je / qui sommes-nous

- **Équipe** : Aymane EDDAMANE & Taha HOUMMADI — étudiants ingénieurs, ENSAM Meknès
- **Projet** : CodePoster — projet académique présenté à un enseignant
- **Rapport** : déjà produit et compilé en PDF LaTeX (voir §10)

---

## 2. CodePoster — Qu'est-ce que c'est

Jeu de programmation multijoueur en temps réel inspiré d'"Among Us". Jusqu'à **4 joueurs** rejoignent une salle, reçoivent un rôle secret (**crewmate** ou **imposteur**) et doivent corriger **5 fichiers Python corrompus** dans un délai imparti.

### Règles du jeu

1. Créer ou rejoindre une salle via le Lobby
2. Attribution aléatoire : 3 crewmates + 1 imposteur
3. Les crewmates réparent les 5 fichiers Python en collaboration (éditeur Yjs partagé)
4. L'imposteur peut saboter la progression d'un joueur
5. N'importe qui peut déclencher une réunion d'urgence
6. Vote d'exclusion à la majorité → le plus voté est éjecté
7. Révélation du rôle et annonce du résultat

### Conditions de victoire

| Condition | Vainqueur | Déclencheur backend |
|---|---|---|
| Tous les crewmates finissent leurs tâches | Crewmates | `handleTaskComplete()` |
| L'imposteur est éjecté par vote | Crewmates | `ejectedIsImposter = true` |
| Vote éjecte un crewmate | Imposteur | `ejectedIsImposter = false` |
| Timer expire | Imposteur | `handleGameOver()` |

### Les 5 tâches Python (hardcodées côté frontend — `YjsRoomContext.jsx`)

| Clé fichier | Description |
|---|---|
| `neural_hash` | Implémentation d'une fonction de hachage |
| `data_sort` | Algorithme de tri de données |
| `auth_check` | Vérification d'authentification / tokens |
| `key_rotation` | Rotation de clés cryptographiques |
| `grid_scan` | Parcours / analyse de grille 2D |

---

## 3. Stack technique complète

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| Java | 21 (LTS) | Langage principal |
| Spring Boot | 4.0.3 | Framework applicatif |
| Spring WebSocket + STOMP | — | Messagerie temps réel |
| Spring Data MongoDB | — | Persistance utilisateurs |
| Spring Data Redis | — | Cache listes de joueurs par salle |
| Spring Boot Actuator | — | Health check `/actuator/health` |
| Lombok | stable | Réduction boilerplate |
| Docker (python:3.11-slim) | runtime | Sandbox d'exécution Python isolé |

### Frontend

| Technologie | Version | Rôle |
|---|---|---|
| React | 19.2.0 | UI principale |
| React Router | 7.13.0 | Navigation SPA |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.18 | Styling |
| GSAP + @gsap/react | 3.14.2 | Animations avancées |
| Three.js + @react-three/fiber | 0.182.0 / 9.5.0 | Rendus 3D / shaders |
| Lottie-react | 2.4.1 | Animations JSON |
| SockJS-client + stompjs | 1.6.1 / 2.3.3 | Client WebSocket STOMP |
| Yjs | 13.6.30 | CRDT collaboration temps réel |
| y-webrtc | 10.3.0 | Transport WebRTC P2P |
| lucide-react | 0.563.0 | Icônes |

---

## 4. Architecture globale

```
Client React (Vite 7)
    │
    ├── WebSocket STOMP (SockJS) ──────► Backend Spring Boot 4
    │                                        │
    └── Yjs + WebRTC (P2P) ─────────────────├── MongoDB Atlas  (users)
         └─► Signaling public (yjs.dev)      ├── Redis Cache    (rooms)
                                             ├── Docker Python  (sandbox)
                                             └── Actuator       (/health)
```

### Principes clés

- **STOMP** pour tous les événements de jeu (serveur → tous les joueurs)
- **Yjs CRDT** pour la synchronisation du code en P2P (aucune charge serveur)
- **Docker isolé** : `--network none`, 100 Mo RAM, 0.5 CPU, timeout 3s
- **`ConcurrentHashMap`** in-memory pour les votes et la progression des tâches

---

## 5. Structure des packages backend

```
com.example.websocketchat
├── analytics/                        ← NOUVEAU package (en cours d'implémentation)
│   ├── interceptor/
│   ├── model/
│   ├── repository/
│   ├── service/
│   └── controller/
├── config/
│   ├── WebSocketConfig.java          (endpoint /ws, préfixes /app /topic /queue)
│   ├── RedisConfig.java
│   ├── CustomHandshakeInterceptor    (injection sessionId au handshake)
│   └── WebSocketEventListener        (déconnexion → deleteByUsername() MongoDB)
├── controller/
│   ├── RoomController.java           (join, vote, sabotage, task, game-over)
│   ├── ChatController.java           (messages salle d'attente)
│   ├── CompileController.java        (REST POST /api/compile)
│   └── UserController.java
├── service/
│   ├── RoomService.java              (rôles, votes, tâches, fin de partie)
│   ├── CompilerService.java          (exécution Python via Docker)
│   ├── MessagingService.java         (sendToTopic / sendToUser)
│   └── userService.java              (CRUD + cache Redis)
├── model/
│   ├── User.java                     (@Document MongoDB)
│   ├── ChatMessage.java              (MsgType enum + builder Lombok)
│   ├── Task.java / TestCase.java
│   ├── Submission.java
│   └── Sabotage.java
└── repository/
    ├── UserRepository.java
    └── TaskRepository.java
```

---

## 6. Navigation frontend

| Route | Page | Statut |
|---|---|---|
| `/login` | LoginPage | **Frontend uniquement — AUCUN endpoint backend** |
| `/` | LobbyPage | OK |
| `/create` | CreateRoomPage | OK |
| `/waiting/:roomId` | WaitingRoomPage | OK |
| `/room/:roomId` | RoomPage | OK |
| `/role` | RolePage | OK |
| `/reveal` | RevealPage | OK |
| `/profile` | ProfilePage | Statique — pas de données réelles |

> **Important** : la page `/login` existe côté frontend (saisie du `username`) mais il n'existe **aucun `POST /api/login`** ni vérification d'identité côté serveur. Le `username` est stocké en état React et transmis directement dans les messages STOMP.

---

## 7. Destinations STOMP complètes

### Client → Serveur (`/app`)

| Destination | Rôle |
|---|---|
| `/app/createRoom/{roomId}` | Créer une salle |
| `/app/chat-addUser/{roomId}` | Rejoindre salle d'attente |
| `/app/player-ready/{roomId}` | Indiquer prêt |
| `/app/room/{roomId}/join` | Rejoindre salle de jeu |
| `/app/room/{roomId}/chat` | Chat en partie |
| `/app/room/{roomId}/task` | Tâche terminée |
| `/app/room/{roomId}/vote` | Vote d'éjection |
| `/app/room/{roomId}/sabotage` | Sabotage |
| `/app/room/{roomId}/emergency` | Réunion d'urgence |
| `/app/room/{roomId}/compile-vote-start` | Initier vote compilation |
| `/app/room/{roomId}/compile-vote` | Voter pour compilation |
| `/app/room/{roomId}/game-over` | Fin de partie (timer) |

### Serveur → Client (`/topic`, `/queue`)

| Destination | Type | Description |
|---|---|---|
| `/topic/waiting/{roomId}` | Public | JOIN, READY, START_GAME |
| `/topic/room/{roomId}` | Public | Tous les événements de jeu |
| `/queue/role` | Privé | Rôle secret assigné |
| `/queue/room` | Privé | Confirmation création salle |
| `/queue/errors` | Privé | Erreurs (salle pleine, username pris) |
| `/queue/room/{roomId}/sabotage` | Privé | Notification sabotage ciblé |

---

## 8. Bugs identifiés dans le code source (lus depuis le ZIP)

| Priorité | Bug | Fichier | Correction |
|---|---|---|---|
| 🔴 CRITIQUE | Credentials MongoDB en clair | `application.properties` | Variables d'environnement `${MONGODB_URI}` |
| 🟠 ÉLEVÉ | `readyNumber()` non filtrée par salle | `userService.java` | Ajouter filtre `roomId` dans la requête |
| 🟠 ÉLEVÉ | `@CachePut` au lieu de `@Cacheable` | `userService.java` | Changer l'annotation |
| 🟠 ÉLEVÉ | `test_runner.py` codé en dur pour `pattern_match()` | `CompilerService.java` | Généraliser aux 5 tâches |
| 🟡 MOYEN | Répertoires temporaires Docker non supprimés | `CompilerService.java` | Ajouter bloc `finally` |
| 🟡 MOYEN | Signaling Yjs public (`yjs.dev`) | Frontend | Serveur auto-hébergé |

---

## 9. Gestion des déconnexions

`WebSocketEventListener` intercepte `SessionDisconnectEvent`. Il appelle `userService.deleteByUsername(username)` qui supprime l'utilisateur de MongoDB. **Aucun joueur fantôme ne reste en base** entre deux parties.

---

## 10. Fichiers produits lors des sessions

| Fichier | Description |
|---|---|
| `CodePoster_Rapport_Final.pdf` | Rapport LaTeX complet — **19 pages, version finale** |
| `CodePoster_Rapport_Final.tex` | Source LaTeX correspondant |
| `CodePoster_Rapport_Final.tex` | Source LaTeX — à compiler avec `pdflatex` (2 passes) |
| `pom.xml` | `pom.xml` corrigé (faux artifacts de test supprimés) |
| `codeposter_context.md` | Ce fichier |

### Corrections apportées au `pom.xml` original

| # | Supprimé | Raison |
|---|---|---|
| 1 | `spring-boot-starter-webmvc-test` | N'existe pas dans Maven |
| 2 | `spring-boot-starter-websocket-test` | N'existe pas dans Maven |
| 3 | `spring-boot-starter-aop` | Non utilisé dans le projet |
| 4 | `spring-boot-starter-web` | Doublon — déjà inclus par `webmvc` |
| ✅ | `spring-boot-starter-test` ajouté | Remplace les 2 faux artifacts de test |

---

## 11. Analytics — Feature en cours d'implémentation

### Contexte de la décision

Pas d'authentification dans le MVP → identification par **`username` uniquement** comme clé primaire. Limite connue : deux joueurs avec le même username voient leurs stats fusionnées. Acceptable pour le MVP, résolu par JWT ensuite.

### Données retenues pour le MVP (décision finale)

#### Groupe 1 — Disponibles maintenant (zéro code)

Captées via `ChannelInterceptor` STOMP, sans modifier aucun controller :

| Donnée | Source STOMP | Valeur stockée |
|---|---|---|
| Résultat de la partie | `GAME_OVER` | `outcome` : WIN / LOSS / TIMEOUT |
| Rôle du joueur | `/queue/role` | crewmate ou imposter |
| Vote correct | `VOTE_RESULT` | `ejectedIsImposter` booléen |
| Durée de la partie | `PLAYER_JOIN` → `GAME_OVER` | delta en secondes |
| Nb. de sabotages | `SABOTAGE` | compteur par partie |
| Réunions d'urgence | `EMERGENCY_MEETING` | compteur par partie |
| Tâches complétées | `TASK_COMPLETE` + `fileKey` | liste des fichiers réussis |

#### Groupe 2 — Faisables MVP (< 1h de code)

Nécessitent un hook `useAnalytics` côté frontend + une ligne dans `CompileController` :

| Donnée | Implémentation | Effort |
|---|---|---|
| Temps par fichier Python | Timer `onFileChange()` dans hook | 15 min |
| Nombre de frappes | Compteur `onKeystroke()` | 10 min |
| Changements de fichier | Compteur dans `onFileChange()` | 5 min |
| Résultat de compilation | `POST /api/analytics/compile` | 20 min |
| Parties par username | Agrégation MongoDB | 10 min |

#### Groupe 3 — Exclus du MVP (avec justification)

| Donnée exclue | Raison |
|---|---|
| Vitesse de frappe KPM précise | Sans auth, impossible de lier username à une session stable |
| Yjs Awareness détaillé | Sérialiser les données P2P demande un serveur de signaling custom |
| Efficacité du sabotage | Corrélation sabotage → abandon trop fragile sans timestamps précis |
| Contenu du code écrit | Poids de stockage + confidentialité |
| Stats agrégées multi-parties | Nécessite JWT d'abord |

### Document MongoDB produit par partie (`analytics_sessions`)

```json
{
  "roomId": "room-42",
  "startedAt": "2026-05-29T19:00:00Z",
  "endedAt": "2026-05-29T19:12:34Z",
  "durationSeconds": 754,
  "outcome": "CREWMATES_WIN",
  "totalSabotages": 2,
  "totalEmergencyMeetings": 1,
  "players": [
    {
      "username": "alice",
      "role": "crewmate",
      "won": true,
      "votedCorrectly": true,
      "tasksCompleted": ["neural_hash", "data_sort"],
      "timePerFile": {
        "neural_hash": 120,
        "data_sort": 95,
        "auth_check": 0
      },
      "keystrokesPerFile": {
        "neural_hash": 340,
        "data_sort": 210
      },
      "fileSwitches": 4,
      "compilationResults": {
        "neural_hash": "ACCEPTED",
        "data_sort": "WRONG_ANSWER"
      }
    }
  ]
}
```

### Architecture analytics (3 collections MongoDB, isolées du jeu)

```
STOMP ChannelInterceptor (1 seule ligne dans WebSocketConfig)
        │
        ▼ ApplicationEvent Spring (@Async — ne bloque JAMAIS le jeu)
        │
  AnalyticsEventListener
        │
        ├── analytics_events      (journal brut, TTL 90 jours)
        ├── analytics_sessions    (résumé par partie)
        └── analytics_player_stats (métriques par joueur par partie)
```

### Règle absolue

> Tout le pipeline analytics est `@Async` + `try/catch` global. Si analytics plante, le jeu continue. L'intercepteur retourne **toujours** le message STOMP intact.

### Où on en est dans l'implémentation

- [x] Package `analytics/` créé dans le projet
- [x] `pom.xml` corrigé et rechargé dans IntelliJ
- [ ] **Prochaine étape** : `StompAnalyticsInterceptor` (Phase 1 du plan)

---

## 12. Plan d'implémentation analytics (phases)

| Phase | Contenu | Statut |
|---|---|---|
| 0 | Package `analytics/`, `AnalyticsAsyncConfig` | ✅ Fait |
| 1 | `StompAnalyticsInterceptor` + `RawGameEvent` | ⬜ À faire |
| 2 | Modèles MongoDB (`GameEvent`, `GameSession`, `PlayerGameStats`) + index TTL | ⬜ À faire |
| 3 | `AnalyticsEventListener` + `GameSessionService` + `PlayerStatsService` | ⬜ À faire |
| 4 | Hook `useAnalytics` (frontend) + intégration `YjsRoomContext` | ⬜ À faire |
| 5 | API REST `/api/analytics/*` (ingest + query) | ⬜ À faire |
| 6 | Dashboard post-partie `AnalyticsPage.jsx` | ⬜ À faire |
| 7 | Pipeline ML (après 100+ parties) | ⬜ Futur |

---

## 13. Feuille de route complète

### Court terme (corrections prioritaires)

- [ ] Externaliser credentials MongoDB dans `.env`
- [ ] Corriger `readyNumber()` — ajouter filtre `roomId`
- [ ] Ajouter bloc `finally` dans `CompilerService` (nettoyage temp)
- [ ] Changer `@CachePut` en `@Cacheable` sur `findByRoom()`
- [ ] Brancher `CompilerService` aux 5 vraies tâches du jeu
- [ ] **Implémenter le service analytics (Phase 1 → Phase 5)**

### Moyen terme

- [ ] Persister les tâches dans MongoDB via `TaskRepository`
- [ ] Authentification JWT (remplace username-only)
- [ ] Tests unitaires backend (JUnit 5 + Mockito)
- [ ] Pipeline CI (GitHub Actions)
- [ ] Persister les statistiques joueurs (profil, historique)

### Long terme

- [ ] Migration broker STOMP → RabbitMQ / Redis Pub/Sub
- [ ] File d'attente pour compilations Docker
- [ ] Serveur de signaling Yjs auto-hébergé
- [ ] Tests E2E Playwright
- [ ] Déploiement Docker Compose / Kubernetes
- [ ] Intégration LLM (hint engine + analyse post-partie)
- [ ] Dashboard Grafana + pipeline ML comportemental

---

## 14. Diagrammes — outils recommandés

| Diagramme | Outil | Lien |
|---|---|---|
| Architecture globale | Eraser.io | https://www.eraser.io |
| Séquence STOMP | Mermaid Live | https://mermaid.live |
| Flowchart vote/victoire | Draw.io | https://app.diagrams.net |

---

## 15. Références techniques

- [Spring STOMP WebSocket](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket-stomp)
- [Yjs documentation](https://docs.yjs.dev)
- [TimescaleDB](https://www.timescale.com)
- [ClickHouse](https://clickhouse.com)
- [Claude API](https://docs.anthropic.com)

---

## 16. Comment reprendre une session

Colle ce fichier en début de conversation avec le message :

> "Voici le contexte de mon projet CodePoster. On travaille sur [sujet précis]. Continue depuis là où on s'est arrêtés."

**Prochaine action concrète** : implémenter `StompAnalyticsInterceptor.java` dans `analytics/interceptor/` — Phase 1 du plan analytics.
