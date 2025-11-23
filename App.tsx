
import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';
import CrashGame from './components/CrashGame';
import WheelGame from './components/WheelGame';
import MinesGame from './components/MinesGame';
import Shop from './components/Shop';
import BattleLobby from './components/BattleLobby';
import BattleArena from './components/BattleArena';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerName, setPlayerName] = useState<string>('');
  const [lastScore, setLastScore] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);

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

  const startBattle = (battleId: string) => {
      setActiveBattleId(battleId);
      setGameState(GameState.BATTLE_ARENA);
  }

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
          onOpenMines={() => setGameState(GameState.MINES)}
          onOpenShop={() => setGameState(GameState.SHOP)}
          onOpenBattle={() => setGameState(GameState.BATTLE_LOBBY)}
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

      {gameState === GameState.MINES && (
        <MinesGame onBack={goHome} />
      )}

      {gameState === GameState.SHOP && (
        <Shop onBack={goHome} />
      )}

      {gameState === GameState.BATTLE_LOBBY && (
        <BattleLobby 
            onBack={goHome} 
            onBattleStart={startBattle}
            playerName={playerName || user?.displayName || 'Anonim'}
        />
      )}

      {gameState === GameState.BATTLE_ARENA && activeBattleId && (
        <BattleArena 
            battleId={activeBattleId} 
            onLeave={goHome}
        />
      )}
    </main>
  );
};

export default App;
