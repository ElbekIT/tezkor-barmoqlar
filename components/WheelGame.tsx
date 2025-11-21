
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Coins, Gem, Disc, Send, Check } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue, update } from "firebase/database";

interface WheelGameProps {
  onBack: () => void;
}

const SPIN_COST = 50;
const TELEGRAM_BOT_TOKEN = "8301473621:AAEuYjt6cRAyFyTPjBsXvoXnE74U_2gQFLA";

interface Segment {
  label: string;
  value: number | string;
  color: string;
  textColor: string;
  probability: number; // 0-100
}

const SEGMENTS: Segment[] = [
  { label: '10', value: 10, color: '#fbbf24', textColor: 'black', probability: 20 },
  { label: '5', value: 5, color: '#ef4444', textColor: 'white', probability: 30 },
  { label: '45', value: 45, color: '#3b82f6', textColor: 'white', probability: 15 },
  { label: 'PROMO', value: 'PROMO', color: '#22c55e', textColor: 'white', probability: 3 },
  { label: '60', value: 60, color: '#a855f7', textColor: 'white', probability: 10 },
  { label: '100', value: 100, color: '#f97316', textColor: 'white', probability: 5 },
  { label: '10K GEM', value: 'JACKPOT', color: '#06b6d4', textColor: 'white', probability: 0.1 },
  { label: '0', value: 0, color: '#374151', textColor: 'white', probability: 16.9 },
];

