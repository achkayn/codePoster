# Résumé de contexte — Discussions CodePoster

> **Date :** 25 mai 2026  
> **Participants :** Anouar (étudiant ingénieur, ENSAM Meknès) + Claude (assistant IA)  
> **Projet principal :** CodePoster — jeu de programmation multijoueur en temps réel

---

## 1. Présentation du projet CodePoster

**CodePoster** est un jeu web multijoueur inspiré d'"Among Us", appliqué à la programmation Python. Jusqu'à 4 joueurs rejoignent une salle, reçoivent un rôle secret (**crewmate** ou **imposteur**), et collaborent pour corriger 5 fichiers Python corrompus sous contrainte de temps.

### Règles principales
- L'imposteur peut **saboter** la progression d'un joueur
- N'importe quel joueur peut déclencher une **réunion d'urgence**
- Un **vote d'exclusion** à la majorité peut éjecter un joueur
- Conditions de victoire : tous les crewmates finissent leurs tâches **OU** l'imposteur est éjecté

### Les 5 tâches Python (hardcodées côté frontend)
| Clé | Description |
|-----|-------------|
| `neural_hash` | Fonction de hachage |
| `data_sort` | Algorithme de tri |
| `auth_check` | Vérification de tokens |
| `key_rotation` | Rotation de clés |
| `grid_scan` | Parcours de grille 2D |

---

## 2. Stack technique actuelle

### Backend
| Technologie | Version | Rôle |
|-------------|---------|------|
| Java | 21 | Langage principal |
| Spring Boot | 4.0.3 | Framework |
| Spring WebSocket + STOMP | — | Messagerie temps réel |
| MongoDB Atlas | — | Persistance utilisateurs |
| Redis | — | Cache listes de joueurs |
| Docker (Python 3.11-slim) | — | Sandbox d'exécution Python |
| Lombok | — | Réduction boilerplate |
| Spring Actuator | — | Health check `/actuator/health` |

### Frontend
| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 19.2.0 | UI |
| React Router | 7.13.0 | Navigation SPA |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.18 | Styling |
| GSAP | 3.14.2 | Animations |
| Three.js + @react-three/fiber | 0.182.0 | Rendus 3D |
| Lottie-react | 2.4.1 | Animations JSON |
| SockJS + stompjs | 1.6.1 / 2.3.3 | Client WebSocket |
| Yjs | 13.6.30 | CRDT collaboration temps réel |
| y-webrtc | 10.3.0 | Transport WebRTC P2P |

---

## 3. Architecture globale

```
Client React (Vite)
    │
    ├── WebSocket STOMP (SockJS) ──────► Backend Spring Boot
    │                                        │
    └── Yjs + WebRTC (P2P) ─────────────────┤
         └─► Signaling public (yjs.dev)      │
                                             ├── MongoDB Atlas  (users)
                                             ├── Redis Cache    (rooms)
                                             ├── Docker Python  (sandbox)
                                             └── Actuator       (health)
```

### Principes architecturaux
- **STOMP** pour tous les événements de jeu (serveur → tous les joueurs)
- **Yjs CRDT** pour la synchronisation du code en P2P (pas de charge serveur)
- **Docker isolé** pour l'exécution du code soumis (`--network none`, 100 Mo RAM, 0.5 CPU, timeout 3s)
- **ConcurrentHashMap** in-memory pour les votes et la progression des tâches

---

## 4. Bugs et limitations identifiés dans le code

> Analysés directement depuis le code source (ZIP fourni)

### Critique
- 🔴 **Credentials MongoDB en clair** dans `application.properties` — risque de sécurité majeur, à externaliser via variables d'environnement
- 🔴 **`readyNumber()` globale** (non filtrée par salle dans `userService`) — bug potentiel en multi-salle, peut déclencher une partie prématurément

### Important
- 🟠 **`test_runner.py` codé en dur** pour `pattern_match()` uniquement — le CompilerService n'est pas encore branché aux 5 vraies tâches du jeu
- 🟠 **`@CachePut`** au lieu de `@Cacheable` sur `findByRoom()` — écrit toujours en cache mais ne lit jamais depuis, ce qui génère des requêtes Mongo inutiles
- 🟠 **Répertoires temporaires Docker** non supprimés après exécution (pas de bloc `finally`)

