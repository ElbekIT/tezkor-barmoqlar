
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Lock, Unlock, Gem, ExternalLink } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue } from "firebase/database";

interface ShopProps {
  onBack: () => void;
}

const CHANNEL_PRICE = 10000;
const CHANNEL_URL = "https://t.me/pubg_cheat_uzro";

const Shop: React.FC<ShopProps> = ({ onBack }) => {
  const [diamonds, setDiamonds] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (auth.currentUser) {
      // Balansni tinglash
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      
      const unsubscribe = onValue(userRef, (snap) => {
        const data = snap.val();
        setDiamonds(data?.diamonds || 0);
        setIsUnlocked(data?.unlockedChannel === true);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleBuy = async () => {
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
      setMessage("Muvaffaqiyatli sotib olindi!");
    } catch (error) {
      console.error("Xaridda xatolik:", error);
      setMessage("Xatolik yuz berdi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-8 flex justify-between items-center">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            <ArrowLeft />
          </button>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-blue-500/30">
            <Gem className="text-blue-400 w-5 h-5" />
            <span className="text-blue-400 font-bold">{diamonds}</span>
          </div>
      </div>

      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-blue-600/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.1)] text-center">
        <ShoppingCart className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-white mb-2 uppercase">VIP Do'kon</h2>
        <p className="text-gray-400 mb-8">Noyob imkoniyatlarni Olmosga sotib oling</p>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
            HOT
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">PUBG Cheat (VIP)</h3>
          <p className="text-gray-400 text-sm mb-4">Maxfiy telegram kanalga kirish huquqi. Faqat eng zo'r o'yinchilar uchun!</p>
          
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
              <Unlock className="w-5 h-5" /> KANALGA KIRISH
            </a>
          ) : (
            <button
              onClick={handleBuy}
              className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all
                ${diamonds >= CHANNEL_PRICE 
                  ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
            >
              {diamonds >= CHANNEL_PRICE ? <Lock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              {diamonds >= CHANNEL_PRICE ? 'SOTIB OLISH' : 'OLMOS YETARLI EMAS'}
            </button>
          )}
          
          {message && <p className="mt-4 text-sm text-blue-400 font-bold">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Shop;
