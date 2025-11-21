
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Coins, Rocket, Flame } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue } from "firebase/database";

interface CrashGameProps {
  onBack: () => void;
}

const CrashGame: React.FC<CrashGameProps> = ({ onBack }) => {
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [message, setMessage] = useState("");
  
  // Animation State
  const [planePosition, setPlanePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const crashPointRef = useRef(0);
  const reqRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // Balansni kuzatish
  useEffect(() => {
    if (auth.currentUser) {
      const userCoinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      const unsubscribe = onValue(userCoinsRef, (snapshot) => {
        setBalance(snapshot.val() || 0);
      });
      return () => unsubscribe();
    }
  }, []);

  const startGame = async () => {
    if (betAmount > balance) {
      setMessage("Balans yetarli emas!");
      return;
    }
    if (betAmount <= 0) {
      setMessage("Noto'g'ri summa!");
      return;
    }

    setMessage("");
    setHasCrashed(false);
    setMultiplier(1.00);
    setIsPlaying(true);
    setPlanePosition({ x: 0, y: 0 });

    if (auth.currentUser) {
      const userCoinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      await runTransaction(userCoinsRef, (current) => (current || 0) - betAmount);
    }

    const isInstantCrash = Math.random() < 0.5; 
    if (isInstantCrash) {
      crashPointRef.current = 1.00;
    } else {
      crashPointRef.current = 1.1 + Math.random() * 10; // Bigger range for visuals
    }

    startTimeRef.current = Date.now();
    runGameLoop();
  };

  const runGameLoop = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    let currentMult = 1.00 + (Math.pow(elapsed, 2) * 0.1); // Exponential curve
    
    // Normalize for display max (visual only)
    // We want curve to move right and up.
    const x = Math.min(elapsed * 10, 100); // 0 to 100%
    const y = Math.min(Math.pow(elapsed, 2) * 5, 100); // 0 to 100%

    setPlanePosition({ x, y });

    if (crashPointRef.current === 1.00) {
      crash(1.00);
      return;
    }

    if (currentMult >= crashPointRef.current) {
      crash(crashPointRef.current);
    } else {
      setMultiplier(currentMult);
      reqRef.current = requestAnimationFrame(runGameLoop);
    }
  };

  const crash = (finalValue: number) => {
    setMultiplier(finalValue);
    setIsPlaying(false);
    setHasCrashed(true);
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
  };

  const handleCashOut = async () => {
    if (!isPlaying || hasCrashed) return;
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    setIsPlaying(false);

    const winAmount = Math.floor(betAmount * multiplier);
    setMessage(`YUTDINGIZ: +${winAmount} tanga!`);

    if (auth.currentUser) {
      const userCoinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      await runTransaction(userCoinsRef, (current) => (current || 0) + winAmount);
    }
  };

  // Canvas drawing for the curve trail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    const resize = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }
    resize();
    
    if(isPlaying && !hasCrashed) {
        // Drawing logic would go here in a real loop, 
        // but for this simplified react version, we rely on the planePosition state for the head
        // We can draw a quadratic curve from bottom-left to plane pos
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        const targetX = (planePosition.x / 100) * canvas.width;
        const targetY = canvas.height - ((planePosition.y / 100) * canvas.height);
        
        ctx.quadraticCurveTo(targetX * 0.5, canvas.height, targetX, targetY);
        ctx.strokeStyle = '#00f3ff'; // Neon Blue
        ctx.lineWidth = 4;
        ctx.stroke();
    } else if (!isPlaying && !hasCrashed) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [planePosition, isPlaying, hasCrashed]);


  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
       <div className="w-full max-w-md flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg">
            <ArrowLeft />
          </button>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-yellow-500/30">
            <Coins className="text-yellow-400 w-5 h-5" />
            <span className="text-yellow-400 font-bold">{balance}</span>
          </div>
       </div>

       <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wider flex items-center gap-2">
         <Rocket className="text-red-500" /> Crash <span className="text-neonBlue">Pro</span>
       </h2>

       {/* Game Visual Area */}
       <div className="relative w-full max-w-md h-80 bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden shadow-2xl mb-6">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20" 
               style={{backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
          </div>

          {/* Multiplier Center Text */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-black font-mono z-20 
             ${hasCrashed ? 'text-red-600' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}>
            {multiplier.toFixed(2)}x
          </div>

          {/* Canvas for Trail */}
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />

          {/* The Plane */}
          {!hasCrashed && isPlaying && (
             <div 
               className="absolute z-10 transition-transform duration-75 ease-linear"
               style={{
                 left: `${planePosition.x}%`,
                 bottom: `${planePosition.y}%`,
                 transform: `translate(-50%, 50%) rotate(${-45}deg)` // Simple rotation
               }}
             >
                <Rocket className="w-10 h-10 text-red-500 fill-current drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
                {/* Flame tail */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-6 bg-orange-500 blur-sm rounded-full"></div>
             </div>
          )}

          {/* Explosion */}
          {hasCrashed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 backdrop-blur-sm">
               <div className="text-center animate-pop">
                 <Flame className="w-24 h-24 text-orange-500 mx-auto mb-2 animate-bounce" />
                 <h3 className="text-4xl font-black text-red-500 uppercase">PORTLADI!</h3>
               </div>
            </div>
          )}
       </div>

       {/* Controls */}
       <div className="w-full max-w-md space-y-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
             <label className="text-gray-400 text-sm">Tikish summasi:</label>
             <div className="flex gap-2">
               <button onClick={() => setBetAmount(10)} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">10</button>
               <button onClick={() => setBetAmount(50)} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">50</button>
               <button onClick={() => setBetAmount(100)} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">100</button>
             </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
              disabled={isPlaying}
              className="flex-1 bg-gray-900 border border-gray-600 text-white p-4 rounded-xl text-center font-bold text-xl focus:border-neonBlue outline-none"
            />
          </div>

          {!isPlaying ? (
            <button 
              onClick={startGame}
              disabled={balance < betAmount || betAmount <= 0}
              className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transform transition-all active:scale-95 relative overflow-hidden
                ${balance < betAmount ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white'}
              `}
            >
               START
            </button>
          ) : (
            <button 
              onClick={handleCashOut}
              className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)] transform transition-all active:scale-95"
            >
              OLISH ({(betAmount * multiplier).toFixed(0)})
            </button>
          )}
          
          {message && !hasCrashed && (
            <p className="text-green-400 text-center font-bold mt-2 animate-pulse">{message}</p>
          )}

          <div className="mt-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
             <p className="text-center text-red-400 text-xs">
                OGOHLANTIRISH: 1.00x da portlash ehtimoli 50%.
             </p>
          </div>
       </div>
    </div>
  );
};

export default CrashGame;
