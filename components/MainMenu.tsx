
import React, { useState, useEffect } from 'react';
import { Trophy, Zap, LogOut, Check, Edit2, MessageCircle, ShoppingCart, TrendingUp, Coins, Disc, Gem, Swords, ScanLine, Palette } from 'lucide-react';
import { auth, googleProvider, db } from '../firebaseConfig';
import { signInWithPopup, signOut, User, updateProfile } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

interface MainMenuProps {
  onStartGame: (playerName: string) => void;
  onShowLeaderboard: () => void;
  onOpenChat: () => void;
  onOpenCrash: () => void;
  onOpenWheel: () => void;
  onOpenShop: () => void;
  onOpenBattle: () => void;
  onOpenCheckScanner: () => void;
  user: User | null;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onShowLeaderboard, 
  onOpenChat,
  onOpenCrash,
  onOpenWheel,
  onOpenShop,
  onOpenBattle,
  onOpenCheckScanner,
  user 
}) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [coins, setCoins] = useState<number>(0);
  const [diamonds, setDiamonds] = useState<number>(0);

  // User kirganda avtomatik tekshirish
  useEffect(() => {
    if (user) {
      setNickname(user.displayName || '');
      const isSetupDone = localStorage.getItem(`setup_done_${user.uid}`);
      
      if (isSetupDone === 'true' && user.displayName) {
        setIsProfileSetup(true);
      } else {
        setIsProfileSetup(false);
      }

      // Balanslarni yuklash
      const userRef = ref(db, `users/${user.uid}`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setCoins(data?.coins || 0);
        setDiamonds(data?.diamonds || 0);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('Google orqali kirishda xatolik yuz berdi.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsProfileSetup(false);
    setNickname('');
    setError('');
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Iltimos, ismingizni kiriting!');
      return;
    }
    if (nickname.length > 15) {
      setError('Ism juda uzun (max 15 ta harf)');
      return;
    }

    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: nickname
        });
        localStorage.setItem(`setup_done_${auth.currentUser.uid}`, 'true');
        setIsProfileSetup(true);
      }
    } catch (err) {
      console.error("Ism saqlashda xatolik:", err);
      setError("Ismni saqlashda xatolik bo'ldi, qayta urinib ko'ring.");
    }
  };

  const handleStartClick = () => {
    onStartGame(nickname);
  };

  const handleChangeName = () => {
    setIsProfileSetup(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black">
      <div className="mb-8 animate-pop">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple drop-shadow-[0_0_10px_rgba(188,19,254,0.5)]">
          TEZKOR<br />BARMOQLAR
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          {!user ? "O'ynash uchun tizimga kiring" : "Qanchalik tezkor ekanligingizni sinang!"}
        </p>
      </div>

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* 1-BOSQICH: TIZIMGA KIRISH */}
        {!user && (
          <button
            onClick={handleGoogleLogin}
            className="w-full px-8 py-4 bg-white text-gray-900 font-bold text-xl rounded-xl hover:bg-gray-100 transition-transform hover:scale-105 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google orqali kirish
          </button>
        )}

        {/* 2-BOSQICH: ISM KIRITISH */}
        {user && !isProfileSetup && (
          <form onSubmit={handleNameSubmit} className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm animate-pop">
            <h3 className="text-xl text-white mb-4 font-bold">Reytingda ko'rinadigan ismingiz:</h3>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(''); }}
              placeholder="Ismingiz..."
              className="w-full px-6 py-3 mb-4 bg-gray-900 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neonBlue text-center text-lg"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-neonPurple text-white font-bold rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> TASDIQLASH
            </button>
          </form>
        )}

        {/* 3-BOSQICH: ASOSIY MENU */}
        {user && isProfileSetup && (
          <div className="space-y-3 animate-pop">
            <div className="flex flex-col items-center justify-center gap-2 mb-6">
               <div className="text-neonBlue text-xl font-mono flex items-center gap-2">
                  Salom, <span className="font-bold">{nickname}</span>
                  <button onClick={handleChangeName} className="text-gray-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
               </div>
               <div className="flex gap-3">
                  <div className="bg-gray-800 px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-2 shadow-lg">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-lg">{coins}</span>
                  </div>
                  <div className="bg-gray-800 px-4 py-2 rounded-full border border-blue-400/50 flex items-center gap-2 shadow-lg">
                      <Gem className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-400 font-bold text-lg">{diamonds}</span>
                  </div>
               </div>
            </div>

            <button
              onClick={handleStartClick}
              className="w-full group relative px-8 py-4 bg-neonBlue text-black font-bold text-xl rounded-xl overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-6 h-6" /> BOSHLASH
              </span>
            </button>

            {/* Top Row */}
            <button
              onClick={onOpenBattle}
              className="w-full group relative px-8 py-4 bg-red-600 text-white font-bold text-xl rounded-xl overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
               <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               <span className="relative flex items-center justify-center gap-2">
                 <Swords className="w-6 h-6" /> JANG (BATTLE)
               </span>
            </button>
            
            <button
              onClick={onShowLeaderboard}
              className="w-full px-8 py-3 bg-gray-800 border border-neonPurple/50 text-neonPurple font-bold text-lg rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" /> REYTING
            </button>

            {/* Games Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenCrash}
                className="col-span-1 px-4 py-4 bg-gradient-to-br from-red-900 to-red-600 text-white font-bold text-sm md:text-base rounded-xl hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1 shadow-lg transform hover:scale-105"
              >
                <TrendingUp className="w-6 h-6 mb-1" /> 
                CRASH (PRO)
              </button>
              <button
                onClick={onOpenWheel}
                className="col-span-1 px-4 py-4 bg-gradient-to-br from-purple-900 to-purple-600 text-white font-bold text-sm md:text-base rounded-xl hover:brightness-110 transition-all flex flex-col items-center justify-center gap-1 shadow-lg transform hover:scale-105"
              >
                <Disc className="w-6 h-6 mb-1" /> 
                OMAD DOIRASI
              </button>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenShop}
                className="col-span-1 px-4 py-3 bg-yellow-500/10 border border-yellow-500 text-yellow-500 font-bold rounded-xl hover:bg-yellow-500 hover:text-black transition-all flex flex-col items-center justify-center gap-1"
              >
                <ShoppingCart className="w-5 h-5" /> DO'KON
              </button>
              <button
                onClick={onOpenCheckScanner}
                className="col-span-1 px-4 py-3 bg-blue-500/10 border border-blue-500 text-blue-400 font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all flex flex-col items-center justify-center gap-1"
              >
                <ScanLine className="w-5 h-5" /> CHEKNI YUKLASH
              </button>
            </div>

            <button
                onClick={onOpenChat}
                className="w-full px-4 py-3 bg-gray-700 text-green-400 font-bold rounded-xl hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> ONLINE CHAT
              </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-6 py-2 text-gray-500 hover:text-white transition-colors text-sm mt-4"
            >
              <span className="flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Chiqish</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMenu;