### Moyen
- 🟡 **Signaling Yjs public** (`wss://signaling.yjs.dev`) — dépendance externe non contrôlée
- 🟡 **Aucune authentification** ni autorisation sur les handlers STOMP
- 🟡 **CORS limité** à `http://localhost:5173` — non adapté au déploiement
- 🟡 **Tests minimaux** : uniquement chargement de contexte Spring, aucun test frontend

---

## 5. Rapport technique produit

Un rapport `.docx` professionnel complet a été généré automatiquement depuis le code source :

**Fichier :** `CodePoster_Rapport_Technique.docx`

### Sections du rapport
1. Résumé exécutif (points forts + limitations)
2. Règles du jeu et cas d'usage
3. Architecture globale (avec diagrammes ASCII)
4. Backend — analyse technique (WebSocketConfig, RoomService, CompilerService)
5. Frontend — analyse technique (navigation, Yjs context, UI)
6. Modèle de données (User, ChatMessage, Task, Submission)
7. Flux temps réel STOMP (toutes les destinations réelles extraites des controllers)
8. Sécurité et risques (tableau priorisé)
9. Qualité logicielle et tests (plan recommandé)
10. Performance et scalabilité
11. Observabilité et monitoring
12. Feuille de route (court / moyen / long terme)
13. Annexes (glossaire, résumé technologies)

---

## 6. Diagrammes — Outils recommandés

Pour remplacer les blocs ASCII du rapport par des diagrammes professionnels :

| Diagramme | Outil recommandé | Pourquoi |
|-----------|-----------------|---------|
| Architecture globale | **Eraser.io** | Syntaxe déclarative, icônes tech intégrées |
| Séquence STOMP | **Mermaid.live** | Rapide, précis, export PNG |
| Flowchart vote/victoire | **Draw.io (diagrams.net)** | Contrôle total, export haute résolution |
| Arborescence packages | **Draw.io** | Hiérarchie claire |

### Exemples de code Mermaid pour CodePoster

**Séquence STOMP :**
```
sequenceDiagram
    participant CA as Client A (Owner)
    participant CB as Clients B/C/D
    participant BE as Backend
    CA->>BE: createRoom/{roomId}
    BE-->>CA: /queue/room (confirm)
    CB->>BE: chat-addUser/{roomId}
    BE-->>CA: /topic/waiting (JOIN)
    Note over BE: 4 joueurs ready
    BE-->>CA: /queue/role = crewmate
    BE-->>CB: /queue/role = imposter
    BE-->>CA: START_GAME
```

**Flowchart vote :**
```
flowchart TD
    A[Vote reçu] --> B{Majorité atteinte ?}
    B -- Non --> C{Tous ont voté ?}
    C -- Non --> D[Attendre]
    C -- Oui --> E[Calculer tally]
    B -- Oui --> E
    E --> F{Éjecté = Imposteur ?}
    F -- Oui --> G[CREWMATES WIN]
    F -- Non --> H[IMPOSTER WINS]
```

---

## 7. Nouvelles fonctionnalités discutées

### 7.1 Service de collecte de données (Analytics)

> Considéré comme la **vraie valeur de marché** du projet

#### Données collectables (depuis les événements existants)

**Données de jeu (par partie)**
- Durée totale de la partie
- Résultat (crewmates / imposteur gagne)
- Nombre de votes, sabotages, réunions d'urgence
- Fichier(s) compilé(s) et résultat (ACCEPTED / WRONG_ANSWER / RUNTIME_ERROR)
- Difficulté sélectionnée

**Métriques de codage (par joueur)**
- Temps passé sur chaque fichier (`neural_hash`, `data_sort`, etc.)
- Vitesse de frappe (keystrokes/min via Yjs awareness)
- Nombre de modifications / corrections
- Pattern de navigation entre les fichiers
- Taux de complétion des tâches
- Erreurs de compilation et types d'erreurs

