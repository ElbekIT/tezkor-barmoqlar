import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, Coins } from 'lucide-react';
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
  const [cashOutWin, setCashOutWin] = useState(0);

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
    setCashOutWin(0);
    setMultiplier(1.00);
    setIsPlaying(true);

    // Balansdan pul yechish
    if (auth.currentUser) {
      const userCoinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      await runTransaction(userCoinsRef, (current) => (current || 0) - betAmount);
    }

    // CRASH ALGORITMI: 50% ehtimol bilan 1.0x da portlaydi
    const isInstantCrash = Math.random() < 0.5; 
    
    if (isInstantCrash) {
      crashPointRef.current = 1.00;
    } else {
      // Agar darrov portlamasa, 1.1x dan 5.0x gacha tasodifiy uchadi
      // (Logaritmik taqsimot emas, oddiy random qildik foydalanuvchi so'rovi bo'yicha)
      crashPointRef.current = 1.1 + Math.random() * 4; 
    }

    startTimeRef.current = Date.now();
    runGameLoop();
  };

  const runGameLoop = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000; // soniyalar
    // Sekin o'sish formulasi: 1 + (t * 0.5)
    let currentMult = 1.00 + (elapsed * 0.4); 
    
    // Agar 1.0 da portlashi kerak bo'lsa, loop boshlanishi bilan tugaydi
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
    setCashOutWin(winAmount);
    setMessage(`YUTDINGIZ: +${winAmount} tanga!`);

    // Yutuqni balansga qo'shish
    if (auth.currentUser) {
      const userCoinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      await runTransaction(userCoinsRef, (current) => (current || 0) + winAmount);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
       <div className="w-full max-w-md flex justify-between items-center mb-8">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg">
            <ArrowLeft />
          </button>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-yellow-500/30">
            <Coins className="text-yellow-400 w-5 h-5" />
            <span className="text-yellow-400 font-bold">{balance}</span>
          </div>
       </div>

       <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-8 uppercase tracking-wider">
         Omadni Sinang
       </h2>

       {/* Game Screen */}
       <div className="relative w-full max-w-md h-64 bg-gray-800 rounded-2xl border-4 border-gray-700 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
          
          {/* Multiplier Display */}
          <div className={`text-6xl font-black z-10 font-mono ${hasCrashed ? 'text-red-500' : 'text-white'}`}>
            {multiplier.toFixed(2)}x
          </div>
          
          {hasCrashed && (
            <div className="absolute top-4 text-red-500 font-bold flex items-center gap-2 animate-bounce">
              <AlertTriangle /> PORTLADI!
            </div>
          )}

          {cashOutWin > 0 && !hasCrashed && !isPlaying && (
             <div className="absolute bottom-4 text-green-400 font-bold text-xl animate-pop">
               {message}
             </div>
          )}

          {/* Plane Animation (Simple CSS) */}
          {isPlaying && (
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neonBlue to-transparent animate-pulse"></div>
          )}
          
          <div className={`transition-all duration-100 ${isPlaying ? 'scale-110 text-neonBlue' : 'text-gray-600'}`}>
            <TrendingUp size={80} />
          </div>
       </div>

       {/* Controls */}
       <div className="w-full max-w-md mt-8 space-y-4">
          <div className="bg-gray-800 p-4 rounded-xl">
            <label className="text-gray-400 text-sm block mb-2">Tikish summasi:</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                disabled={isPlaying}
                className="flex-1 bg-gray-900 border border-gray-600 text-white p-3 rounded-lg text-center font-bold focus:border-neonBlue outline-none"
              />
              <button 
                onClick={() => setBetAmount(Math.floor(balance / 2))}
                disabled={isPlaying}
                className="bg-gray-700 text-xs text-gray-300 px-3 rounded-lg hover:bg-gray-600"
              >
                1/2
              </button>
              <button 
                onClick={() => setBetAmount(balance)}
                disabled={isPlaying}
                className="bg-gray-700 text-xs text-gray-300 px-3 rounded-lg hover:bg-gray-600"
              >
                MAX
              </button>
            </div>
          </div>

          {!isPlaying ? (
            <button 
              onClick={startGame}
              disabled={balance < betAmount || betAmount <= 0}
              className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transform transition-all active:scale-95
                ${balance < betAmount ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 text-black'}
              `}
            >
              START (Xavf 50%)
            </button>
          ) : (
            <button 
              onClick={handleCashOut}
              className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)] transform transition-all active:scale-95"
            >
              OLISH ({(betAmount * multiplier).toFixed(0)})
            </button>
          )}
          
          {message && !cashOutWin && (
            <p className="text-red-500 text-center font-bold">{message}</p>
          )}

          <p className="text-center text-gray-500 text-xs mt-4">
            Diqqat: 1.00x da portlash ehtimoli 50%! Ehtiyot bo'ling.
          </p>
       </div>
    </div>
  );
};

export default CrashGame;