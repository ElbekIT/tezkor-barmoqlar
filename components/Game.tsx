import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target } from '../types';
import { Timer, XCircle } from 'lucide-react';

interface GameProps {
  playerName: string;
  onGameOver: (score: number) => void;
  onCancel: () => void;
}

const GAME_DURATION = 30; // seconds

const Game: React.FC<GameProps> = ({ playerName, onGameOver, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targets, setTargets] = useState<Target[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null); // For countdown

  // Generate a random target
  const spawnTarget = useCallback(() => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 80) + 10; // Keep within 10-90%
    const y = Math.floor(Math.random() * 80) + 10;
    const colors = ['bg-neonBlue', 'bg-neonPurple', 'bg-green-400', 'bg-yellow-400'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    setTargets((prev) => [...prev, { id, x, y, color }]);

    // Auto remove if too many targets (difficulty scaling)
    if (targets.length > 5) {
        setTargets(prev => prev.slice(1)); 
    }
  }, [targets.length]);

  // Initial start
  useEffect(() => {
    // Countdown timer
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // We can't call endGame directly easily here due to closure, so we rely on useEffect dependency or just set it to 0 and handle in another effect
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn initial targets
    spawnTarget();
    
    // Spawn loop - periodic spawn check
    const spawnInterval = window.setInterval(() => {
        if (Math.random() > 0.3) spawnTarget(); 
    }, 600);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      window.clearInterval(spawnInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor time left to end game
  useEffect(() => {
    if (timeLeft === 0) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      onGameOver(score);
    }
  }, [timeLeft, onGameOver, score]);

  const handleTargetClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setScore((prev) => prev + 1);
    setTargets((prev) => prev.filter((t) => t.id !== id));
    // Spawn a new one immediately upon click for fast pacing
    spawnTarget();
    // Small chance to spawn a bonus second one
    if (Math.random() > 0.7) spawnTarget();
  };

  const handleMiss = () => {
    // Optional: Penalty for clicking background
    // setScore(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col select-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700 z-20">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">O'yinchi:</span>
          <span className="font-bold text-white">{playerName}</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-2xl font-mono font-bold text-neonBlue">
          <Timer className="w-6 h-6" />
          {timeLeft}s
        </div>
        <div className="text-3xl font-black text-neonPurple">
          {score}
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair touch-manipulation"
        onMouseDown={handleMiss}
      >
        {targets.map((target) => (
          <button
            key={target.id}
            style={{
              top: `${target.y}%`,
              left: `${target.x}%`,
            }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full ${target.color} shadow-[0_0_20px_rgba(255,255,255,0.5)] border-4 border-white flex items-center justify-center active:scale-90 transition-transform animate-pop`}
            onMouseDown={(e) => handleTargetClick(e, target.id)}
          >
            <div className="w-4 h-4 bg-white rounded-full opacity-50"></div>
          </button>
        ))}
      </div>

      {/* Cancel Button */}
      <button 
        onClick={onCancel}
        className="absolute bottom-4 left-4 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full z-30"
      >
        <XCircle className="w-8 h-8" />
      </button>
    </div>
  );
};

export default Game;