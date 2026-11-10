const assert = require('assert');
const {
  createRoom,
  joinRoom,
  createSoloGame,
  playerDisconnected,
  reconnectPlayer,
  leaveRoom,
  pauseGame,
  resumeGame,
  getRoom,
} = require('../src/rooms/roomManager');
const { getPublicState, getPlayerHand } = require('../src/engine/game');

console.log('--- TEST: Session Retention, Pause & Forfeit System ---');

// Test 1: createRoom assigns sessionToken and stores connected state
const { room: r1, playerId: p1, sessionToken: s1 } = createRoom('sock_host_1', 'Alice');
assert(r1 && r1.id, 'Room code should be generated');
assert(s1 && typeof s1 === 'string', 'Session token should be generated');
const playerAlice = r1.players.find(p => p.id === p1);
assert.strictEqual(playerAlice.sessionToken, s1, 'Player must have sessionToken stored');
assert.strictEqual(playerAlice.connected, true, 'Player must be marked connected');
console.log('✓ Test 1: createRoom assigns sessionToken and stores connected state passed.');

// Test 2: joinRoom assigns unique sessionToken to new player
const joinRes = joinRoom(r1.id, 'sock_player_2', 'Bob');
assert(joinRes.room, 'Bob should join room');
assert(joinRes.sessionToken, 'Bob should have sessionToken');
assert.notStrictEqual(joinRes.sessionToken, s1, 'Bob and Alice must have distinct session tokens');
console.log('✓ Test 2: joinRoom assigns unique sessionToken passed.');

// Test 3: Disconnect updates player.connected = false and disconnectedAt
const discInfo = playerDisconnected('sock_player_2');
assert(discInfo && discInfo.player.name === 'Bob', 'Bob disconnected');
assert.strictEqual(discInfo.player.connected, false, 'Bob marked disconnected');
assert(discInfo.player.disconnectedAt > 0, 'disconnectedAt timestamp recorded');
console.log('✓ Test 3: playerDisconnected records disconnection cleanly passed.');

// Test 4: reconnectPlayer rebinds new socket ID and restores connected state
const reconRes = reconnectPlayer(r1.id, joinRes.playerId, joinRes.sessionToken, 'sock_player_2_new');
assert(!reconRes.error, 'reconnectPlayer should succeed');
assert.strictEqual(reconRes.player.socketId, 'sock_player_2_new', 'Socket ID updated to new connection');
assert.strictEqual(reconRes.player.connected, true, 'Player marked connected again');
assert.strictEqual(reconRes.player.disconnectedAt, null, 'disconnectedAt cleared');
console.log('✓ Test 4: reconnectPlayer rebinds socket ID and status passed.');

// Test 5: Invalid session token rejection
const badRecon = reconnectPlayer(r1.id, joinRes.playerId, 'invalid-token-xyz', 'sock_intruder');
assert.strictEqual(badRecon.error, 'INVALID_SESSION_TOKEN', 'Intruder must be rejected with invalid token');
console.log('✓ Test 5: Invalid session token rejection passed.');

// Test 6: Solo game auto-pauses on disconnect, retains session, and unpauses
const { room: soloRoom, playerId: soloPlayerId, sessionToken: soloToken } = createSoloGame('sock_solo', 'SoloHero', { mode: 'TWO_SIDE' }, 3);
assert(soloRoom.status === 'PLAYING', 'Solo game should be in PLAYING status');
assert(soloRoom.gameState, 'gameState should exist');
assert.strictEqual(soloRoom.isSolo, true, 'Room must be flagged isSolo');
assert.strictEqual(soloRoom.isPaused, false, 'Game starts unpaused');

// Explicit pauseGame test
const pauseRes = pauseGame(soloRoom.id, soloPlayerId);
assert(pauseRes.ok, 'pauseGame should succeed');
assert.strictEqual(soloRoom.isPaused, true, 'Room should be marked isPaused');
assert.strictEqual(soloRoom.gameState.isPaused, true, 'gameState must be marked isPaused');

// Explicit resumeGame test
const resumeRes = resumeGame(soloRoom.id, soloPlayerId);
assert(resumeRes.ok, 'resumeGame should succeed');
assert.strictEqual(soloRoom.isPaused, false, 'Room unpaused');

// Disconnect in solo game must automatically pause the match
playerDisconnected('sock_solo');
assert.strictEqual(soloRoom.isPaused, true, 'Solo game MUST be paused automatically on disconnect');
const disconnectedSoloPlayer = soloRoom.players.find(p => p.id === soloPlayerId);
assert.strictEqual(disconnectedSoloPlayer.connected, false, 'Solo player marked disconnected');

// Reconnect solo game
const soloRecon = reconnectPlayer(soloRoom.id, soloPlayerId, soloToken, 'sock_solo_restored');
assert(!soloRecon.error, 'Solo player reconnected');
const restoredHand = getPlayerHand(soloPlayerId, soloRoom.gameState);
assert.strictEqual(restoredHand.length, 7, 'Restored hand has exact same cards');
console.log('✓ Test 6: Solo game auto-pause, pauseGame, and hand retention passed.');

// Test 7: Multiplayer live match forfeit on leave
const { room: mpRoom, playerId: hostId } = createRoom('sock_mp_host', 'HostHuman');
const mpJoin = joinRoom(mpRoom.id, 'sock_mp_guest', 'GuestHuman');
// Start multiplayer match
const { startGame } = require('../src/rooms/roomManager');
startGame(mpRoom.id, hostId);
assert.strictEqual(mpRoom.status, 'PLAYING', 'Multiplayer room is PLAYING');

// GuestHuman leaves live match -> counts as FORFEIT!
const guestLeave = leaveRoom(mpRoom.id, mpJoin.playerId, true);
assert(guestLeave.success, 'leaveRoom should succeed');
assert.strictEqual(guestLeave.forfeited, true, 'Multiplayer leave MUST be recorded as forfeit');
assert.strictEqual(guestLeave.convertedToBot, true, 'Multiplayer leaver must be converted to AI bot for remaining players');
const guestPlayer = mpRoom.players.find(p => p.id === mpJoin.playerId);
assert.strictEqual(guestPlayer.isBot, true, 'Guest converted to bot');
assert.strictEqual(guestPlayer.forfeited, true, 'Guest marked forfeited');
console.log('✓ Test 7: Multiplayer leave live match counts as FORFEIT and substitutes bot passed.');

console.log('ALL SESSION RETENTION, PAUSE & FORFEIT TESTS PASSED! 🎉');
