# UNO Flip — Authoritative Digital Card Studio

<p align="center">
  <img src="docs/images/banner.jpg" alt="UNO Flip Digital Card Arena" width="100%" style="border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Audio-Web%20Audio%20API-EAB308?style=for-the-badge" alt="Web Audio API" />
</p>

---

## 🌟 Overview

**UNO Flip — Authoritative Digital Card Studio** is a premier, full-stack, real-time multiplayer implementation of UNO & UNO Flip. Engineered with a **server-authoritative game engine**, zero-cheating information hiding, luxury midnight velvet tabletop aesthetics (`#080b12`), authentic physical card geometry, and a zero-dependency Web Audio synthesizer.

Whether challenging friends online with 6-letter room codes, passing a tablet around the couch in Pass & Play mode, or dueling tactical AI bots, every move is computed securely on the server with sub-millisecond precision.

---

## 📸 Visual Showcase

### 1. Dual-Faced Tabletop Arena
Experience the transition between the vibrant **Light Side** and the punishing **Dark Side** with authentic physical cards, curved fanned player hands, seated opponent avatars, live win odds, and dynamic table felt sizing.

| ☀️ Light Side Arena | 🌙 Dark Side Inversion |
| :---: | :---: |
| <img src="docs/images/04-gameplay-light.png" alt="Light Side Arena" width="100%" /> | <img src="docs/images/05-gameplay-dark.png" alt="Dark Side Arena" width="100%" /> |
| *Classic palette (Red, Blue, Green, Yellow), fanned hand, turn HUD* | *Neon palette (Pink, Teal, Orange, Purple), obsidian borders, Draw 5* |

---

### 2. Game Hub & Match Configuration
Hop into 4 dedicated game modes with comprehensive match staging, configurable player seats (2 to 6), custom AI bot difficulty, and 4 vs. 5 color variants.

| 🎴 Digital Card Hub (4 Modes) | ⚙️ Match Configuration |
| :---: | :---: |
| <img src="docs/images/01-landing-hub.png" alt="Landing Screen Hub" width="100%" /> | <img src="docs/images/02-mode-setup.png" alt="Mode Configuration" width="100%" /> |
| *Online, Friends Online, Pass & Play Offline, vs Computers* | *Select 2–6 seats, AI difficulty (Casual/Tactical/Expert), deck rules* |

---

### 3. Multiplayer Staging & Victory Celebrations
Host private rooms with instant 6-letter room codes, inspect color palette previews, adjust bot lineups, and celebrate victories with animated XP, coins, and standings.

| 👥 Private Match Lobby | 👑 Victory & Progression |
| :---: | :---: |
| <img src="docs/images/03-lobby-room.png" alt="Match Staging Lobby" width="100%" /> | <img src="docs/images/08-victory-result.png" alt="Grand Victory Screen" width="100%" /> |
| *Room code copying, rule badges, player roster, host controls* | *Crown celebration, match standings, career XP & coin gains* |

---

### 4. Official Rules & Action Cards Compendium
In-game comprehensive rulebook and card guide covering classic rules, the Flip mechanic, the Caught challenge window, and tactical counter-calls.

| 📜 Official Rules Guide | 🃏 Action Cards Breakdown |
| :---: | :---: |
| <img src="docs/images/06-official-rules.png" alt="Official Rules Guide" width="100%" /> | <img src="docs/images/07-action-cards-guide.png" alt="Action Cards Guide" width="100%" /> |
| *Turn flow, drop/draw/pass rules, scoring, and 4 vs 5 colors* | *Light side actions vs Dark side special actions (+5, Skip Everyone)* |

---

## 🎮 Game Modes

| Mode | Type | Description | Player Support |
| :--- | :---: | :--- | :---: |
| **Play Online** | 🌐 Online | Fast matchmaking with players worldwide. | 2–6 Players |
| **Friends Online** | 👥 Online | Host private lobbies with shareable 6-letter room codes or join via code. | 2–6 Players + Bots |
| **Friends Offline** | 🛋️ Local | Pass & Play on a single laptop/tablet screen with dynamic seat re-orienting. | 2–6 Players |
| **Play with Computers** | 🤖 Solo | Practice or play offline against smart AI bots with custom difficulty. | 1 Human + 1–5 Bots |