**Métriques sociales / comportementales**
- Pattern de vote (qui vote pour qui)
- Fréquence des réunions d'urgence déclenchées
- Efficacité du sabotage (en tant qu'imposteur)
- Win rate par rôle (crewmate vs imposteur)
- Comportement collaboratif (via Yjs awareness partagée)

#### Valeur de marché potentielle
- **EdTech** : identifier quels concepts Python posent problème aux étudiants
- **RH / Recrutement** : évaluation comportementale sous pression
- **Gaming analytics** : modélisation du comportement joueur
- **Recherche académique** : patterns de collaboration en codage

#### Architecture recommandée
```
STOMP stream + Yjs observers
        │
        ▼
  Event Collector (Spring listener / Kafka consumer)
        │
        ▼
  Analytics Store (TimescaleDB ou ClickHouse)
        │
        ▼
  Dashboard + ML pipeline (Grafana + Python features)
```

### 7.2 Assistant IA intégré

#### Modes d'utilisation proposés
1. **Hint engine en jeu** — l'IA donne des indices contextuels aux crewmates bloqués sur un fichier (sans donner la réponse directe)
2. **Analyse post-partie** — rapport IA personnalisé par joueur (points forts, erreurs récurrentes, comparaison aux autres joueurs)
3. **Bot imposteur (optionnel)** — jouer contre une IA en mode solo

#### Stack recommandée
- **Claude API** (Anthropic) ou **OpenAI GPT-4o** comme LLM gateway
- Contexte injecté dans le prompt : code actuel du joueur, tâche en cours, rôle, temps restant
- Endpoint REST dédié `/api/hint` appelé depuis le frontend

---

## 8. Feuille de route consolidée

### Court terme (priorité haute)
- [ ] Externaliser les credentials MongoDB dans des variables d'environnement
- [ ] Corriger `readyNumber()` pour filtrer par salle
- [ ] Ajouter `finally` dans CompilerService pour supprimer les dossiers temporaires
- [ ] Changer `@CachePut` en `@Cacheable` sur `findByRoom()`
- [ ] Brancher le CompilerService aux 5 vraies tâches

### Moyen terme
- [ ] Persister les tâches dans MongoDB via `TaskRepository`
- [ ] Ajouter une authentification JWT
- [ ] Tests unitaires backend (JUnit 5 + Mockito)
- [ ] Pipeline CI/CD (GitHub Actions)
- [ ] Persister les statistiques joueurs (profil, historique)
- [ ] Intégrer le service de collecte de données (Event Collector)

### Long terme
- [ ] Migration vers un broker externe (RabbitMQ / Redis Pub/Sub)
- [ ] File d'attente pour les compilations Docker
- [ ] Serveur de signaling Yjs auto-hébergé
- [ ] Tests E2E Playwright
- [ ] Déploiement containerisé complet (Docker Compose / Kubernetes)
- [ ] Intégration LLM (hint engine + analyse post-partie)
- [ ] Dashboard analytics Grafana
- [ ] Pipeline ML pour analyse comportementale

---

## 9. Fichiers produits lors de la discussion

| Fichier | Description |
|---------|-------------|
| `CodePoster_Rapport_Technique.docx` | Rapport technique complet (13 sections, ~30 Ko) |
| `contexte_discussion_codeposter.md` | Ce fichier — résumé de contexte |

---

## 10. Références techniques utiles

- [Yjs documentation](https://docs.yjs.dev)
- [Spring STOMP WebSocket](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket-stomp)
- [TimescaleDB](https://www.timescale.com) — base de données time-series pour analytics
- [ClickHouse](https://clickhouse.com) — OLAP haute performance pour événements
- [Mermaid Live Editor](https://mermaid.live)
- [Eraser.io](https://www.eraser.io) — diagrammes d'architecture
- [Draw.io](https://app.diagrams.net)
- [Claude API](https://docs.anthropic.com)

---

*Résumé généré le 25 mai 2026 — Conversation CodePoster entre Anouar et Claude*
