
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Palette, Youtube, Instagram, Facebook, MessageCircle, Image, Monitor, User, Coins, Download, CheckCircle, Video, Smile, Search, X, ChevronRight, Globe, Hash, Edit3 } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, runTransaction, onValue } from "firebase/database";

interface DesignShopProps {
    onBack: () => void;
}

const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="text-red-500" /> },
    { id: 'telegram', name: 'Telegram', icon: <MessageCircle className="text-blue-400" /> },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="text-pink-500" /> },
    { id: 'tiktok', name: 'TikTok', icon: <span className="font-black text-xs bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">TK</span> },
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="text-blue-600" /> },
    { id: 'ok', name: 'Ok.ru', icon: <span className="font-bold text-orange-500">OK</span> },
];

const ALL_GAMES = [
    "PUBG Mobile", "Free Fire", "Call of Duty Mobile", "Mobile Legends", "Brawl Stars", 
    "Clash of Clans", "Clash Royale", "Minecraft", "Roblox", "GTA V", 
    "FIFA Mobile", "eFootball (PES)", "League of Legends", "Dota 2", "CS 2", 
    "Valorant", "Fortnite", "Apex Legends", "Overwatch 2", "Rocket League", 
    "Among Us", "Stumble Guys", "Subway Surfers", "Candy Crush", "8 Ball Pool", 
    "Ludo King", "Car Parking Multiplayer", "Asphalt 9", "Need for Speed", "Mortal Kombat", 
    "Tekken", "Shadow Fight 3", "Genshin Impact", "Honkai: Star Rail", "Pokemon GO", 
    "Hay Day", "SimCity BuildIt", "Terraria", "Plants vs Zombies", "Angry Birds", 
    "Temple Run 2", "Hill Climb Racing", "Dream League Soccer", "Score! Hero", "Head Ball 2", 
    "Agar.io", "Slither.io", "Worms Zone", "Paper.io", "World of Tanks Blitz"
].sort();

const COUNTRIES = [
    { code: '998', flag: '🇺🇿', name: 'Uzbekistan', mask: '##-###-##-##' },
    { code: '7', flag: '🇷🇺', name: 'Russia', mask: '(###) ###-##-##' },
    { code: '77', flag: '🇰🇿', name: 'Kazakhstan', mask: '(###) ###-##-##' },
    { code: '992', flag: '🇹🇯', name: 'Tajikistan', mask: '##-###-####' },
    { code: '996', flag: '🇰🇬', name: 'Kyrgyzstan', mask: '###-###-###' },
    { code: '1', flag: '🇺🇸', name: 'USA', mask: '(###) ###-####' },
    { code: '90', flag: '🇹🇷', name: 'Turkey', mask: '(###) ###-##-##' },
    { code: '82', flag: '🇰🇷', name: 'South Korea', mask: '##-####-####' },
    { code: '86', flag: '🇨🇳', name: 'China', mask: '###-####-####' },
    { code: '91', flag: '🇮🇳', name: 'India', mask: '#####-#####' },
    { code: '971', flag: '🇦🇪', name: 'UAE', mask: '##-###-####' },
    { code: '44', flag: '🇬🇧', name: 'UK', mask: '####-######' },
    { code: '33', flag: '🇫🇷', name: 'France', mask: '#-##-##-##-##' },
    { code: '49', flag: '🇩🇪', name: 'Germany', mask: '####-#######' },
];

