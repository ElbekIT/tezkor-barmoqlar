
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, XCircle, Keyboard } from 'lucide-react';

interface GameProps {
  playerName: string;
  onGameOver: (score: number) => void;
  onCancel: () => void;
}

const GAME_DURATION = 60; // seconds

const Game: React.FC<GameProps> = ({ playerName, onGameOver, onCancel }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targetChar, setTargetChar] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [inputValue, setInputValue] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Generate random character (A-Z, 0-9)
  const generateChar = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const char = chars.charAt(Math.floor(Math.random() * chars.length));
    setTargetChar(char);
  }, []);

  // Initial setup
  useEffect(() => {
    generateChar();
    inputRef.current?.focus();

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [generateChar]);

  // Check game over
  useEffect(() => {
    if (timeLeft === 0) {
      onGameOver(score);
    }
  }, [timeLeft, onGameOver, score]);

  // Focus management to keep keyboard open on mobile
  const keepFocus = () => {
    inputRef.current?.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    // Get the last typed character
    const lastChar = val.slice(-1).toUpperCase();
    
    if (lastChar === targetChar) {
      setScore(s => s + 1);
      setFeedback('correct');
      generateChar();
    } else {
      setFeedback('wrong');
      // Optional: Penalty?
    }

    // Clear input but keep focus logic clean
    setInputValue('');
    
    // Visual feedback reset
    setTimeout(() => setFeedback('none'), 200);
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center select-none overflow-hidden"
      onClick={keepFocus}
    >
      {/* Hidden Input for Mobile Keyboard & Desktop Typing */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInput}
        className="absolute opacity-0 w-full h-full cursor-default top-0 left-0 z-0"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* HUD */}
      <div className="absolute top-0 w-full flex justify-between items-center p-6 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3 bg-gray-800/80 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-700">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-gray-300 font-bold uppercase tracking-wider text-sm">{playerName}</span>
        </div>
        
        <div className="flex flex-col items-center">
           <div className="text-4xl font-black text-neonBlue drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] font-mono">
             {timeLeft}
           </div>
           <span className="text-xs text-gray-400 uppercase">soniya</span>
        </div>

        <div className="flex flex-col items-end">
           <div className="text-4xl font-black text-neonPurple drop-shadow-[0_0_10px_rgba(188,19,254,0.8)]">
             {score}
           </div>
           <span className="text-xs text-gray-400 uppercase">ball</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none">
        
        <div className="mb-8 text-gray-400 text-sm uppercase tracking-[0.2em] animate-pulse">
           <Keyboard className="inline w-4 h-4 mr-2 mb-1" />
           {/Mobi|Android/i.test(navigator.userAgent) ? 'Klaviaturada yozing' : 'Tugmani bosing'}
        </div>

        {/* Character Display */}
        <div 
          className={`
            relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64 rounded-3xl 
            bg-gray-800/50 backdrop-blur-xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]
            transition-all duration-100 transform
            ${feedback === 'correct' ? 'border-green-500 scale-110 bg-green-500/20' : ''}
            ${feedback === 'wrong' ? 'border-red-500 shake bg-red-500/20' : 'border-gray-600'}
          `}
        >
           <span className={`
             text-9xl md:text-[10rem] font-black select-none
             ${feedback === 'correct' ? 'text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]' : ''}
             ${feedback === 'wrong' ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]' : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]'}
           `}>
             {targetChar}
           </span>
        </div>

        <p className="mt-12 text-gray-500 text-xs md:text-sm max-w-xs text-center">
           Ekranga istalgan joyga bosing klaviaturani chaqirish uchun
        </p>
      </div>

      {/* Cancel Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 p-4 bg-gray-800/80 text-red-500 rounded-full hover:bg-gray-700 border border-red-500/30 transition-all active:scale-90"
      >
        <XCircle className="w-8 h-8" />
      </button>

      <style>{`
        .shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Game;
    