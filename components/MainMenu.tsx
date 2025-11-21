
import React, { useState, useEffect } from 'react';
import { Trophy, Zap, LogOut, Check, Edit2 } from 'lucide-react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup, signOut, User, updateProfile } from 'firebase/auth';

interface MainMenuProps {
  onStartGame: (playerName: string) => void;
  onShowLeaderboard: () => void;
  user: User | null;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onShowLeaderboard, user }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  // Agar user bo'lsa, lekin hali ism tasdiqlamagan bo'lsa, bu 'setup' bosqichi bo'ladi
  const [isProfileSetup, setIsProfileSetup] = useState(false);

  // User kirganda avtomatik tekshirish
  useEffect(() => {
    if (user) {
      // 1. Ismni inputga qo'yamiz
      setNickname(user.displayName || '');

      // 2. Tekshiramiz: Bu user oldin ismni tasdiqlaganmi?
      // Biz buni localStorage orqali yoki user.displayName borligiga qarab bilishimiz mumkin.
      const isSetupDone = localStorage.getItem(`setup_done_${user.uid}`);
      
      if (isSetupDone === 'true' && user.displayName) {
        setIsProfileSetup(true);
      } else {
        // Agar birinchi marta kirayotgan bo'lsa yoki localStorage tozalanib ketgan bo'lsa
        setIsProfileSetup(false);
      }
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Login muvaffaqiyatli bo'lsa, qolganini useEffect hal qiladi
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
        // Ismni Firebase Auth profiliga saqlaymiz (Serverda)
        await updateProfile(auth.currentUser, {
          displayName: nickname
        });
        
        // Brauzerga bu user setup qilganini yozib qo'yamiz
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
        
        {/* 1-BOSQICH: TIZIMGA KIRISH (Agar user yo'q bo'lsa) */}
        {!user && (
          <button
            onClick={handleGoogleLogin}
            className="w-full px-8 py-4 bg-white text-gray-900 font-bold text-xl rounded-xl hover:bg-gray-100 transition-transform hover:scale-105 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google orqali kirish
          </button>
        )}

        {/* 2-BOSQICH: ISM KIRITISH (Agar user bor, lekin 'setup_done' emas bo'lsa) */}
        {user && !isProfileSetup && (
          <form onSubmit={handleNameSubmit} className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm animate-pop">
            <h3 className="text-xl text-white mb-4 font-bold">Reytingda ko'rinadigan ismingiz:</h3>
            <div className="relative mb-4">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="Ismingiz..."
                className="w-full px-6 py-3 bg-gray-900 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neonBlue text-center text-lg"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-neonPurple text-white font-bold rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> TASDIQLASH VA KIRISH
            </button>
            <button
                type="button"
                onClick={handleLogout}
                className="mt-4 text-gray-400 text-sm hover:text-white underline"
            >
                Boshqa akkauntga kirish
            </button>
          </form>
        )}

        {/* 3-BOSQICH: ASOSIY MENU (User bor va isSetupDone = true) */}
        {user && isProfileSetup && (
          <div className="space-y-4 animate-pop">
            <div className="text-neonBlue text-xl mb-4 font-mono flex items-center justify-center gap-2">
               Salom, <span className="font-bold">{nickname}</span>!
               <button 
                 onClick={handleChangeName}
                 className="p-1 text-gray-500 hover:text-white transition-colors"
                 title="Ismni o'zgartirish"
               >
                 <Edit2 className="w-4 h-4" />
               </button>
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

            <button
              type="button"
              onClick={onShowLeaderboard}
              className="w-full px-8 py-4 bg-transparent border-2 border-neonPurple text-neonPurple font-bold text-xl rounded-xl hover:bg-neonPurple hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-6 h-6" /> REYTING
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-gray-800 text-gray-400 font-semibold rounded-xl hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-gray-600 text-sm">
        Netlify & Firebase tomonidan quvvatlanadi
      </div>
    </div>
  );
};

export default MainMenu;
