# UNO Flip — Comprehensive Technical Documentation & Operating Manual

## 1. Executive Summary & Overview

**UNO Flip** is a studio-grade, full-stack, real-time multiplayer digital card arena modeled after Mattel's physical double-sided UNO Flip card game. The project implements an authoritative, cheat-proof server-client architecture featuring:
* **Double-Sided Mechanics**: Seamless mid-game transitions between the **Light Side** (classic primary colors, lighter action penalties) and the **Dark Side** (high-voltage neon colors, intense penalties like Draw 5, Skip Everyone, and Wild Draw Color).
* **Multiple Game Modes**: Real-time multiplayer rooms, pass-code private rooms, offline Pass & Play, and adaptive AI bot opponents (Easy, Medium, Hard).
* **Authoritative Game Engine**: Deterministic rules enforcement, server-side deck and hand isolation, progressive draw stacking (+1/+2/+4/+5), mandatory last-card number check, and real-time Caught challenge windows.
* **Responsive 3D Tabletop Experience**: Multi-layered 3D deck and discard stacks, hardware-accelerated card fans, dynamic casino oval felt scaling, and full mobile touch compatibility.
* **AI & Web Worker Multithreading**: Off-main-thread Monte Carlo win probability analysis via dedicated Web Workers, coupled with Groq-powered AI live referee commentary.
* **Dual Persistence Layer**: Local atomic JSON database (`uno_db.json`) for zero-configuration standalone environments, alongside enterprise PostgreSQL / Supabase integration for match logs, leaderboards, and user progression.

---

## 2. Technology Stack

### Frontend Architecture
| Technology | Version / Spec | Purpose |
| :--- | :--- | :--- |
| **React** | 19.2.x | High-performance UI rendering with component memoization (`React.memo`) |
| **Vite** | 8.3.x | Lightning-fast build tool, HMR, and production asset bundling |
| **Zustand** | 5.0.x | Centralized global client store managing connection, hand state, and modals |
| **Socket.IO Client** | 4.8.x | Bi-directional, event-driven WebSocket communication with low latency |
| **Web Workers** | HTML5 Web Worker API | Multithreaded background processing (`aiWorker.js` odds, `particleWorker.js` FX) |
| **Web Audio API** | Procedural Audio Engine | Studio sound effects (card draws, shuffles, snaps, alarms, UNO shouts, victory fanfares) |
| **CSS3 Hardware Acceleration**| Custom Stylesheet | 3D card transforms (`preserve-3d`), dynamic casino felt lighting, and responsive breakpoints |
| **React Hot Toast** | 2.6.x | Real-time notifications for penalties, errors, room codes, and game alerts |

### Backend Architecture
| Technology | Version / Spec | Purpose |
| :--- | :--- | :--- |
| **Node.js** | LTS (v20+ / v24+) | Non-blocking asynchronous JavaScript server environment |
| **Express** | 5.2.x | REST API server for authentication, statistics, health checks, and static hosting |
| **Socket.IO** | 4.8.x | Real-time room multiplexing, lobby synchronization, and match broadcasts |
| **UUID** | 14.0.x | Cryptographically unique identifiers for cards, moves, rooms, and action notifications |
| **Crypto** | Node.js Native | Timing-safe salt hashing (`pbkdf2Sync`) and verification for user accounts |
| **Groq SDK** | Cloud API | Llama-powered AI Referee generating real-time match commentary |

### Persistence & Storage
| Engine | Type | Purpose |
| :--- | :--- | :--- |
| **Local Storage Engine** | Atomic JSON File (`uno_db.json`) | Standalone zero-dependency database with safe write buffering |
| **Supabase / PostgreSQL** | Relational SQL DB | Persistent player profiles, XP/coins progression, match logs, and leaderboard queries |

---

