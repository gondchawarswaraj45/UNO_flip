# UNO Flip — Authoritative Digital Card Studio

A premier, server-authoritative digital card game inspired by UNO & UNO Flip, built with **React + Vite** (frontend), **Node.js + Express + Socket.IO** (authoritative real-time game server), and **PostgreSQL via Supabase** (persistent storage).

---

## 🏛 Architecture & Philosophy

1. **Authoritative Real-Time Game Server**:
   - Active room state, player hands, deck management, and real-time turn rotations are maintained authoritatively in Node.js memory and synchronized in real time via Socket.IO.
   - Zero cheating potential: players only ever receive their own private hand cards. Opponents receive only card counts and public state.
   - Atomic Caught window: server-enforced 3-second timer, self-catch prevention, +7 card penalty.

2. **Persistent Database Layer (PostgreSQL / Supabase)**:
   - Does **not** store high-frequency card actions or volatile ephemeral state in PostgreSQL.
   - Dedicated schema in [`supabase/schema.sql`](supabase/schema.sql) for:
     - User profiles and persistent player identity
     - Room audit and player membership logs
     - Full match records (room code, winner, duration, total turns, total flips, standings)
     - Lifetime player statistics (matches played, won, win rate %, cards played, UNO calls, caught successes, total score)
     - Global public leaderboard view
   - Designed with an abstraction repository layer ready for horizontal scaling (e.g., Redis cluster integration).

3. **Luxury Studio Design System & Tactile Audio**:
   - Velvet midnight felt table atmosphere (`#080b12`) with champagne gold metallic trims and tangible card physics.
   - Curated, physical card palettes (no generic neon AI colors).
   - Zero-dependency Web Audio API sound synthesizer (`audio.js`) for card clicks, deck draws, 3D flip wooshes, UNO brass calls, and victory fanfares.

---

## ⚡ Quick Start

### 1. Start the Game Server
```bash
cd server
npm install
npm start          # Runs on http://localhost:3001
```

### 2. Start the Client
```bash
cd client
npm install
npm run dev        # Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🗄 Supabase / PostgreSQL Setup

1. Copy `.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
2. Enter your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```
3. Run the SQL schema from [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.
*(Note: If Supabase credentials are not provided, the server automatically operates in local persistent memory fallback mode with zero downtime or crashes!)*

---

## 🎮 Game Modes & Rules

### Modes
- **Classic UNO (4 Colors)**: Red, Blue, Green, Yellow
- **Classic UNO (5 Colors)**: Red, Blue, Green, Yellow + Orchid Purple
- **Two-Side UNO (4 Colors)**: Dual-faced cards with dynamic FLIP transitions (Light ↔ Dark)
- **Two-Side UNO (5 Colors)**: Full dual-sided deck with 5 colors per side

### Mechanics
- **Authoritative Fisher-Yates shuffle** with rejection sampling and `crypto.getRandomValues()`.
- **Manual UNO Call**: must be called manually; no automated assistance or strategic hints.
- **Caught Challenge**: 3-second server-authoritative challenge window for rule violations and missed UNO calls.
- **AI Bots**: Casual, Tactical, and Expert difficulty levels running entirely on the server.

---

## 📂 Project Structure

```
UNO_Flip/
├── supabase/
│   └── schema.sql             # Production PostgreSQL / Supabase schema
├── server/
│   ├── src/
│   │   ├── db/                # Supabase client & persistent repository layer
│   │   │   ├── supabaseClient.js
│   │   │   ├── repository.js
│   │   │   └── schema.sql
│   │   ├── engine/            # Authoritative game state machine & rules
│   │   │   ├── config.js
│   │   │   ├── shuffle.js
│   │   │   ├── cards.js
│   │   │   ├── rules.js
│   │   │   ├── game.js
│   │   │   └── ai.js
│   │   ├── rooms/             # Room management & lifecycle
│   │   │   └── roomManager.js
│   │   ├── sockets/           # Socket.IO event handlers
│   │   │   └── gameSocket.js
│   │   └── index.js           # Express server & REST API
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/       # LandingScreen, LobbyScreen, GameScreen, ResultScreen
│   │   │   ├── game/          # CardComponent, PlayerHand, OpponentArea, UnoButton, etc.
│   │   │   └── ui/            # LeaderboardModal
│   │   ├── hooks/useSocket.js # Socket.IO client synchronization
│   │   ├── store/gameStore.js # Zustand store with persistent identity
│   │   ├── utils/             # Web Audio API synthesizer & constants
│   │   │   ├── audio.js
│   │   │   └── constants.js
│   │   └── index.css          # Studio design system & felt animations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
├── .env.example
└── README.md
```
