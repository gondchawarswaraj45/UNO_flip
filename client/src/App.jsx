/**
 * App — top-level component.
 * Initializes the socket connection and routes between screens.
 */

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import useGameStore from './store/gameStore';

import LoginScreen   from './components/screens/LoginScreen';
import LandingScreen from './components/screens/LandingScreen';
import LobbyScreen   from './components/screens/LobbyScreen';
import GameScreen    from './components/screens/GameScreen';
import ResultScreen  from './components/screens/ResultScreen';

export default function App() {
  // Initialize socket connection once
  useSocket();

  const screen = useGameStore(s => s.screen);
  const isAuthenticated = useGameStore(s => s.isAuthenticated);

  const showLogin = screen === 'LOGIN' || !isAuthenticated;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a2236',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
          },
        }}
      />

      {/* Google Mail Login & Guest Selection Portal */}
      {showLogin && <LoginScreen />}

      {!showLogin && screen === 'LANDING' && <LandingScreen />}
      {!showLogin && screen === 'LOBBY'   && <LobbyScreen   />}
      {!showLogin && screen === 'GAME'    && <GameScreen     />}
      {!showLogin && screen === 'RESULT'  && <ResultScreen   />}
    </>
  );
}
