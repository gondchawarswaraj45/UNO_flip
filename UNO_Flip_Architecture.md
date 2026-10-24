# UNO Flip — Project Architecture

## 1. Project Overview

UNO Flip is a full-stack multiplayer card game supporting online matches, private rooms, offline Pass & Play, and AI-controlled opponents.

The application provides a digital card-playing experience with Light Side and Dark Side mechanics.

## 2. Technology Stack

### Frontend

* React
* Vite
* Zustand for client-side state management
* Socket.IO client for real-time communication
* Web Audio API for procedural game sounds

### Backend

* Node.js
* Express
* Socket.IO
* Server-side game engine and validation logic

### Database and Persistence

* Local JSON-based persistence
* Optional Supabase/PostgreSQL integration for persistent player profiles, match history, and statistics

### AI Integration

* Groq-powered AI referee for game-event commentary and rule-related assistance

## 3. Main Backend Components

### Game Engine

The game engine manages game state, turn order, card plays, draws, and game rules.

### Card Definitions

The card definitions describe the available cards and their Light Side and Dark Side effects.

### Rule Validation

The rules module determines whether a move is valid according to the configured game rules.

### Room Management

The room manager handles multiplayer rooms and their lifecycle.

### Socket Controllers

Socket.IO handlers process real-time game events and communicate updates between the server and connected clients.

### Authentication

The authentication system manages player registration, login, and password verification.

## 4. Frontend Components

The React frontend includes screens for:

* Landing and game-mode selection
* Match configuration
* Multiplayer lobby
* Game table
* Player hands and opponent information
* Login and registration
* Match results
* Rules and leaderboard interfaces

Zustand manages client-side game and interface state.

## 5. Real-Time Multiplayer

Socket.IO enables communication between clients and the game server.

The intended architecture keeps authoritative game-state decisions on the server.

Clients submit player actions, the server validates them, and appropriate game updates are sent to connected participants.

Private information, such as opponents' card identities, should not be exposed to unauthorized clients.

## 6. Game Mechanics

The game supports Light Side and Dark Side card faces.

A FLIP action changes the active side of the game.

Other mechanics include:

* Number cards
* Skip and Reverse cards
* Draw cards
* Wild cards
* UNO calls
* Caught challenges

The precise behavior of each mechanic should be verified against the project's rule documentation and implementation.

## 7. Persistence

The repository documents a local JSON-based storage engine and optional Supabase/PostgreSQL integration.

The local storage implementation is designed to preserve account information and player statistics.

The optional database integration supports persistent profiles, match records, player statistics, and leaderboard information.

## 8. Security and Validation

The documented architecture uses server-side validation to enforce game rules.

Authentication uses password hashing and timing-safe verification.

The actual implementation should be inspected before making claims about security guarantees.

## 9. Knowledge Assistant Use Cases

An AI assistant connected to this project's documentation should be able to:

* Explain the architecture.
* Describe game rules.
* Identify relevant source files.
* Explain the responsibilities of backend modules.
* Answer questions about persistence.
* Help developers investigate documented issues.
* Distinguish documented behavior from assumptions.

## 10. Source of Truth

The GitHub repository, its source code, and its rule documentation remain the authoritative sources for verifying implementation details.

AI-generated explanations should be checked against these sources before being treated as factual.
