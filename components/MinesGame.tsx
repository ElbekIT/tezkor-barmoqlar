
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bomb, Diamond, Coins, Gem, RefreshCw } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue } from "firebase/database";

interface MinesGameProps {
  onBack: () => void;
}

const MinesGame: React.FC<MinesGameProps> = ({ onBack }) => {
  const [currency, setCurrency] = useState<'coins' | 'diamonds'>('coins');
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<number[]>([]); // 0: safe, 1: mine
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      const userBalanceRef = ref(db, `users/${auth.currentUser.uid}/${currency}`);
      const unsubscribe = onValue(userBalanceRef, (snapshot) => {
        setBalance(snapshot.val() || 0);
      });
      return () => unsubscribe();
    }
  }, [currency]);

  // Calculate next multiplier
  const getNextMultiplier = (safeTilesLeft: number, totalTilesLeft: number) => {
      // Logic: House edge applied. Standard probability inverse.
      // Probability of hitting safe = Safe / Total.
      // Multiplier ~= 0.99 / Probability.
      // Simplified accumulative multiplier.
      const probability = safeTilesLeft / totalTilesLeft;
      return currentMultiplier * (0.97 / probability); 
  };

  const startGame = async () => {
    if (betAmount > balance || betAmount <= 0) return;

    if (auth.currentUser) {
        const userBalanceRef = ref(db, `users/${auth.currentUser.uid}/${currency}`);
        await runTransaction(userBalanceRef, (current) => (current || 0) - betAmount);
    }

    // Generate Grid
    const newGrid = Array(25).fill(0);
    let minesPlaced = 0;
    while(minesPlaced < minesCount) {
        const idx = Math.floor(Math.random() * 25);
        if(newGrid[idx] === 0) {
            newGrid[idx] = 1;
            minesPlaced++;
        }
    }

    setGrid(newGrid);
    setRevealed(Array(25).fill(false));
    setGameActive(true);
    setGameOver(false);
    setWin(false);
    setCurrentMultiplier(1.0);
    setProfit(0);
  };

  const handleTileClick = (index: number) => {
      if (!gameActive || revealed[index] || gameOver) return;

      const newRevealed = [...revealed];
      newRevealed[index] = true;
      setRevealed(newRevealed);

      if (grid[index] === 1) {
          // BOOM
          setGameOver(true);
          setGameActive(false);
          // Reveal all mines
          const finalRevealed = newRevealed.map((_, i) => grid[i] === 1 || newRevealed[i]);
          setRevealed(finalRevealed);
      } else {
          // SAFE
          const safeRevealedCount = newRevealed.filter((r, i) => r && grid[i] === 0).length;
          const totalSafeTiles = 25 - minesCount;
          
          if (safeRevealedCount === totalSafeTiles) {
             // Auto Cashout (All cleared)
             cashOut(newRevealed);
          } else {
             // Update Multiplier
             const remainingSafe = totalSafeTiles - (safeRevealedCount - 1);
             const remainingTotal = 25 - (safeRevealedCount - 1);
             const nextMult = getNextMultiplier(remainingSafe, remainingTotal);
             setCurrentMultiplier(nextMult);
             setProfit(betAmount * nextMult);
          }
      }
  };

  const cashOut = async (finalRevealedState?: boolean[]) => {
      if (!gameActive) return;
      
      setGameActive(false);
      setWin(true);
      setGameOver(true);
      if(finalRevealedState) setRevealed(finalRevealedState);

      const winAmount = Math.floor(profit > 0 ? profit : betAmount); // Safety if cashout immediately (shouldn't happen usually)
      
      if (auth.currentUser) {
          const userBalanceRef = ref(db, `users/${auth.currentUser.uid}/${currency}`);
          await runTransaction(userBalanceRef, (current) => (current || 0) + winAmount);
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
       {/* Header */}
       <div className="w-full max-w-md flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700">
            <ArrowLeft />
          </button>
          <div className={`flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border ${currency === 'coins' ? 'border-yellow-500/50' : 'border-blue-500/50'}`}>
            {currency === 'coins' ? <Coins className="text-yellow-400 w-5 h-5" /> : <Gem className="text-blue-400 w-5 h-5" />}
            <span className={`${currency === 'coins' ? 'text-yellow-400' : 'text-blue-400'} font-bold`}>{balance}</span>
          </div>
       </div>

       <div className="flex gap-4 w-full max-w-md h-[600px]">
           {/* Sidebar Controls (Desktop) / Bottom (Mobile - styled via flex-col on container if needed, but keeping simple) */}
           
           <div className="hidden md:flex flex-col gap-4 w-64 bg-gray-800 p-4 rounded-xl border border-gray-700">
                {/* Controls Content */}
                {renderControls()}
           </div>

           {/* Game Board */}
           <div className="flex-1 flex flex-col bg-gray-800 rounded-xl border border-gray-700 p-4 relative">
                {/* Mobile Controls Toggle or Top Info */}
                <div className="flex justify-between items-center mb-4 md:hidden">
                    <span className="text-white font-bold">Minalar: {minesCount}</span>
                    <span className="text-green-400 font-bold">Yutuq: {Math.floor(profit)}</span>
                </div>

                <div className="grid grid-cols-5 gap-2 h-full content-center">
                    {Array(25).fill(0).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleTileClick(idx)}
                            disabled={!gameActive || revealed[idx]}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-3xl transition-all transform
                                ${!revealed[idx] 
                                    ? 'bg-gray-700 hover:bg-gray-600 shadow-[0_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none' 
                                    : grid[idx] === 1 
                                        ? 'bg-red-500/20 border-2 border-red-500' 
                                        : 'bg-green-500/20 border-2 border-green-500'
                                }
                                ${!gameActive && !revealed[idx] ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {revealed[idx] && (
                                grid[idx] === 1 ? <Bomb className="text-red-500 w-8 h-8 animate-pop" /> : <Diamond className="text-green-400 w-8 h-8 animate-pop" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                        {win ? (
                            <div className="text-center animate-pop">
                                <div className="text-5xl mb-2">💎</div>
                                <h2 className="text-3xl font-black text-green-400 uppercase">YUTDINGIZ!</h2>
                                <p className="text-white text-xl font-bold">+{Math.floor(profit)}</p>
                            </div>
                        ) : (
                            <div className="text-center animate-pop">
                                <Bomb className="w-16 h-16 text-red-500 mx-auto mb-2" />
                                <h2 className="text-3xl font-black text-red-500 uppercase">PORTLADI!</h2>
                            </div>
                        )}
                        <button 
                            onClick={() => setGameActive(false) || setGameOver(false)} // Reset UI slightly
                            className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform"
                        >
                            Qayta O'ynash
                        </button>
                    </div>
                )}
           </div>
       </div>

       {/* Mobile Controls (Visible only on small screens) */}
       <div className="md:hidden w-full max-w-md mt-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
            {renderControls()}
       </div>
    </div>
  );

  function renderControls() {
      return (
          <>
            <div className="flex p-1 bg-gray-900 rounded-lg mb-4">
                <button 
                    onClick={() => !gameActive && setCurrency('coins')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${currency === 'coins' ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}
                >Coins</button>
                <button 
                    onClick={() => !gameActive && setCurrency('diamonds')}
                    className={`flex-1 py-2 text-sm font-bold rounded ${currency === 'diamonds' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                >Diamonds</button>
            </div>

            <div className="mb-4">
                <label className="text-xs text-gray-400 uppercase font-bold">Tikish</label>
                <div className="flex gap-2 mt-1">
                    <input 
                        type="number" 
                        value={betAmount} 
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        disabled={gameActive}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white font-bold"
                    />
                    <button onClick={() => !gameActive && setBetAmount(Math.floor(balance/2))} className="bg-gray-700 px-3 rounded text-xs text-gray-300">1/2</button>
                    <button onClick={() => !gameActive && setBetAmount(balance)} className="bg-gray-700 px-3 rounded text-xs text-gray-300">MAX</button>
                </div>
            </div>

            <div className="mb-6">
                <label className="text-xs text-gray-400 uppercase font-bold flex justify-between">
                    <span>Minalar</span>
                    <span>{minesCount}</span>
                </label>
                <input 
                    type="range" 
                    min="1" max="24" 
                    value={minesCount} 
                    onChange={(e) => setMinesCount(Number(e.target.value))}
                    disabled={gameActive}
                    className="w-full mt-2 accent-neonBlue"
                />
            </div>

            {!gameActive ? (
                <button 
                    onClick={startGame}
                    disabled={betAmount > balance || betAmount <= 0}
                    className="w-full py-4 bg-neonBlue text-black font-black text-xl rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    BOSHLASH
                </button>
            ) : (
                <button 
                    onClick={() => cashOut()}
                    disabled={profit === 0} // Must reveal at least one tile
                    className="w-full py-4 bg-green-500 text-black font-black text-xl rounded-xl hover:bg-green-400 transition-colors disabled:bg-gray-600"
                >
                    OLISH ({Math.floor(profit > 0 ? profit : betAmount)})
                </button>
            )}
          </>
      )
  }
};

export default MinesGame;
