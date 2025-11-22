
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, update, runTransaction } from "firebase/database";
import Game from './Game';
import { Coins, Gem, ShieldCheck, Swords } from 'lucide-react';

interface BattleArenaProps {
  battleId: string;
  onLeave: () => void;
}

const BattleArena: React.FC<BattleArenaProps> = ({ battleId, onLeave }) => {
  const [battleData, setBattleData] = useState<any>(null);
  const [myBalance, setMyBalance] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [amIPlayer1, setAmIPlayer1] = useState(false);

  useEffect(() => {
    const battleRef = ref(db, `battles/${battleId}`);
    const unsub = onValue(battleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBattleData(data);
        setAmIPlayer1(data.player1.uid === auth.currentUser?.uid);

        // Sync logic
        if (data.status === 'countdown' && countdown === null) {
             startLocalCountdown();
        }
      } else {
        // Battle deleted (opponent left?)
        onLeave();
      }
    });
    return () => unsub();
  }, [battleId, countdown, onLeave]);

  useEffect(() => {
      if(auth.currentUser && battleData) {
          const currency = battleData.bet.currency;
          const userRef = ref(db, `users/${auth.currentUser.uid}/${currency}`);
          onValue(userRef, (snap) => setMyBalance(snap.val() || 0));
      }
  }, [battleData]);

  const startLocalCountdown = () => {
      let count = 10;
      setCountdown(count);
      const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
              clearInterval(timer);
              // Only Player 1 triggers the status update to avoid race conditions
              if (amIPlayer1) {
                  update(ref(db, `battles/${battleId}`), { status: 'playing' });
              }
          }
      }, 1000);
  };

  const handleSetBet = async (amount: number, currency: 'coins' | 'diamonds') => {
      await update(ref(db, `battles/${battleId}/bet`), { amount, currency });
      // Reset ready status if bet changes
      await update(ref(db, `battles/${battleId}/player1`), { ready: false });
      await update(ref(db, `battles/${battleId}/player2`), { ready: false });
  };

  const handleReady = async () => {
      if (myBalance < battleData.bet.amount) {
          alert("Mablag' yetarli emas!");
          return;
      }

      const playerKey = amIPlayer1 ? 'player1' : 'player2';
      
      // Deduct money instantly
      const myUid = auth.currentUser?.uid;
      if(myUid) {
          const balanceRef = ref(db, `users/${myUid}/${battleData.bet.currency}`);
          await runTransaction(balanceRef, (curr) => (curr || 0) - battleData.bet.amount);
      }

      await update(ref(db, `battles/${battleId}/${playerKey}`), { ready: true });

      // Check if both ready
      // We need to read fresh data, but simpler to let the listener handle it.
      // However, inside this function we don't have fresh data immediately.
      // Trigger a cloud function or client side check? 
      // Simple client side check: if opponent is ALREADY ready in current state, then start.
      const opponentKey = amIPlayer1 ? 'player2' : 'player1';
      if (battleData[opponentKey].ready) {
          update(ref(db, `battles/${battleId}`), { status: 'countdown' });
      }
  };

  const handleGameOver = async (score: number) => {
      const playerKey = amIPlayer1 ? 'player1' : 'player2';
      await update(ref(db, `battles/${battleId}/${playerKey}`), { score: score });
      
      // Check winner
      // Wait for opponent score. Listener will update UI.
      // If both scores > 0 (or just present? score can be 0).
      // We need a 'finished' flag or check if both scores are submitted.
      // Actually, let's just wait for both to set score.
      
      // Simple check: if opponent score is present in DB (we can't know for sure if 0 is "no score" or "0 score").
      // Let's assume score is -1 initially? No, default 0.
      // Let's add a 'finished' field to player object.
      await update(ref(db, `battles/${battleId}/${playerKey}`), { finished: true });
      
      // If both finished, determine winner
      const opponentKey = amIPlayer1 ? 'player2' : 'player1';
      if (battleData[opponentKey].finished) {
          // I am the second one to finish. Calculate winner.
          const myScore = score;
          const oppScore = battleData[opponentKey].score;
          let winnerId = "";
          
          if (myScore > oppScore) winnerId = auth.currentUser?.uid || "";
          else if (oppScore > myScore) winnerId = battleData[opponentKey].uid;
          else winnerId = "draw";

          await update(ref(db, `battles/${battleId}`), { status: 'finished', winner: winnerId });

          // Distribute POT
          const pot = battleData.bet.amount * 2;
          if (winnerId !== "draw") {
              const winnerRef = ref(db, `users/${winnerId}/${battleData.bet.currency}`);
              await runTransaction(winnerRef, (val) => (val || 0) + pot);
          } else {
              // Refund
              const p1Ref = ref(db, `users/${battleData.player1.uid}/${battleData.bet.currency}`);
              const p2Ref = ref(db, `users/${battleData.player2.uid}/${battleData.bet.currency}`);
              await runTransaction(p1Ref, (val) => (val || 0) + battleData.bet.amount);
              await runTransaction(p2Ref, (val) => (val || 0) + battleData.bet.amount);
          }
      }
  };

  if (!battleData) return <div className="text-white text-center mt-20">Yuklanmoqda...</div>;

  // --- RENDER ---

  // 1. BETTING PHASE
  if (battleData.status === 'betting' || battleData.status === 'accepted') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
              <h2 className="text-2xl text-white font-bold mb-8 mt-4">JANG SOZLAMALARI</h2>
              
              <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl border border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                      <div className="text-center">
                          <p className="text-neonBlue font-bold text-lg">{battleData.player1.name}</p>
                          <p className={`text-xs ${battleData.player1.ready ? 'text-green-500' : 'text-gray-500'}`}>
                              {battleData.player1.ready ? 'TAYYOR' : 'Kutilmoqda...'}
                          </p>
                      </div>
                      <div className="text-red-500 font-black text-2xl">VS</div>
                      <div className="text-center">
                          <p className="text-neonPurple font-bold text-lg">{battleData.player2.name}</p>
                          <p className={`text-xs ${battleData.player2.ready ? 'text-green-500' : 'text-gray-500'}`}>
                              {battleData.player2.ready ? 'TAYYOR' : 'Kutilmoqda...'}
                          </p>
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className="text-gray-400 text-sm mb-2 block">Tikish summasi (Ikkala tomon uchun):</label>
                      <div className="flex gap-2 mb-4">
                          <button disabled={!amIPlayer1 || battleData.player1.ready} onClick={() => handleSetBet(20, 'coins')} className={`flex-1 py-2 rounded border ${battleData.bet.currency === 'coins' && battleData.bet.amount === 20 ? 'bg-yellow-500 text-black' : 'bg-transparent text-gray-400'}`}>20 C</button>
                          <button disabled={!amIPlayer1 || battleData.player1.ready} onClick={() => handleSetBet(50, 'coins')} className={`flex-1 py-2 rounded border ${battleData.bet.currency === 'coins' && battleData.bet.amount === 50 ? 'bg-yellow-500 text-black' : 'bg-transparent text-gray-400'}`}>50 C</button>
                          <button disabled={!amIPlayer1 || battleData.player1.ready} onClick={() => handleSetBet(100, 'diamonds')} className={`flex-1 py-2 rounded border ${battleData.bet.currency === 'diamonds' && battleData.bet.amount === 100 ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-400'}`}>100 D</button>
                      </div>
                      <div className="text-center text-white text-xl font-bold flex justify-center items-center gap-2">
                          Jami Pot: {battleData.bet.amount * 2} 
                          {battleData.bet.currency === 'coins' ? <Coins className="text-yellow-400" /> : <Gem className="text-blue-400" />}
                      </div>
                      {!amIPlayer1 && (
                          <p className="text-center text-xs text-gray-500 mt-2">Faqat {battleData.player1.name} summani o'zgartira oladi.</p>
                      )}
                  </div>

                  <button 
                    onClick={handleReady}
                    disabled={(amIPlayer1 ? battleData.player1.ready : battleData.player2.ready)}
                    className="w-full bg-green-600 py-4 rounded-xl text-white font-black text-lg hover:bg-green-500 disabled:opacity-50 transition-all"
                  >
                      {(amIPlayer1 ? battleData.player1.ready : battleData.player2.ready) ? 'RAQIB KUTILMOQDA...' : `TAYYOR & TO'LASH (${battleData.bet.amount})`}
                  </button>
              </div>
          </div>
      );
  }

  // 2. COUNTDOWN
  if (battleData.status === 'countdown') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
              <h1 className="text-[10rem] font-black text-neonBlue animate-pulse">{countdown}</h1>
              <p className="text-white text-xl">O'yin boshlanmoqda...</p>
          </div>
      );
  }

  // 3. PLAYING
  if (battleData.status === 'playing') {
      return (
          <Game 
            playerName={auth.currentUser?.displayName || 'Player'} 
            onGameOver={handleGameOver} 
            onCancel={() => {/* Cannot cancel in battle easily without forfeit logic */}}
          />
      );
  }

  // 4. FINISHED
  if (battleData.status === 'finished') {
      const isWinner = battleData.winner === auth.currentUser?.uid;
      const isDraw = battleData.winner === 'draw';

      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
              <div className="bg-gray-800 p-8 rounded-3xl border-2 border-gray-700 shadow-2xl max-w-md w-full animate-pop">
                  {isWinner ? (
                      <>
                        <Swords className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-yellow-400 mb-2">G'ALABA!</h2>
                        <p className="text-white mb-6">Siz raqibni yengdingiz!</p>
                        <div className="bg-yellow-500/20 p-4 rounded-xl mb-6 border border-yellow-500">
                            <p className="text-yellow-200 text-sm">YUTUQ:</p>
                            <p className="text-3xl font-bold text-yellow-400 flex justify-center items-center gap-2">
                                +{battleData.bet.amount * 2} {battleData.bet.currency === 'coins' ? <Coins /> : <Gem />}
                            </p>
                        </div>
                      </>
                  ) : isDraw ? (
                      <>
                        <h2 className="text-3xl font-bold text-gray-400 mb-4">DURRANG</h2>
                        <p className="text-white">Pular qaytarildi.</p>
                      </>
                  ) : (
                      <>
                        <h2 className="text-4xl font-black text-red-500 mb-4">MAG'LUBIYAT</h2>
                        <p className="text-white mb-6">Keyingi safar omad kulib boqadi.</p>
                      </>
                  )}

                  <div className="flex justify-between text-sm text-gray-400 mb-8">
                      <div>
                          <p>{battleData.player1.name}</p>
                          <p className="text-white font-bold text-xl">{battleData.player1.score}</p>
                      </div>
                      <div>
                          <p>{battleData.player2.name}</p>
                          <p className="text-white font-bold text-xl">{battleData.player2.score}</p>
                      </div>
                  </div>

                  <button onClick={onLeave} className="w-full bg-gray-700 py-3 rounded-xl text-white font-bold hover:bg-gray-600">
                      CHIQISH
                  </button>
              </div>
          </div>
      );
  }

  return null;
};

export default BattleArena;
