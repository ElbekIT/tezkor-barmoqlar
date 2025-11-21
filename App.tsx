
import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';
import CrashGame from './components/CrashGame';
import WheelGame from './components/WheelGame';
import Shop from './components/Shop';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerName, setPlayerName] = useState<string>('');
  const [lastScore, setLastScore] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const startGame = (name: string) => {
    setPlayerName(name);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setGameState(GameState.GAME_OVER);
  };

  const goHome = () => {
    setGameState(GameState.MENU);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="font-sans antialiased">
      {gameState === GameState.MENU && (
        <MainMenu 
          onStartGame={startGame} 
          onShowLeaderboard={() => setGameState(GameState.LEADERBOARD)}
          onOpenChat={() => setGameState(GameState.CHAT)}
          onOpenCrash={() => setGameState(GameState.CRASH)}
          onOpenWheel={() => setGameState(GameState.WHEEL)}
          onOpenShop={() => setGameState(GameState.SHOP)}
          user={user}
        />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game 
          playerName={playerName} 
          onGameOver={handleGameOver} 
          onCancel={goHome}
        />
      )}
      
      {gameState === GameState.GAME_OVER && (
        <GameOver 
          score={lastScore} 
          playerName={playerName} 
          onRestart={() => setGameState(GameState.PLAYING)} 
          onHome={goHome}
        />
      )}
      
      {gameState === GameState.LEADERBOARD && (
        <Leaderboard onBack={goHome} />
      )}

      {gameState === GameState.CHAT && (
        <Chat onBack={goHome} playerName={playerName || user?.displayName || 'Anonim'} />
      )}

      {gameState === GameState.CRASH && (
        <CrashGame onBack={goHome} />
      )}

      {gameState === GameState.WHEEL && (
        <WheelGame onBack={goHome} />
      )}

      {gameState === GameState.SHOP && (
        <Shop onBack={goHome} />
      )}
    </main>
  );
};

export default App;