const WheelGame: React.FC<WheelGameProps> = ({ onBack }) => {
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [telegramId, setTelegramId] = useState("");
  const [savedTelegramId, setSavedTelegramId] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [message, setMessage] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [generatedPromo, setGeneratedPromo] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setCoins(data?.coins || 0);
        setDiamonds(data?.diamonds || 0);
        setSavedTelegramId(data?.telegramId || "");
        if(data?.telegramId) setTelegramId(data.telegramId);
      });
    }
  }, []);

  const saveTelegramId = async () => {
    if (!telegramId.trim() || !auth.currentUser) return;
    await update(ref(db, `users/${auth.currentUser.uid}`), {
      telegramId: telegramId.trim()
    });
    setSavedTelegramId(telegramId.trim());
    setMessage("Telegram ID saqlandi!");
  };

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const sendPromoToTelegram = async (code: string) => {
    try {
      const text = `🎉 Tabriklaymiz! Omad Doirasida yutdingiz.\n🔑 Sizning PROMO kodingiz: ${code}\n\nUshbu kodni saytga kiriting va 5000 Olmos oling!`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: savedTelegramId,
          text: text
        })
      });
      return true;
    } catch (error) {
      console.error("Telegram error:", error);
      return false;
    }
  };

  const spinWheel = async () => {
    if (coins < SPIN_COST) {
      setMessage("Aylantirish uchun 50 tanga kerak!");
      return;
    }
    if (!savedTelegramId) {
      setMessage("Oldin Telegram ID ni kiriting!");
      return;
    }

    setIsSpinning(true);
    setMessage("");
    setGeneratedPromo(null);

    // Deduct cost
    if (auth.currentUser) {
      const coinsRef = ref(db, `users/${auth.currentUser.uid}/coins`);
      await runTransaction(coinsRef, (c) => (c || 0) - SPIN_COST);
    }

    // Determine result based on weights
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < SEGMENTS.length; i++) {
      cumulative += SEGMENTS[i].probability;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    // Calculate rotation
    // Each segment is 360 / 8 = 45 degrees.
    // To land on index i, we need final rotation to align that segment to top.
    // Top is 0 degrees.
    const segmentAngle = 360 / SEGMENTS.length;
    // Add random spins (5 to 10 full spins)
    const spins = 360 * (5 + Math.floor(Math.random() * 5));
    // Target adjustment: 
    // If index 0 is at top, rotation is 0. Index 1 is at 45 deg.
    // To make index 1 be at top (pointer), we rotate -45deg (or 360-45).
    // However, CSS rotates clockwise. Pointer is at top.
    // If we rotate wheel X deg, the segment at -X comes to top.
    const targetRotation = spins + (360 - (selectedIndex * segmentAngle)) - (segmentAngle/2) + (Math.random() * segmentAngle * 0.8); 
    
    setRotation(targetRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      handleWin(SEGMENTS[selectedIndex]);
    }, 5000); // 5s animation
  };

  const handleWin = async (segment: Segment) => {
    if (!auth.currentUser) return;
    const userRef = ref(db, `users/${auth.currentUser.uid}`);

    if (segment.value === 'PROMO') {
      const code = generatePromoCode();
      setGeneratedPromo(code);
      setMessage("Telegram botga promo kod yuborilmoqda...");
      const sent = await sendPromoToTelegram(code);
      if(sent) setMessage("Telegramingizga kod yuborildi! Uni pastga yozing.");
      else setMessage("Xatolik: Botga yozib bo'lmadi. ID to'g'rimi?");
    } else if (segment.value === 'JACKPOT') {
       // 10K Gems
       await runTransaction(userRef, (data) => {
         if(data) data.diamonds = (data.diamonds || 0) + 10000;
         return data;
       });
       setMessage("DAHSHAT! SIZ 10,000 OLMOS YUTDINGIZ!");
    } else {
      const val = Number(segment.value);
      if (val > 0) {
        await runTransaction(userRef, (data) => {
          if(data) data.coins = (data.coins || 0) + val;
          return data;
        });
        setMessage(`Yutuq: ${val} Tanga!`);
      } else {
        setMessage("Afsuski, yutuq yo'q.");
      }
    }
  };

  const redeemPromo = async () => {
    if (promoCodeInput !== generatedPromo) {
      setMessage("Kod noto'g'ri!");
      return;
    }
    if (!auth.currentUser) return;

    const userRef = ref(db, `users/${auth.currentUser.uid}/diamonds`);
    await runTransaction(userRef, (d) => (d || 0) + 5000);
    setGeneratedPromo(null);
    setPromoCodeInput("");
    setMessage("Tabriklaymiz! 5,000 Olmos qo'shildi!");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            <ArrowLeft />
          </button>
          <div className="flex gap-2">
             <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-yellow-500/30">
                <Coins className="text-yellow-400 w-4 h-4" />
                <span className="text-yellow-400 font-bold text-sm">{coins}</span>
             </div>
             <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-blue-500/30">
                <Gem className="text-blue-400 w-4 h-4" />
                <span className="text-blue-400 font-bold text-sm">{diamonds}</span>
             </div>
          </div>
      </div>

      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 uppercase">
        OMAD DOIRASI
      </h2>
      <p className="text-gray-400 text-xs mb-6">Har bir aylantirish: 50 Tanga</p>

      {/* Wheel Container */}
      <div className="relative mb-8 group">
         {/* Pointer */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg"></div>
         
         <div className="w-72 h-72 md:w-80 md:h-80 rounded-full bg-gray-800 border-8 border-gray-700 shadow-[0_0_40px_rgba(168,85,247,0.3)] relative overflow-hidden">
            <div 
              ref={wheelRef}
              className="w-full h-full transition-transform cubic-bezier(0.2, 0.8, 0.2, 1)"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: isSpinning ? '5s' : '0s' 
              }}
            >
               {/* CSS Conic Gradient for Segments */}
               <div className="w-full h-full rounded-full relative"
                    style={{
                      background: `conic-gradient(
                        ${SEGMENTS.map((s, i) => `${s.color} ${i * (360/SEGMENTS.length)}deg ${(i+1) * (360/SEGMENTS.length)}deg`).join(', ')}
                      )`
                    }}
               >
                  {/* Labels */}
                  {SEGMENTS.map((s, i) => (
                    <div key={i} 
                         className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-4"
                         style={{ transform: `rotate(${i * (360/SEGMENTS.length) + (360/SEGMENTS.length)/2}deg)` }}
                    >
                        <span 
                          className="font-bold text-sm md:text-base"
                          style={{ color: s.textColor, transform: 'rotate(180deg)', writingMode: 'vertical-rl' }}
                        >
                          {s.label}
                        </span>
                    </div>
                  ))}
               </div>
            </div>
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900 rounded-full border-4 border-gray-600 flex items-center justify-center z-10">
              <Disc className="text-purple-500" />
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-4 px-4 pb-8">
        
        {!savedTelegramId ? (
          <div className="bg-gray-800 p-4 rounded-xl border border-blue-500/30">
             <p className="text-white text-sm mb-2 text-center">Botimizga Start bosing va Telegram ID kiriting:</p>
             <a href="https://t.me/pubg_cheat_uzro_bot" target="_blank" className="text-blue-400 text-xs block text-center mb-2 underline">Botga o'tish</a>
             <div className="flex gap-2">
                <input 
                   type="text" 
                   placeholder="Masalan: 123456789"
                   value={telegramId}
                   onChange={(e) => setTelegramId(e.target.value)}
                   className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 text-white"
                />
                <button onClick={saveTelegramId} className="bg-blue-600 p-2 rounded-lg text-white"><Check size={20} /></button>
             </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xs mb-2">
            Telegram ID: {savedTelegramId}
          </div>
        )}

        <button
           onClick={spinWheel}
           disabled={isSpinning || !savedTelegramId || coins < SPIN_COST}
           className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all transform active:scale-95
             ${isSpinning || coins < SPIN_COST 
               ? 'bg-gray-700 text-gray-500' 
               : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'}
           `}
        >
           {isSpinning ? 'AYLANMOQDA...' : 'AYLANTIRISH (50 T)'}
        </button>

        {message && <p className="text-center text-yellow-400 font-bold animate-pulse">{message}</p>}

        {generatedPromo && (
           <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-xl animate-pop">
              <p className="text-green-400 text-sm text-center mb-2">Botga kod yuborildi! Uni kiriting:</p>
              <div className="flex gap-2">
                <input 
                   type="text" 
                   placeholder="Promo kod..."
                   value={promoCodeInput}
                   onChange={(e) => setPromoCodeInput(e.target.value)}
                   className="flex-1 bg-gray-900 border border-green-600 rounded-lg px-3 text-white font-mono text-center"
                />
                <button onClick={redeemPromo} className="bg-green-600 px-4 rounded-lg text-white font-bold">OK</button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default WheelGame;
