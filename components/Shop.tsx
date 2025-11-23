
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Lock, Unlock, Gem, RefreshCw, Coins } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue } from "firebase/database";

interface ShopProps {
  onBack: () => void;
}

const CHANNEL_PRICE = 10000;
const CHANNEL_URL = "https://t.me/pubg_cheat_uzro";

const EXCHANGE_PACKAGES = [
    { cost: 50, reward: 5 },
    { cost: 100, reward: 10 },
    { cost: 500, reward: 50 },
    { cost: 1000, reward: 100 },
    { cost: 2500, reward: 250 },
    { cost: 6000, reward: 600 },
];

const Shop: React.FC<ShopProps> = ({ onBack }) => {
  const [diamonds, setDiamonds] = useState(0);
  const [coins, setCoins] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'vip' | 'exchange'>('exchange');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      const unsubscribe = onValue(userRef, (snap) => {
        const data = snap.val();
        setDiamonds(data?.diamonds || 0);
        setCoins(data?.coins || 0);
        setIsUnlocked(data?.unlockedChannel === true);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleBuyChannel = async () => {
    if (!auth.currentUser) return;
    
    if (diamonds < CHANNEL_PRICE) {
      setMessage("Hisobingizda yetarli Olmos yo'q!");
      return;
    }

    try {
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      await runTransaction(userRef, (userData) => {
        if (userData) {
          const currentDiamonds = userData.diamonds || 0;
          if (currentDiamonds >= CHANNEL_PRICE) {
            userData.diamonds = currentDiamonds - CHANNEL_PRICE;
            userData.unlockedChannel = true;
          }
        }
        return userData;
      });
      setMessage("VIP kanal sotib olindi!");
    } catch (error) {
      console.error("Xaridda xatolik:", error);
      setMessage("Xatolik yuz berdi.");
    }
  };

  const handleExchange = async (cost: number, reward: number) => {
    if (!auth.currentUser) return;
    if (coins < cost) {
       setMessage(`Tangalar yetarli emas! Sizda ${coins} bor.`);
       return;
    }

    try {
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        await runTransaction(userRef, (userData) => {
            if(userData) {
                if ((userData.coins || 0) >= cost) {
                    userData.coins = (userData.coins || 0) - cost;
                    userData.diamonds = (userData.diamonds || 0) + reward;
                }
            }
            return userData;
        });
        setMessage(`Muvaffaqiyatli! +${reward} Olmos.`);
    } catch(e) {
        console.error(e);
        setMessage("Ayirboshlashda xatolik.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-6 flex justify-between items-center">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700">
            <ArrowLeft />
          </button>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-yellow-500/30">
               <Coins className="text-yellow-400 w-4 h-4" />
               <span className="text-white font-bold text-sm">{coins}</span>
             </div>
             <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-blue-500/30">
               <Gem className="text-blue-400 w-4 h-4" />
               <span className="text-white font-bold text-sm">{diamonds}</span>
             </div>
          </div>
      </div>

      <div className="w-full max-w-md flex mb-6 bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveTab('exchange'); setMessage(''); }}
            className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === 'exchange' ? 'bg-gray-700 text-white shadow' : 'text-gray-400'}`}
          >
             Valyuta
          </button>
          <button 
            onClick={() => { setActiveTab('vip'); setMessage(''); }}
            className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === 'vip' ? 'bg-blue-600 text-white shadow' : 'text-gray-400'}`}
          >
             VIP Do'kon
          </button>
      </div>

      {message && (
          <div className="mb-4 px-4 py-2 bg-gray-800 border border-green-500/50 rounded-lg animate-pulse">
              <p className="text-green-400 text-sm font-bold text-center">{message}</p>
          </div>
      )}

      {/* CONTENT */}
      <div className="w-full max-w-md">
         
         {/* EXCHANGE TAB */}
         {activeTab === 'exchange' && (
             <div className="grid grid-cols-2 gap-3 animate-pop">
                 {EXCHANGE_PACKAGES.map((pkg, idx) => (
                     <button 
                        key={idx}
                        onClick={() => handleExchange(pkg.cost, pkg.reward)}
                        className="bg-gray-800 border border-gray-700 p-4 rounded-2xl hover:bg-gray-700 hover:border-blue-500 transition-all group relative overflow-hidden active:scale-95"
                     >
                         <div className="absolute top-0 right-0 bg-blue-600/20 p-2 rounded-bl-xl">
                             <RefreshCw size={12} className="text-blue-400" />
                         </div>
                         
                         <div className="flex justify-center items-center mb-2">
                             <Gem className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform" />
                         </div>
                         <div className="text-2xl font-black text-white text-center mb-1">
                             +{pkg.reward}
                         </div>
                         <div className="text-blue-300 text-xs text-center font-bold uppercase tracking-wider mb-3">Olmos</div>
                         
                         <div className="bg-gray-900/50 rounded-lg py-1 px-2 flex items-center justify-center gap-2 text-yellow-400 font-bold border border-gray-700 group-hover:border-yellow-500/50">
                             <span className="text-sm">{pkg.cost}</span>
                             <Coins size={14} />
                         </div>
                     </button>
                 ))}
             </div>
         )}

         {/* VIP SHOP TAB */}
         {activeTab === 'vip' && (
             <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-blue-600/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.1)] text-center animate-pop">
                <ShoppingCart className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-2 uppercase">VIP Kanal</h2>
                <p className="text-gray-400 mb-8 text-sm">PUBG Cheat kodlari va maxfiy strategiyalar joylashgan yopiq kanalga kirish.</p>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden group hover:border-blue-500 transition-colors">
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                    HOT
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Kanalga Kirish</h3>
                
                <div className="flex justify-center items-center gap-2 mb-6">
                    <span className="text-3xl font-bold text-blue-400">{CHANNEL_PRICE}</span>
                    <Gem className="text-blue-400 w-6 h-6" />
                </div>

                {loading ? (
                    <div className="text-gray-500">Yuklanmoqda...</div>
                ) : isUnlocked ? (
                    <a 
                    href={CHANNEL_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-green-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                    >
                    <Unlock className="w-5 h-5" /> KANALGA O'TISH
                    </a>
                ) : (
                    <button
                    onClick={handleBuyChannel}
                    className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all
                        ${diamonds >= CHANNEL_PRICE 
                        ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                    <Lock className="w-5 h-5" />
                    {diamonds >= CHANNEL_PRICE ? 'SOTIB OLISH' : 'OLMOS YETARLI EMAS'}
                    </button>
                )}
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default Shop;