---

## 🃏 Card Compendium & FLIP Mechanics

Cards are dual-sided with independent faces on each side:

```
┌─────────────────────────┐               ┌─────────────────────────┐
│       LIGHT SIDE        │   ── FLIP ──▶ │        DARK SIDE        │
│  White Outer Border     │   ◀── FLIP ── │  Obsidian Black Border  │
│  Red, Blue, Green, Ylw  │               │  Pink, Teal, Orng, Prpl │
└─────────────────────────┘               └─────────────────────────┘
```

### Action Card Differences

| Action | Light Side Effect | Dark Side Effect |
| :--- | :--- | :--- |
| **Draw Card** | **Draw One (+1)** or **Draw Two (+2)** | **Draw Five (+5)** |
| **Skip** | **Skip**: Next player loses their turn | **Skip Everyone**: All opponents skipped; play again immediately! |
| **Reverse** | Inverts turn order | Inverts turn order |
| **FLIP** | Flips all cards to the **Dark Side** | Flips all cards back to the **Light Side** |
| **Wild** | Choose the active color | Choose the active color |
| **Wild Draw** | **Wild Draw Two / Four** | **Wild Draw Color**: Victim draws until they draw the chosen color! |

### The 5th Color Mode
Optionally enable the **5th Color** deck variant:
- **Light Side**: Red, Blue, Green, Yellow + *Light Purple (#8B5CF6)*
- **Dark Side**: Pink, Teal, Orange, Purple + *Earth Brown (#78350F)*

### Official Match Winning Rule
- **Number Card Victory**: A player **cannot win on an action or power card** (`SKIP`, `REVERSE`, `FLIP`, `+1`, `+2`, `+5`, `WILD`, etc.). The winning final card **must be a number card (1–9)**.
- **Strict UNO Button Rule**: The UNO button is enabled **only when** it is the player's turn, they hold exactly 2 cards, and at least one card is legally playable.

---

## 🏛 Architecture & Engineering Philosophy

### 1. Authentic Physical 112-Card Dual-Sided Deck
- **Single Physical Card Entities**: Each card is modeled as one physical double-sided object `{ id, lightSide, darkSide }`.
- **Official Mattel Pairings**: Exactly 112 physical cards with official verified pairings (e.g., Light Blue 6 ↔ Dark Purple Reverse, Light Yellow 3 ↔ Dark Teal 3, Light Green Flip ↔ Dark Wild Draw Color).
- **Flawless Tabletop Flipping**: Inverting the table flips hands, discard piles, and the draw bundle simultaneously without desyncing.

### 2. Groq AI Live Match Referee & Monitor
- **Real-Time Intelligence**: Powered by Groq's high-speed inference engine (`qwen/qwen3.8-27b`).
- **Official Rule Adjudication**: Trained on the complete official Mattel UNO Flip ruleset.
- **Live Match Announcements**: Broadcasts punchy referee commentary on game events (flips, counter stacks, UNO calls, caught penalties, and match finishes) directly to the in-game HUD.

### 3. Authoritative Game Server
- **Zero Information Leakage**: The client never receives opponent cards. Opponents receive only card counts, player IDs, and public table actions.
- **Atomic State Transitions**: Moves, card plays, draws, passes, and challenge windows are evaluated sequentially on the server.
- **True Randomness**: Fisher-Yates deck shuffle powered by Node.js `crypto.getRandomValues()` with rejection sampling.
- **Authoritative Caught Window**: Server-enforced challenge countdown timer for missed UNO shouts.

### 4. Progressive Web Application (PWA) & All-Screen Fit
- **PWA Ready**: Web app manifest, standalone display mode, maskable icons, and a multithreaded service worker (`sw.js`) enabling offline play.
- **All-Screen Geometry**: Responsive CSS scaling ensures fluid gameplay on mobile phones, tablets, foldables, and widescreen monitors with zero button overlap.

### 5. Persistent Storage Engine & Database Layer
- **High Efficiency Architecture**: High-frequency ephemeral card actions remain in memory for sub-millisecond real-time speed.
- **Persistent Disk-Backed Database (`server/data/uno_db.json`)**:
  - Implements an ACID-resilient, atomic file-backed storage engine ([`storageEngine.js`](server/src/db/storageEngine.js)).
  - In-memory `Map` indexing for $O(1)$ queries, debounced background disk flush, and atomic temp-file swap (`.tmp` → `.json`) to eliminate data corruption.
  - Automatically loads and persists accounts, match histories, player career stats, and leaderboard rankings across server restarts.
- **Supabase PostgreSQL Integration**:
  - `user_profiles`: Persistent identity, XP, level, coins, frames, and badges.
  - `matches`: Match logs, winner, turn count, total flips, and standings.
  - `player_stats`: Win rate %, cards played, UNO calls, caught challenges, and highest win streaks.
  - Global real-time leaderboard view.
- **Dual-Mode Zero-Config Operation**: Automatically synchronizes with local storage engine fallback when Supabase credentials are not specified, guaranteeing 100% uptime with zero setup overhead.

### 6. Asynchronous Multithreaded Auth & Security (`authCrypto.js`)
- **Worker Thread Key Derivation**: Password hashing utilizes **PBKDF2 with SHA-512 (100,000 iterations)**. Because hashing is executed asynchronously on Node.js's background `libuv` worker thread pool, CPU-intensive security checks never block the real-time event loop or WebSocket game frames.
- **Timing-Safe Verification**: Passwords are authenticated with `crypto.timingSafeEqual` constant-time buffer comparison to eliminate side-channel timing attacks.
- **Unique Player ID Engine**: Generates clean, collision-free codes (e.g., `UNO-9K2L`) using cryptographic random bytes.
- **Client Multithreading**: Background calculation tasks such as AI heuristic simulation and GPU particle physics are computed on dedicated client Web Workers (`aiWorker.js`, `particleWorker.js`) off the main browser rendering thread.

### 7. Reactive Zustand State Management (`gameStore.js`)
- **Centralized Client Store**: Manages reactive UI state for active tables, hand arrangements, match modals, sounds, theme toggles, and user sessions.
- **Sanitized Session Persistence**: Safely caches player profile, unique ID badge, and session tokens in `localStorage` with password and salt fields stripped.
- **Guest & Registered Hybrid Flow**: Seamlessly transitions between anonymous guest play and authenticated player profiles.

### 8. Tactile Audio Synthesizer (`audio.js`)
- **100% Zero-Dependency Web Audio API**: No external MP3 or audio asset loading.
- Generates procedural sound waves for:
  - Crisp card taps and table placements
  - Smooth card draws and deck deals
  - Mechanical riffle card shuffles
  - 3D frequency sweep flip wooshes
  - Resonant major-triad UNO brass shouts
  - Victory fanfares and caught buzzers

---

## 🔐 Account System & Authentication

UNO Flip features a fully custom, privacy-focused account architecture:

### Features
- **Unique Player ID**: Every account is assigned a Unique Player ID (e.g., `UNO-7821`) or custom tag chosen at registration.
- **Display Name & Password**: Secure credentials with salt-based PBKDF2 hashing.
- **Login with ID or Username**: Fast login via Unique ID or Display Name + Password.
- **Instant Guest Play**: One-click **Play as Guest** for zero-friction instant matches without creating an account.
- **Navigation Controls**: One-click **Back to Game** returning directly to the main arena from the login screen.

### REST Authentication API
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Registers player with Unique ID, Name, Password & Avatar | `{ id, username, password, avatar }` |
| `POST` | `/api/auth/login` | Authenticates player with ID/Username and Password | `{ idOrUsername, password }` |
| `GET` | `/api/auth/generate-id` | Returns a guaranteed-available random Unique ID suggestion | *None* |
| `GET` | `/api/auth/user/:id` | Fetches public player profile & stats | *None* |

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/gondchawarswaraj45/UNO_flip.git
cd UNO_flip
```

### 2. Start the Game Server
```bash
cd server
npm install
npm start
```
*The server will listen on `http://localhost:3001`.*

### 3. Start the Client Application
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
*Vite will launch the application at `http://localhost:5173`.*

Open your browser and navigate to `http://localhost:5173`.

---

## 🗄 Optional: Supabase Database Setup

To enable persistent global leaderboards and player accounts across server restarts:

1. Copy `.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Add your Supabase credentials to `server/.env`:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Execute the SQL script in [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

*(Note: The server automatically falls back to local atomic persistent storage (`uno_db.json`) if Supabase is not configured).*

---

## 📂 Project Structure

```
UNO_Flip/
├── docs/
│   └── images/                # HiDPI showcase screenshots & 3D render banner
│       ├── banner.jpg
│       ├── 01-landing-hub.png
│       ├── 02-mode-setup.png
│       ├── 03-lobby-room.png
│       ├── 04-gameplay-light.png
│       ├── 05-gameplay-dark.png
│       ├── 06-official-rules.png
│       ├── 07-action-cards-guide.png
│       ├── 08-victory-result.png
│       └── 09-leaderboard.png
├── supabase/
│   └── schema.sql             # Production PostgreSQL / Supabase schema
├── server/
│   ├── data/
│   │   └── uno_db.json        # Atomic persistent database file
│   ├── src/
│   │   ├── db/                # Persistent database storage & Supabase sync
│   │   │   ├── storageEngine.js # ACID-safe atomic storage engine
│   │   │   ├── supabaseClient.js
│   │   │   ├── repository.js
│   │   │   └── schema.sql
│   │   ├── services/
│   │   │   ├── authCrypto.js  # Multithreaded PBKDF2 crypto & unique ID generator
│   │   │   └── groqService.js # Groq AI match referee integration
│   │   ├── engine/            # Authoritative game state machine & rules
│   │   │   ├── config.js      # Game constants & mode settings
│   │   │   ├── shuffle.js     # Cryptographic Fisher-Yates shuffle
│   │   │   ├── cards.js       # Card deck definitions (4-color & 5-color)
│   │   │   ├── rules.js       # Turn validation & playability logic
│   │   │   ├── game.js        # Active game room state machine
│   │   │   └── ai.js          # Heuristic AI bot decision engine
│   │   ├── rooms/             # Room management & matchmaking lifecycle
│   │   │   └── roomManager.js
│   │   ├── sockets/           # Socket.IO event controllers
│   │   │   └── gameSocket.js
│   │   └── index.js           # Express server, auth endpoints & REST API
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/       # LandingScreen, LobbyScreen, GameScreen, LoginScreen, ResultScreen
│   │   │   ├── game/          # CardComponent, PlayerHand, OpponentArea, UnoButton, etc.
│   │   │   └── ui/            # ArcadeHeader, RulesModal, LeaderboardModal, ProfileModal
│   │   ├── hooks/             # useSocket.js, usePwaInstall.js
│   │   ├── services/          # authService.js (Unique ID/password REST client)
│   │   ├── store/             # Zustand gameStore with state & session persistence
│   │   ├── workers/           # aiWorker.js, particleWorker.js (off-main-thread compute)
│   │   ├── utils/             # Web Audio API synthesizer (audio.js) & constants
│   │   └── index.css          # Velvet midnight felt styling & animations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── scripts/                   # Headless screenshot automation scripts
├── .gitignore
├── .env.example
└── README.md
```

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
Card designs, typography, and gameplay rules are inspired by Mattel's official UNO® & UNO Flip!® games for personal, educational, and non-commercial portfolio use.