## 3. System Architecture & Operational Workflow

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              CLIENT (React 19)                         │
 │                                                                        │
 │  ┌─────────────────┐   ┌───────────────────┐   ┌────────────────────┐  │
 │  │  GameScreen.jsx │   │  TableDeckArea    │   │   PlayerHand.jsx   │  │
 │  │ (Casino Felt)   │   │  (3D Draw/Discard)│   │  (Curved Fan / Tray│  │
 │  └────────┬────────┘   └─────────┬─────────┘   └─────────┬──────────┘  │
 │           │                      │                       │             │
 │           └──────────────┬───────┴───────────────────────┘             │
 │                          ▼                                             │
 │              Zustand Store (`gameStore.js`)                            │
 │                ├── Local Hand State (Private)                          │
 │                └── Authoritative Public State Snapshot                 │
 │                          ▲                                             │
 │                          │ WebSocket (Socket.IO Client)                │
 └──────────────────────────┼─────────────────────────────────────────────┘
                            │
                            │  Encrypted Transport / JSON Payloads
                            │  Events: playCard, drawCard, pressUno, caught
                            ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              SERVER (Node.js)                          │
 │                                                                        │
 │  Socket Gateway (`gameSocket.js`)                                      │
 │    ├── Room Manager (`roomManager.js`) ── Lobby & Player Allocation    │
 │    ├── AI Bot Controller (`ai.js`) ────── Scheduled Bot Actions        │
 │    └── Groq Referee (`groqService.js`) ── Real-time AI Commentary      │
 │                          │                                             │
 │                          ▼                                             │
 │  Authoritative Game Engine (`game.js`)                                 │
 │    ├── Rules Validator (`rules.js`) ───── Move Legal Checks            │
 │    ├── Deck & Cards (`cards.js`) ──────── 112 Physical Card Pairs      │
 │    ├── Shuffle Engine (`shuffle.js`) ──── Fisher-Yates Randomizer      │
 │    └── State Sanitizer (`getPublicState`) Isolated Card Visibility     │
 │                          │                                             │
 │                          ▼                                             │
 │  Persistence Layer (`repository.js`)                                   │
 │    ├── Local Engine (`storageEngine.js`) ── Atomic Disk Writes         │
 │    └── Cloud Engine (`supabaseClient.js`) ─ PostgreSQL Pools           │
 └────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Client-Server Communication Flow
1. **Room Creation & Join**: A host creates a room via `createRoom` (selecting Mode: Two-Side FLIP vs Classic, Color Mode: 4 vs 5 colors, Turn Time: 15s to 45s, Bots). Socket.IO joins the host to a room channel.
2. **Authoritative State Distribution**: When the match starts (`startGame`), the server deals 7 double-sided cards to each player. 
   - `gameState`: Public snapshot broadcast to all room sockets (player card counts, active side, top discard card, draw count, current turn, direction).
   - `privateHand`: Dispatched *only* to the specific player's socket (`playerHand` event). Opponents NEVER receive other players' card IDs or faces.
3. **Turn Execution**:
   - The active player emits `playCard` with `{ cardId, chosenColor }`.
   - The server validates the move via `validatePlay`.
   - If legal, card effects are processed (e.g. Reverse direction, Skip next player, Flip active side, or initiate a Progressive Draw Stack).
   - Turn pointer advances to the next player.
4. **Drawing & Passing**:
   - A player draws via `drawCard`. If the deck is depleted, the discard pile is reshuffled back into the deck automatically.
   - Per official rules, a player must draw before passing. Passing without drawing is prohibited unless the deck is completely exhausted.
5. **UNO & Caught Window**:
   - When a player reaches 1 card (or holds 2 cards with a playable card), they must call UNO via `pressUno`.
   - If they play down to 1 card without calling UNO, an authoritative server-side timer opens a **Caught Window** (default 3000ms). Any opponent can emit `pressCaught` to penalize the violator with +7 cards.
   - Drawing cards revokes prior UNO status—requiring the player to call UNO *every single time* they drop to 1 card.

---

## 4. Complete Project Directory & File Structure

```
UNO_flip/
├── package.json                         # Root monorepo orchestration scripts
├── Dockerfile                           # Production multi-stage Docker build
├── docker-compose.yml                   # Docker compose config for full-stack run
├── render.yaml                          # Render deployment configuration
├── vercel.json                          # Vercel frontend routing & rewrites
├── .env.example                         # Environment variable template
├── basicRules.pdf                       # Official Mattel UNO Flip physical rulesheet
│
├── client/                              # FRONTEND APPLICATION (React + Vite)
│   ├── index.html                       # HTML5 entry with PWA manifest headers
│   ├── package.json                     # Client dependencies & scripts
│   ├── vite.config.js                   # Vite bundling & dev server config
│   └── src/
│       ├── main.jsx                     # Application bootstrap & mount
│       ├── App.jsx                      # Root container & screen router
│       ├── index.css                    # Master arcade stylesheet (3D cards, felt, HUD)
│       │
│       ├── components/
│       │   ├── screens/                 # Primary Screen Views
│       │   │   ├── LandingScreen.jsx    # Mode select, room join/create, offline toggle
│       │   │   ├── LobbyScreen.jsx      # Waiting room, bot adder, game configuration
│       │   │   ├── GameScreen.jsx       # Stadium felt arena, table layout, player turn HUD
│       │   │   ├── ResultScreen.jsx     # Post-match victory podium, XP/coin awards
│       │   │   └── LoginScreen.jsx      # Unique ID & Password authentication modal
│       │   │
│       │   ├── game/                    # In-Game Table & Card Components
│       │   │   ├── TableDeckArea.jsx    # 3D physical draw stack, discard pile & color gem
│       │   │   ├── UnoFlipCard.jsx      # Official physical card render engine (Memoized)
│       │   │   ├── PlayerHand.jsx       # Curved fan (desktop) & touch-tray (mobile)
│       │   │   ├── OpponentArea.jsx     # Player pod, turn aura, micro cards & name badge
│       │   │   ├── GameInfo.jsx         # Direction, active side, turn count & AI odds
│       │   │   ├── UnoButton.jsx        # Authoritative UNO call button with pulse aura
│       │   │   ├── CaughtButton.jsx     # Real-time Caught challenge countdown button
│       │   │   ├── PassButton.jsx       # Pass turn control with draw validation
│       │   │   ├── ColorPicker.jsx      # Luxury tactile color picker for Wild/Flip plays
│       │   │   ├── QuickReactionTray.jsx# Floating in-game emoji & tactical chat bar
│       │   │   ├── ShuffleDealAnimation.jsx# Start-of-match cinematic dealing animation
│       │   │   ├── TableEventOverlays.jsx# Full-table alerts (FLIP, SKIP, REVERSE, ATTACK)
│       │   │   ├── MemeOverlay.jsx      # Contextual funny sound & meme triggers
│       │   │   ├── CardDualFace.jsx     # Dual-face hover inspector
│       │   │   └── CardComponent.jsx    # Legacy card wrapper
│       │   │
│       │   └── ui/                      # Floating HUDs & Overlays
│       │       ├── ArcadeHeader.jsx     # Top player HUD, profile trigger, room copy pill
│       │       ├── ProfileModal.jsx     # Avatar customizer, frame unlocks, player stats
│       │       ├── LeaderboardModal.jsx # Global rank standings & win streaks
│       │       └── RulesModal.jsx       # Visual rulebook & card action dictionary
│       │
│       ├── hooks/                       # Custom React Hooks
│       │   ├── useWindowSize.js         # Reactive viewport listener (resizing & orientation)
│       │   ├── useSocket.js             # Socket.IO connection & event binding lifecycle
│       │   ├── useAiWorker.js           # Bridge to multithreaded AI odds Web Worker
│       │   ├── useParticleWorker.js     # Bridge to canvas particle explosion Web Worker
│       │   └── usePwaInstall.js         # Progressive Web App install prompt controller
│       │
│       ├── store/
│       │   └── gameStore.js             # Zustand global state (game, auth, UI, audio)
│       │
│       ├── services/
│       │   └── authService.js           # Client HTTP fetch wrappers for auth API
│       │
│       ├── utils/
│       │   ├── audio.js                 # Web Audio API procedural sound synthesizer
│       │   ├── constants.js             # Card types, colors, side constants, hex palettes
│       │   └── memeLibrary.js           # Meme soundboard & reactive phrases
│       │
│       └── workers/                     # Dedicated Multithreaded Web Workers
│           ├── aiWorker.js              # Background Monte Carlo win probability solver
│           └── particleWorker.js        # Background physics-based confetti particle engine
│
└── server/                              # BACKEND ENGINE (Node.js + Express + Socket.IO)
    ├── package.json                     # Server dependencies & test commands
    ├── data/
    │   └── uno_db.json                  # Local persistent JSON database file
    │
    ├── src/
    │   ├── index.js                     # Express server & Socket.IO initialization
    │   │
    │   ├── engine/                      # Deterministic Game Rules Engine
    │   │   ├── cards.js                 # Physical card generation & active face resolver
    │   │   ├── config.js                # Game modes, colors, action penalties constants
    │   │   ├── deckDefinition.js        # Official 112 physical double-sided card pairs
    │   │   ├── game.js                  # Master gameplay lifecycle & action reducer
    │   │   ├── rules.js                 # Move legal validator & draw stacking logic
    │   │   ├── shuffle.js               # Cryptographic Fisher-Yates shuffle engine
    │   │   └── ai.js                    # Bot decision tree, color selector & think delays
    │   │
    │   ├── rooms/
    │   │   └── roomManager.js           # Room state store, player joining & bot spawning
    │   │
    │   ├── sockets/
    │   │   └── gameSocket.js            # Real-time WebSocket event dispatcher & controllers
    │   │
    │   ├── services/
    │   │   ├── authCrypto.js            # PBKDF2 password hashing & timing-safe verification
    │   │   └── groqService.js           # Groq AI live referee commentary generator
    │   │
    │   └── db/                          # Persistence & Storage Systems
    │       ├── storageEngine.js         # Atomic file-based JSON persistence engine
    │       ├── repository.js            # Unified data access layer (Supabase + Local fallback)
    │       ├── memoryStore.js           # In-memory transient caching layer
    │       ├── supabaseClient.js        # Supabase PostgreSQL client connection
    │       ├── schema.sql               # PostgreSQL schema definition
    │       └── migrations/
    │           └── 001_initial_schema.sql # Database migration script
    │
    └── test/                            # Automated Test Suites
        ├── deckValidation.test.js       # 112-card deck composition & side integrity test
        ├── test_gameplay_rules.js       # Play validation, power card win rejection & Groq test
        └── test_crash_prevention.js     # Deck exhaustion, null safety, UNO revocation test
```

---

## 5. Core Backend Modules & Key Functions

### 5.1 Game Engine (`server/src/engine/game.js`)
* `createGame(config, players)`: Initializes a brand-new match state. Deploys the official 112-card deck, shuffles via Fisher-Yates, sets starting active side (`DARK` in Two-Side mode; `LIGHT` in Classic mode), deals 7 cards to each player, flips the first card (ensuring it is not a Wild card), and sets initial turn state.
* `processPlayCard(playerId, cardId, chosenColor, state, emitEvent)`: Validates and executes a card play. Checks player turn, executes action card effects (Reverse, Skip, Skip Everyone, Flip, Draw Stacking, Wild Draw Color), registers finishers when a player reaches 0 cards, advances turn, and sanitizes output.
* `processDrawCard(playerId, state, emitEvent)`: Handles drawing 1 card or taking an accumulated progressive penalty stack (+2, +4, +6). Sets `hasDrawnThisTurn = true` and revokes prior UNO status if the hand size exceeds 1.
* `processPassTurn(playerId, state, emitEvent)`: Enforces the official rule that a player must draw before passing. Clears turn flags and advances turn to the next active player.
* `processPressUno(playerId, state)`: Validates UNO calls. Permitted when a player holds 1 or 2 cards. Resolves any pending Caught windows targeting this player and tracks statistics.
* `processCaught(catcherId, targetPlayerId, moveId, state, emitEvent)`: Validates a Caught challenge. If the target player failed to press UNO and holds 1 card, immediately penalizes them with +7 cards.
* `drawCards(playerId, count, state)`: Pops cards from the deck. Automatically invokes `reshuffleDiscard` if the deck is exhausted. Revokes any existing UNO call if the player now holds > 1 card.
* `advanceTurn(state, step = 1)`: Bounds-safe circular turn iterator that skips finished players (`isFinished: true`) and accounts for table direction (`1` = clockwise, `-1` = counter-clockwise).
* `getPublicState(state)`: Sanitizes the internal game state before broadcasting. Masks private card identities for all opponents while exposing only public data (card count, active side, discard top card, player names, and ranks).

### 5.2 Rule Validation (`server/src/engine/rules.js`)
* `validatePlay(playerId, cardId, state, chosenColor)`: Authoritative move validator:
  - Verifies that it is the player's active turn.
  - Enforces the **Official Winning Rule**: A player's final card MUST be a number card (power cards like Skip, Reverse, Draw, or Wild cannot be played to win).
  - Enforces **Draw Stacking Counter Rules**: Under an active draw attack (+2, +4, etc.), the player MUST counter with an equal or higher draw card, or take the accumulated penalty. Down-stacking is strictly rejected.
  - Enforces color/type matching against the top card of the discard pile.
  - Validates that Wild cards specify a legal `chosenColor` matching the current active side.

### 5.3 Physical Deck Definitions (`server/src/engine/deckDefinition.js` & `cards.js`)
* `buildPhysicalDeck(colorMode)`: Constructs exactly 112 unique physical cards where every card has a permanent, fixed pair of faces (Light Side and Dark Side).
  - Light Side: 26 cards per color (1-9 numbers, 2 Draw One, 2 Reverse, 2 Skip, 2 Flip) + 8 Wilds (4 Wild, 4 Wild Draw Two).
  - Dark Side: 26 cards per color (1-9 numbers, 2 Draw Five, 2 Reverse, 2 Skip Everyone, 2 Flip) + 8 Wilds (4 Wild, 4 Wild Draw Color).
* `getActiveFace(card, activeSide)`: Null-safe helper returning `card.darkSide` when active side is `DARK`, or `card.lightSide` when `LIGHT`.

### 5.4 AI Bot Logic (`server/src/engine/ai.js`)
* `botDecide(botId, difficulty, state)`: Evaluates bot hand and returns `{ action: 'PLAY', cardId, chosenColor }` or `{ action: 'DRAW' }`.
* `findLegalPlays(botId, state)`: Returns all playable cards in the bot's hand given the current discard top and draw stack state.
* `scoreCard(card, state, difficulty)`: Heuristic evaluator prioritizing high-impact action cards, matching colors, and strategic preservation.
* `pickBestColor(botId, state, targetSide)`: Computes the dominant color in the bot's hand on the target side to pick when playing Wild or Flip cards.
* `botShouldPressUno(botId, difficulty, state)`: Determines whether the bot calls UNO (Easy: 0% chance; Medium: 85% chance; Hard: 100% chance).

### 5.5 Room Management (`server/src/rooms/roomManager.js`)
* `createRoom(hostId, hostName, config)`: Generates a 6-character room code (e.g. `37PS7E`) and initializes lobby settings.
* `joinRoom(roomId, player)`: Enforces room capacity limits (2 to 6 players) and prevents duplicate joins.
* `addBot(roomId, difficulty)`: Instantiates virtual bot players with custom avatars and names (e.g. "Alex (Bot)", "Maya (Bot)").
* `startGame(roomId)`: Transitions room status from `LOBBY` to `PLAYING` and creates the game engine instance.

---

## 6. Core Frontend Modules & Key Functions

### 6.1 State Management (`client/src/store/gameStore.js`)
Zustand centralized store orchestrating:
* Connection state (`socket`, `connected`).
* Match state (`gameState`, `myHand`, `selectedCardId`, `pendingWildCardId`).
* Player profile & local persistence (`profile`, `authUser`, `isGuest`).
* Audio & visual settings (`soundEnabled`, `memesEnabled`, `activeReactions`).
* Modal visibility controls (`showColorPicker`, `showRulesModal`, `showProfileModal`, `showLeaderboard`).

### 6.2 Table Deck & Card Components
* `TableDeckArea.jsx`: High-performance 3D tabletop view rendering the physical Draw pile with stacked card-edge layers, "UNO FLIP!" back, dynamic attack counters, and the Discard pile with natural card rotations and active color orb.
* `UnoFlipCard.jsx`: Vector SVG card engine rendering all 112 card faces with authentic fonts, angled oval centerpieces (-26°), top/bottom pips, specular sheen, and `React.memo` optimization.
* `PlayerHand.jsx`: Adaptive player hand container. Renders a curved tactile fan on desktop with rotation arcs and elevation, and a smooth touch-scrolling tray on mobile. Features a prominent Flip Peek toggle button to view the opposite side of held cards.
* `OpponentArea.jsx`: Renders opponent pods along the table perimeter with level tags, active turn aura, thinking bubbles, and micro card fans (`size="xs"`).

### 6.3 Responsive Viewport Hook (`client/src/hooks/useWindowSize.js`)
A centralized custom hook that monitors `resize`, `orientationchange`, and `visualViewport` events:
* Exposes `width`, `height`, `isMobile` (<768px), `isTablet` (768-1024px), `isSmall` (<480px), and `isShort` (<660px).
* Dynamically calculates `targetWidth` and `targetHeight` in `GameScreen.jsx` so opponent pods on the table rim never clip outside the viewport on any display size.

---

## 7. Gameplay Rules & Authoritative Engine Logic

| Rule Mechanic | Authoritative Behavior |
| :--- | :--- |
| **FLIP Action Card** | When played, flips the active side (`LIGHT` ⇄ `DARK`). The discard pile, draw deck, and all players' hands immediately invert to their opposite face. |
| **Draw One (+1) / Draw Five (+5)** | Target player draws 1 (Light) or 5 (Dark) cards and loses their turn, unless Progressive Stacking is active. |
| **Progressive Stacking** | When a Draw card is played, subsequent players can counter with an equal or higher draw card (+1, +2, +4, +5). Penalties accumulate until a player cannot counter and takes the total. |
| **Skip / Skip Everyone** | Skip passes the next player's turn. **Skip Everyone** (Dark Side) skips all opponents, granting the playing player an immediate second turn. |
| **Wild Draw Color** | The target player must repeatedly draw from the deck until they reveal a card matching the chosen color. Target loses their turn. |
| **Winning Card Constraint** | **Official Rule**: A player cannot win on a power/action card. The final card played to reach 0 cards MUST be a Number card. |
| **Mandatory UNO Call** | A player must call UNO before playing down to 1 card or immediately while holding 1 card. Any draw action revokes prior UNO status, requiring a new call every time. |
| **Caught Challenge** | If a player holds 1 card without calling UNO, opponents have a 3-second window to challenge via CAUGHT. Successful challenges penalize the violator with +7 cards. |

---

## 8. Operational Runbook & Deployment Guide

### 8.1 Local Development Setup
1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/gondchawarswaraj45/UNO_flip.git
   cd UNO_flip
   npm run install:all
   ```
2. **Environment Variables Configuration**:
   Create `server/.env` based on `.env.example`:
   ```env
   PORT=3001
   CLIENT_ORIGIN=http://localhost:5173
   GROQ_API_KEY=your_groq_api_key_here
   # Optional Supabase Integration:
   SUPABASE_URL=
   SUPABASE_SERVICE_KEY=
   ```
3. **Run Automated Test Suites**:
   ```bash
   npm test
   node server/test/test_crash_prevention.js
   ```
4. **Build Frontend**:
   ```bash
   npm --prefix client run build
   ```

### 8.2 Production Deployment Options
* **Docker Containerization**:
  The included multi-stage `Dockerfile` builds the Vite frontend and copies production assets into the Express server for single-container hosting:
  ```bash
  docker-compose up --build -d
  ```
* **Vercel (Client) + Render (Server)**:
  - Frontend configured via `vercel.json` with SPA route rewrites.
  - Backend configured via `render.yaml` as a Web Service running `node server/src/index.js`.