const DesignShop: React.FC<DesignShopProps> = ({ onBack }) => {
    const [coins, setCoins] = useState(0);
    const [step, setStep] = useState(1); // 1: Form, 2: Loading, 3: Download
    const [loadingProgress, setLoadingProgress] = useState(0);
    
    // Form State
    const [platform, setPlatform] = useState(PLATFORMS[0].id);
    const [designType, setDesignType] = useState("");
    const [gameType, setGameType] = useState(ALL_GAMES[0]);
    const [designName, setDesignName] = useState("");
    const [phoneCode, setPhoneCode] = useState("+998");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [comment, setComment] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

    // Modals
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [gameSearch, setGameSearch] = useState("");

    const [orderId, setOrderId] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Platformaga qarab dizayn turlarini aniqlash
    const getDesignTypesForPlatform = (pid: string) => {
        switch (pid) {
            case 'youtube':
                return [
                    { id: 'preview', name: 'Preview', price: 100, icon: <Image size={18} /> },
                    { id: 'banner', name: 'Banner', price: 150, icon: <Monitor size={18} /> },
                    { id: 'avatar', name: 'Logo', price: 80, icon: <User size={18} /> },
                    { id: 'intro', name: 'Intro', price: 300, icon: <Video size={18} /> },
                ];
            case 'telegram':
                return [
                    { id: 'avatar', name: 'Avatar', price: 80, icon: <User size={18} /> },
                    { id: 'post', name: 'Post', price: 50, icon: <Image size={18} /> },
                    { id: 'sticker_pack', name: 'Stickers', price: 250, icon: <Smile size={18} /> },
                ];
            case 'instagram':
                return [
                    { id: 'post', name: 'Post', price: 60, icon: <Image size={18} /> },
                    { id: 'stories', name: 'Stories', price: 50, icon: <Monitor size={18} /> },
                    { id: 'highlights', name: 'Highlights', price: 40, icon: <CheckCircle size={18} /> },
                ];
            default:
                return [
                    { id: 'avatar', name: 'Avatar', price: 80, icon: <User size={18} /> },
                    { id: 'banner', name: 'Banner', price: 120, icon: <Monitor size={18} /> },
                ];
        }
    };

    const currentDesignTypes = getDesignTypesForPlatform(platform);

    useEffect(() => {
        if (auth.currentUser) {
            const userRef = ref(db, `users/${auth.currentUser.uid}/coins`);
            onValue(userRef, (snap) => setCoins(snap.val() || 0));
        }
    }, []);

    // Platforma o'zgarganda dizayn turini reset qilish
    useEffect(() => {
        setDesignType(currentDesignTypes[0].id);
    }, [platform]);

    const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
        setSelectedCountry(country);
        setPhoneCode("+" + country.code);
        setPhoneNumber("");
        setShowCountryModal(false);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9-]/g, '');
        setPhoneNumber(val);
    };

    const getPrice = () => {
        const type = currentDesignTypes.find(d => d.id === designType);
        return type ? type.price : 0;
    };

    const getDesignTypeName = () => {
        const type = currentDesignTypes.find(d => d.id === designType);
        return type ? type.name : designType;
    };

    const generateCheck = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup Canvas High Res
        const width = 600;
        const height = 900;
        canvas.width = width;
        canvas.height = height;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Header Pattern
        ctx.fillStyle = '#0f3460';
        ctx.fillRect(0, 0, width, 120);
        
        // Title
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#e94560';
        ctx.textAlign = 'center';
        ctx.fillText('TEZKOR BARMOQLAR', width / 2, 70);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('RASMIY DIZAYN CHEKI', width / 2, 105);

        // Check Info Box
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(40, 160, width - 80, height - 280);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 160, width - 80, height - 280);

        // Details
        const startY = 220;
        const lineHeight = 45;
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 22px Courier New';
        ctx.fillStyle = '#4cc9f0';
        
        const platformName = PLATFORMS.find(p => p.id === platform)?.name;
        
        const details = [
            `ID: #${orderId}`,
            `SANA: ${new Date().toLocaleDateString()}`,
            `PLATFORMA: ${platformName}`,
            `O'YIN: ${gameType.substring(0, 20)}`,
            `XIZMAT: ${getDesignTypeName()}`,
            `NICK: ${designName}`,
            `TEL: ${phoneCode} ${phoneNumber}`,
            `NARX: ${getPrice()} TANGA`,
            `DAVLAT: ${selectedCountry.name}`
        ];

        details.forEach((text, i) => {
            ctx.fillText(text, 70, startY + (i * lineHeight));
        });

        // Izoh
        ctx.fillStyle = '#aaa';
        ctx.font = 'italic 18px Arial';
        const commentPreview = comment.length > 30 ? comment.substring(0, 30) + '...' : comment;
        ctx.fillText(`Izoh: ${commentPreview}`, 70, startY + (details.length * lineHeight) + 20);

        // Total
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TO'LANDI`, width / 2, height - 160);
        
        // Footer Key
        ctx.font = '14px Monospace';
        ctx.fillStyle = '#555';
        ctx.fillText(`SEC-KEY: ${auth.currentUser?.uid.substring(0,8)}-${Date.now()}`, width / 2, height - 30);
    };

    const handleOrder = async () => {
        if (!designName || !phoneNumber || !comment.trim()) {
            alert("Iltimos, barcha maydonlarni to'ldiring!");
            return;
        }
        const price = getPrice();
        if (coins < price) {
            alert("Mablag' yetarli emas!");
            return;
        }

        // 1. Deduct Coins
        if (auth.currentUser) {
            try {
                const userRef = ref(db, `users/${auth.currentUser.uid}/coins`);
                await runTransaction(userRef, (c) => {
                    if ((c || 0) >= price) return c - price;
                    return c;
                });
            } catch (e) {
                console.error(e);
                return;
            }
        }

        // 2. Generate Order ID
        const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();
        setOrderId(newOrderId);

        // 3. Start Loading
        setStep(2);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setStep(3);
                setTimeout(() => generateCheck(), 200);
            }
        }, 30);
    };

    const downloadCheck = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = `Chek-${orderId}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
                <div className="w-32 h-32 relative mb-8">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-neonBlue rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xl">
                        {loadingProgress}%
                    </div>
                </div>
                <h2 className="text-xl text-white font-bold mb-2 text-center">Chek tayyorlanmoqda...</h2>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 pt-10 overflow-y-auto">
                <h2 className="text-3xl text-green-400 font-black mb-4 uppercase text-center animate-pop">Muvaffaqiyatli!</h2>
                <p className="text-gray-400 mb-6 text-center text-xs">Chekni yuklab olib, "Chekni Yuklash" bo'limiga o'ting.</p>
                
                <div className="bg-gray-800 p-1 rounded-lg border border-gray-700 shadow-2xl mb-6 max-w-xs w-full">
                    <canvas ref={canvasRef} className="w-full h-auto rounded" />
                </div>

                <button 
                    onClick={downloadCheck} 
                    className="w-full max-w-xs py-3 bg-neonBlue text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                >
                    <Download size={20} /> YUKLAB OLISH
                </button>

                <button 
                    onClick={onBack} 
                    className="mt-4 text-gray-500 text-sm hover:text-white underline"
                >
                    Menyuga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Compact Header */}
            <div className="bg-gray-800/90 backdrop-blur p-3 flex items-center justify-between sticky top-0 z-20 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 bg-gray-700 rounded text-white"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="font-bold text-white text-base leading-tight">Dizayn</h2>
                        <p className="text-[10px] text-gray-400">Service</p>
                    </div>
                </div>
                <div className="bg-gray-900 px-3 py-1.5 rounded-full border border-yellow-500/30 text-yellow-400 font-bold text-xs shadow-lg flex items-center gap-1">
                    {coins} <Coins size={12} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-5">
                
                {/* 1. Platforms (Horizontal Scroll) */}
                <div className="space-y-2">
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Platforma</p>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {PLATFORMS.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => setPlatform(p.id)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all ${platform === p.id ? 'bg-gray-800 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-gray-800/50 border-gray-700 opacity-70'}`}
                            >
                                <div className="transform scale-110 mb-1">{p.icon}</div>
                                <span className={`text-[10px] font-bold ${platform === p.id ? 'text-white' : 'text-gray-500'}`}>{p.name}</span>
                            </button>
                        ))}
                     </div>
                </div>

                {/* 2. Services (Grid 2 Columns) */}
                <div className="space-y-2">
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Xizmat Turi</p>
                     <div className="grid grid-cols-2 gap-3">
                        {currentDesignTypes.map(d => (
                            <button 
                                key={d.id} 
                                onClick={() => setDesignType(d.id)}
                                className={`relative p-3 rounded-xl border-2 text-left transition-all ${designType === d.id ? 'bg-blue-600/10 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
                            >
                                <div className={`mb-2 p-2 rounded-lg w-fit ${designType === d.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                    {d.icon}
                                </div>
                                <div className="font-bold text-white text-sm">{d.name}</div>
                                <div className="absolute top-3 right-3 text-xs font-mono text-yellow-400 font-bold">
                                    {d.price} C
                                </div>
                            </button>
                        ))}
                     </div>
                </div>

                {/* 3. Game & Details (Compact Form) */}
                <div className="space-y-3">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Ma'lumotlar</p>
                    
                    {/* Game Selector */}
                    <button 
                        onClick={() => setShowGameModal(true)}
                        className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl flex items-center justify-between text-sm text-white hover:border-gray-500"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gray-700 rounded"><Globe size={16} /></div>
                            <span>{gameType}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                    </button>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-1 flex items-center">
                            <div className="p-2 text-gray-500"><User size={16} /></div>
                            <input 
                                type="text" 
                                placeholder="Nick (Ismingiz)" 
                                value={designName}
                                onChange={(e) => setDesignName(e.target.value)}
                                className="bg-transparent w-full text-sm text-white p-2 outline-none placeholder-gray-600"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowCountryModal(true)}
                                className="bg-gray-800 border border-gray-700 rounded-xl px-3 flex items-center gap-1 text-lg"
                            >
                                {selectedCountry.flag}
                            </button>
                            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-1 flex items-center">
                                <span className="pl-3 text-gray-500 text-sm font-mono">{phoneCode}</span>
                                <input 
                                    type="text" 
                                    placeholder={selectedCountry.mask.replace(/#/g, '_')}
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    className="bg-transparent w-full text-sm text-white p-2 outline-none placeholder-gray-600 font-mono"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-1 flex items-start">
                            <div className="p-2 text-gray-500 mt-1"><Edit3 size={16} /></div>
                            <textarea 
                                placeholder="Izoh yozing..." 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="bg-transparent w-full text-sm text-white p-2 outline-none placeholder-gray-600 h-16 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 z-30 safe-area-pb">
                <button 
                    onClick={handleOrder}
                    disabled={coins < getPrice()}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${coins >= getPrice() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    {coins >= getPrice() ? (
                        <>TO'LASH: {getPrice()} <Coins size={16} /></>
                    ) : (
                        'MABLAG\' YETARLI EMAS'
                    )}
                </button>
            </div>

            {/* Modals */}
            {showGameModal && (
                <div className="fixed inset-0 bg-black/90 z-50 p-4 flex flex-col animate-pop">
                    <div className="flex items-center gap-3 mb-4">
                         <button onClick={() => setShowGameModal(false)} className="p-2 bg-gray-800 rounded-full text-white"><ArrowLeft /></button>
                         <div className="flex-1 relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                             <input 
                                 type="text" 
                                 placeholder="O'yinni qidirish..." 
                                 value={gameSearch}
                                 onChange={(e) => setGameSearch(e.target.value)}
                                 className="w-full bg-gray-800 rounded-full pl-10 pr-4 py-2 text-white text-sm outline-none"
                                 autoFocus
                             />
                         </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {ALL_GAMES.filter(g => g.toLowerCase().includes(gameSearch.toLowerCase())).map(g => (
                            <button 
                                key={g}
                                onClick={() => { setGameType(g); setShowGameModal(false); }}
                                className={`w-full p-4 rounded-xl text-left text-sm font-bold border ${gameType === g ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showCountryModal && (
                <div className="fixed inset-0 bg-black/90 z-50 p-4 flex flex-col justify-center">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 max-h-[70vh] flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-white font-bold">Davlatni tanlang</h3>
                            <button onClick={() => setShowCountryModal(false)}><X className="text-gray-400" /></button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            {COUNTRIES.map(c => (
                                <button 
                                    key={c.code}
                                    onClick={() => handleCountrySelect(c)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-gray-800 rounded-xl transition-colors text-left border-b border-gray-800 last:border-0"
                                >
                                    <span className="text-2xl">{c.flag}</span>
                                    <div>
                                        <p className="text-white font-bold text-sm">{c.name}</p>
                                        <p className="text-gray-500 text-xs">+{c.code}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignShop;
