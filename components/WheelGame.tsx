
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Coins, Gem, Disc, Gift, Frown, Check } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue, update } from "firebase/database";

interface WheelGameProps {
  onBack: () => void;
}

const SPIN_COST = 50;
const TELEGRAM_BOT_TOKEN = "8301473621:AAEuYjt6cRAyFyTPjBsXvoXnE74U_2gQFLA";

type PrizeType = 'COINS' | 'DIAMONDS' | 'PROMO' | 'NOTHING';

interface Segment {
  id: number;
  label: string;
  value: number | string;
  type: PrizeType;
  color: string;
  probability: number; // 0-100
}

const SEGMENTS: Segment[] = [
  { id: 0, label: '10', value: 10, type: 'COINS', color: '#fbbf24', probability: 20 },
  { id: 1, label: '5', value: 5, type: 'COINS', color: '#ef4444', probability: 30 },
  { id: 2, label: '45', value: 45, type: 'COINS', color: '#3b82f6', probability: 15 },
  { id: 3, label: 'PROMO', value: 'PROMO', type: 'PROMO', color: '#22c55e', probability: 3 },
  { id: 4, label: '60', value: 60, type: 'COINS', color: '#a855f7', probability: 10 },
  { id: 5, label: '100', value: 100, type: 'COINS', color: '#f97316', probability: 5 },
  { id: 6, label: '10K', value: 10000, type: 'DIAMONDS', color: '#06b6d4', probability: 0.1 },
  { id: 7, label: '0', value: 0, type: 'NOTHING', color: '#374151', probability: 16.9 },
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

    const segmentCount = SEGMENTS.length;
    const segmentAngle = 360 / segmentCount;
    
    // Spins logic:
    // We want to land on selectedIndex. 
    // Index 0 is at top (0 deg) initially.
    // If we want index 1 (at 45 deg right) to be at top, we rotate -45 deg (counter-clockwise) or 315 deg.
    // Formula: Target Rotation = 360 - (index * segmentAngle).
    // Add random full spins (5-10).
    // Add randomness within the segment (-halfSegment to +halfSegment) to avoid landing on lines.
    
    const baseRotation = 360 - (selectedIndex * segmentAngle);
    const randomSpins = 360 * (8 + Math.floor(Math.random() * 4)); // 8-12 spins
    const randomOffset = (Math.random() * segmentAngle * 0.8) - (segmentAngle * 0.4); // +/- 40% of segment width

    const totalRotation = randomSpins + baseRotation + randomOffset;
    
    setRotation(totalRotation);

    setTimeout(async () => {
      setIsSpinning(false);
      handleWin(SEGMENTS[selectedIndex]);
    }, 5000);
  };

  const handleWin = async (segment: Segment) => {
    if (!auth.currentUser) return;
    const userRef = ref(db, `users/${auth.currentUser.uid}`);

    if (segment.type === 'PROMO') {
      const code = generatePromoCode();
      setGeneratedPromo(code);
      setMessage("Telegram botga promo kod yuborilmoqda...");
      const sent = await sendPromoToTelegram(code);
      if(sent) setMessage("Telegramingizga kod yuborildi! Uni pastga yozing.");
      else setMessage("Xatolik: Botga yozib bo'lmadi. ID to'g'rimi?");
    } else if (segment.type === 'DIAMONDS') {
       const amount = Number(segment.value);
       await runTransaction(userRef, (data) => {
         if(data) data.diamonds = (data.diamonds || 0) + amount;
         return data;
       });
       setMessage(`DAHSHAT! SIZ ${amount} OLMOS YUTDINGIZ!`);
    } else if (segment.type === 'COINS') {
      const amount = Number(segment.value);
      await runTransaction(userRef, (data) => {
        if(data) data.coins = (data.coins || 0) + amount;
        return data;
      });
      setMessage(`Yutuq: ${amount} Tanga!`);
    } else {
      setMessage("Afsuski, yutuq yo'q.");
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

  // Render Segment Icon
  const renderIcon = (segment: Segment) => {
    switch(segment.type) {
        case 'COINS': return <div className="flex flex-col items-center"><Coins className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" /><span className="text-white font-black text-lg drop-shadow-md">{segment.value}</span></div>;
        case 'DIAMONDS': return <div className="flex flex-col items-center"><Gem className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" /><span className="text-white font-black text-xs drop-shadow-md">{segment.label}</span></div>;
        case 'PROMO': return <div className="flex flex-col items-center"><Gift className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" /><span className="text-white font-black text-xs drop-shadow-md">PROMO</span></div>;
        default: return <div className="flex flex-col items-center"><Frown className="w-6 h-6 md:w-8 md:h-8 text-white/50" /></div>;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700">
            <ArrowLeft />
          </button>
          <div className="flex gap-2">
             <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-yellow-500/30 shadow-lg">
                <Coins className="text-yellow-400 w-4 h-4" />
                <span className="text-yellow-400 font-bold text-sm">{coins}</span>
             </div>
             <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-blue-500/30 shadow-lg">
                <Gem className="text-blue-400 w-4 h-4" />
                <span className="text-blue-400 font-bold text-sm">{diamonds}</span>
             </div>
          </div>
      </div>

      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 uppercase text-center drop-shadow-lg">
        OMAD DOIRASI
      </h2>
      <p className="text-gray-400 text-xs mb-6 font-mono">1 AYLANTIRISH = {SPIN_COST} TANGA</p>

      {/* Wheel Container */}
      <div className="relative mb-8 group scale-90 md:scale-100">
         {/* Pointer */}
         <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 drop-shadow-2xl">
            <div className="w-8 h-12 bg-gradient-to-b from-red-600 to-red-800 rounded-b-full border-2 border-white/50 shadow-lg"></div>
         </div>
         
         <div className="w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full bg-gray-800 border-[12px] border-gray-700 shadow-[0_0_50px_rgba(168,85,247,0.4)] relative overflow-hidden">
            <div 
              ref={wheelRef}
              className="w-full h-full transition-transform cubic-bezier(0.15, 0.85, 0.35, 1)"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: isSpinning ? '5s' : '0s' 
              }}
            >
               {/* Segments Background */}
               <div className="w-full h-full rounded-full relative overflow-hidden"
                    style={{
                      background: `conic-gradient(
                        ${SEGMENTS.map((s, i) => `${s.color} ${i * (360/SEGMENTS.length)}deg ${(i+1) * (360/SEGMENTS.length)}deg`).join(', ')}
                      )`
                    }}
               >
                  {/* Content Container for each segment */}
                  {SEGMENTS.map((s, i) => {
                      const anglePerSegment = 360 / SEGMENTS.length; // 45 deg
                      const centerAngle = (i * anglePerSegment) + (anglePerSegment / 2);
                      
                      return (
                        <div key={s.id} 
                             className="absolute top-0 left-0 w-full h-full pointer-events-none"
                             style={{ 
                                transform: `rotate(${centerAngle}deg)`
                             }}
                        >
                            {/* Icon positioning: Move up to radius, maintain rotation 0 relative to segment center */}
                           <div className="absolute top-[15%] left-1/2 -translate-x-1/2 transform" >
                               {renderIcon(s)}
                           </div>
                        </div>
                      );
                  })}
               </div>
            </div>
            
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-full border-4 border-gray-600 flex items-center justify-center z-10 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
              <Disc className="text-purple-500 w-8 h-8 animate-spin-slow" />
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md space-y-4 px-4 pb-8">
        
        {!savedTelegramId ? (
          <div className="bg-gray-800 p-4 rounded-xl border border-blue-500/30 animate-pop">
             <p className="text-white text-sm mb-2 text-center font-bold">ID ulanmagan!</p>
             <p className="text-gray-400 text-xs text-center mb-3">Sovg'ani olish uchun Telegram ID kiritilishi shart.</p>
             <a href="https://t.me/pubg_cheat_uzro_bot" target="_blank" className="block w-full py-2 bg-blue-600/20 text-blue-400 text-xs text-center rounded-lg mb-3 hover:bg-blue-600/30 transition-colors">1. Botga START bosing</a>
             <div className="flex gap-2">
                <input 
                   type="text" 
                   placeholder="2. ID raqamingizni yozing"
                   value={telegramId}
                   onChange={(e) => setTelegramId(e.target.value)}
                   className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                />
                <button onClick={saveTelegramId} className="bg-blue-600 px-3 rounded-lg text-white hover:bg-blue-500 transition-colors"><Check size={20} /></button>
             </div>
          </div>
        ) : (
          <div className="text-center bg-gray-800/50 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-500 text-xs uppercase font-bold">Ulagan ID:</span> 
            <span className="text-blue-400 text-sm font-mono ml-2">{savedTelegramId}</span>
          </div>
        )}

        <button
           onClick={spinWheel}
           disabled={isSpinning || !savedTelegramId || coins < SPIN_COST}
           className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all transform active:scale-95 relative overflow-hidden group
             ${isSpinning || coins < SPIN_COST 
               ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
               : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-b-4 border-purple-900 hover:border-purple-700 active:border-0 active:translate-y-1'}
           `}
        >
           {isSpinning ? '...' : (
             <span className="flex items-center justify-center gap-2">
                AYLANTIRISH <span className="bg-black/20 px-2 rounded text-sm">{SPIN_COST} <Coins className="w-3 h-3 inline" /></span>
             </span>
           )}
        </button>

        {message && (
            <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl border border-yellow-500/30">
                <p className="text-center text-yellow-400 font-bold animate-pulse">{message}</p>
            </div>
        )}

        {generatedPromo && (
           <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-xl animate-pop shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <p className="text-green-400 text-sm text-center mb-2 font-bold">Botga PROMO kod yuborildi!</p>
              <p className="text-gray-400 text-xs text-center mb-3">Telegramdan kodni olib, shu yerga yozing:</p>
              <div className="flex gap-2">
                <input 
                   type="text" 
                   placeholder="X1y2Z3..."
                   value={promoCodeInput}
                   onChange={(e) => setPromoCodeInput(e.target.value)}
                   className="flex-1 bg-gray-900 border border-green-600 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button onClick={redeemPromo} className="bg-green-600 px-4 rounded-lg text-white font-bold hover:bg-green-500 transition-colors">OK</button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default WheelGame;
