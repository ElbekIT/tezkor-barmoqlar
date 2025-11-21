import React, { useEffect, useState } from 'react';
import { generateGameCommentary } from '../services/geminiService';
import { db, auth } from '../firebaseConfig';
import { ref, push, runTransaction } from "firebase/database";
import { RefreshCw, Home, Coins } from 'lucide-react';

interface GameOverProps {
  score: number;
  playerName: string;
  onRestart: () => void;
  onHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, playerName, onRestart, onHome }) => {
  const [aiComment, setAiComment] = useState<string>('AI natijani tahlil qilmoqda...');
  const [saved, setSaved] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  useEffect(() => {
    const processResult = async () => {
      // Calculate coins: 1 coin for every 5 points. Hard to earn!
      const earned = Math.floor(score / 5);
      setCoinsEarned(earned);

      // 1. Get AI Comment
      const comment = await generateGameCommentary(score);
      setAiComment(comment);

      // 2. Save Score & Update Coins
      if (auth.currentUser) {
        try {
          // Save score to leaderboard
          const scoresRef = ref(db, 'scores');
          await push(scoresRef, {
            name: playerName,
            score: score,
            timestamp: Date.now(),
            aiComment: comment
          });

          // Update user coins balance
          if (earned > 0) {
            const userRef = ref(db, `users/${auth.currentUser.uid}/coins`);
            await runTransaction(userRef, (currentCoins) => {
              return (currentCoins || 0) + earned;
            });
          }

          setSaved(true);
        } catch (error) {
          console.error("Error saving score:", error);
        }
      }
    };

    processResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-center">
      <div className="bg-gray-800 p-8 rounded-2xl border-2 border-neonPurple shadow-[0_0_30px_rgba(188,19,254,0.2)] max-w-md w-full animate-pop">
        <h2 className="text-3xl font-bold text-white mb-2">O'YIN TUGADI!</h2>
        <p className="text-gray-400 mb-2">Sizning natijangiz:</p>
        
        <div className="text-8xl font-black text-neonBlue mb-4 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          {score}
        </div>

        {coinsEarned > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6 text-yellow-400 font-bold text-xl bg-yellow-400/10 p-2 rounded-lg">
            <Coins className="w-6 h-6" />
            +{coinsEarned} Tanga
          </div>
        )}

        <div className="bg-black/30 p-4 rounded-xl mb-8 min-h-[80px] flex items-center justify-center">
          <p className="text-neonPurple italic text-sm md:text-base animate-pulse-fast">
            {aiComment}
          </p>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <button 
            onClick={onRestart}
            className="flex-1 py-3 bg-neonBlue text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Yana o'ynash
          </button>
          <button 
            onClick={onHome}
            className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Menyuga
          </button>
        </div>
        
        {!saved && <p className="mt-4 text-xs text-gray-500">Natija saqlanmoqda...</p>}
        {saved && <p className="mt-4 text-xs text-green-500">Natija reytingga qo'shildi!</p>}
      </div>
    </div>
  );
};

export default GameOver;