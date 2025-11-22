
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Palette, Youtube, Instagram, Facebook, MessageCircle, Image, Monitor, User, Coins, Download, CheckCircle, Globe, Video, Smile, Search, X, ChevronDown } from 'lucide-react';
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
    { id: 'ok', name: 'Odnoklassniki', icon: <span className="font-bold text-orange-500">OK</span> },
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
                    { id: 'preview', name: 'Preview (Thumbnail)', price: 100, icon: <Image /> },
                    { id: 'banner', name: 'Banner (Muqova)', price: 150, icon: <Monitor /> },
                    { id: 'avatar', name: 'Avatar (Logo)', price: 80, icon: <User /> },
                    { id: 'intro', name: 'Intro (Video)', price: 300, icon: <Video /> },
                    { id: 'outro', name: 'Outro (Video)', price: 200, icon: <Video /> },
                ];
            case 'telegram':
                return [
                    { id: 'avatar', name: 'Kanal Avatari', price: 80, icon: <User /> },
                    { id: 'post', name: 'Post Dizayni', price: 50, icon: <Image /> },
                    { id: 'sticker_pack', name: 'Sticker Pack (5 dona)', price: 250, icon: <Smile /> },
                ];
            case 'instagram':
                return [
                    { id: 'post', name: 'Post (Rasm)', price: 60, icon: <Image /> },
                    { id: 'stories', name: 'Stories Dizayn', price: 50, icon: <Monitor /> },
                    { id: 'highlights', name: 'Highlights (Muqova)', price: 40, icon: <CheckCircle /> },
                ];
            case 'tiktok':
                return [
                    { id: 'avatar', name: 'Profil Rasmi', price: 80, icon: <User /> },
                    { id: 'video_edit', name: 'Video Montaj (15s)', price: 200, icon: <Video /> },
                ];
            default:
                return [
                    { id: 'avatar', name: 'Avatar', price: 80, icon: <User /> },
                    { id: 'banner', name: 'Banner', price: 120, icon: <Monitor /> },
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

        // Izoh (Multiline support basic)
        ctx.fillStyle = '#aaa';
        ctx.font = 'italic 18px Arial';
        const commentPreview = comment.length > 30 ? comment.substring(0, 30) + '...' : comment;
        ctx.fillText(`Izoh: ${commentPreview}`, 70, startY + (details.length * lineHeight) + 20);

        // Total
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TO'LANDI`, width / 2, height - 160);
        
        // Footer Key (Security)
        ctx.font = '14px Monospace';
        ctx.fillStyle = '#555';
        ctx.fillText(`SECURITY KEY: ${auth.currentUser?.uid.substring(0,8)}-${Date.now()}`, width / 2, height - 30);
    };

    const handleOrder = async () => {
        if (!designName || !phoneNumber || !comment.trim()) {
            alert("Barcha maydonlarni to'ldiring! Izoh yozish majburiy.");
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
                    return c; // Abort if changed
                });
            } catch (e) {
                console.error(e);
                return;
            }
        }

        // 2. Generate Order ID
        const newOrderId = Math.random().toString(36).substr(2, 9).toUpperCase();
        setOrderId(newOrderId);

        // 3. Start Loading Animation
        setStep(2);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setStep(3);
                setTimeout(() => generateCheck(), 200); // Wait for canvas render
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
                <h2 className="text-2xl text-white font-bold mb-2 text-center">Chek generatsiya qilinmoqda...</h2>
                <p className="text-gray-400 text-sm text-center">Iltimos, sahifadan chiqmang.</p>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 pt-10 overflow-y-auto">
                <h2 className="text-3xl text-green-400 font-black mb-4 uppercase text-center animate-pop">Muvaffaqiyatli!</h2>
                <p className="text-gray-400 mb-6 text-center max-w-xs text-sm">Chekni yuklab oling va "Chekni Yuklash" bo'limiga yuklang.</p>
                
                <div className="bg-gray-800 p-2 rounded-xl border border-gray-700 shadow-2xl mb-6 max-w-sm w-full">
                    <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
                </div>

                <button 
                    onClick={downloadCheck} 
                    className="w-full max-w-sm py-4 bg-neonBlue text-black font-black rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors animate-pop shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                >
                    <Download /> CHEKNI YUKLASH
                </button>

                <button 
                    onClick={onBack} 
                    className="mt-6 py-3 px-6 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                >
                    Menyuga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center gap-4 mb-6 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-20 py-2">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"><ArrowLeft /></button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="text-purple-500" /> Dizayn Buyurtma
                </h2>
                <div className="ml-auto bg-gray-800 px-3 py-1 rounded-lg border border-yellow-500/30 text-yellow-400 font-bold text-sm shadow-lg">
                    {coins} <Coins className="inline w-3 h-3" />
                </div>
            </div>

            <div className="w-full max-w-md space-y-6 pb-24">
                
                {/* 1. Platform */}
                <section className="space-y-2 animate-pop" style={{animationDelay: '0.1s'}}>
                    <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">1</span>
                        Platformani tanlang
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {PLATFORMS.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => setPlatform(p.id)}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${platform === p.id ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'}`}
                            >
                                <div className="transform scale-110">{p.icon}</div>
                                <span className="text-[10px] font-bold">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. Design Type - SCROLLABLE CONTAINER */}
                <section className="space-y-2 animate-pop" style={{animationDelay: '0.2s'}}>
                    <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">2</span>
                        Xizmat turi
                    </label>
                    
                    <div className="max-h-[240px] overflow-y-auto pr-1 border border-gray-800 rounded-2xl bg-gray-900/50 p-2">
                        <div className="space-y-2">
                            {currentDesignTypes.map(d => (
                                <button 
                                    key={d.id} 
                                    onClick={() => setDesignType(d.id)}
                                    className={`w-full p-3 rounded-xl flex justify-between items-center border transition-all ${designType === d.id ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${designType === d.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                                            {d.icon}
                                        </div>
                                        <span className="font-bold text-sm text-left">{d.name}</span>
                                    </div>
                                    <div className="bg-gray-900 px-2 py-1 rounded-lg border border-gray-700 whitespace-nowrap">
                                        <span className="font-mono text-yellow-400 font-bold text-xs">{d.price} C</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. Game Selection */}
                <section className="space-y-2 animate-pop" style={{animationDelay: '0.3s'}}>
                    <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">3</span>
                        O'yin turi
                    </label>
                    
                    <button 
                        onClick={() => setShowGameModal(true)}
                        className="w-full bg-gray-800 border border-gray-600 text-white p-4 rounded-xl flex justify-between items-center hover:border-blue-500 transition-colors"
                    >
                        <span className="font-bold">{gameType}</span>
                        <ChevronDown className="text-gray-500" />
                    </button>
                </section>

                {/* 4. Details Form */}
                <section className="space-y-4 bg-gray-800 p-5 rounded-2xl border border-gray-700 animate-pop" style={{animationDelay: '0.4s'}}>
                    <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">4</span>
                        Ma'lumotlar
                    </label>
                    
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Dizayndagi ism (Nick):</label>
                        <input 
                            type="text" 
                            placeholder="Masalan: BEST_GAMER" 
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-xl outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Telefon raqam:</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowCountryModal(true)}
                                className="relative bg-gray-900 border border-gray-600 rounded-xl px-3 flex items-center gap-2 hover:border-blue-500 transition-colors min-w-[100px]"
                            >
                                <span className="text-2xl">{selectedCountry.flag}</span>
                                <span className="text-gray-400 text-xs">▼</span>
                            </button>
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">+{selectedCountry.code}</span>
                                <input 
                                    type="text" 
                                    placeholder={selectedCountry.mask}
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-gray-900 border border-gray-600 text-white p-3 pl-14 rounded-xl outline-none focus:border-blue-500 font-mono transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                         <label className="text-xs text-gray-500 mb-1 block">Izoh (Majburiy):</label>
                         <textarea 
                            placeholder="Dizayn qanday bo'lishi kerak? Ranglar, g'oyalar..." 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-xl outline-none focus:border-blue-500 h-24 resize-none transition-colors"
                        ></textarea>
                        {comment.trim().length === 0 && <p className="text-red-500 text-[10px] mt-1">* Izoh yozish shart</p>}
                    </div>
                </section>

                {/* Footer Pay */}
                <div className="fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur border-t border-gray-800 p-4 flex items-center justify-between z-30 safe-area-pb">
                    <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold">Jami to'lov:</p>
                        <p className="text-2xl font-black text-yellow-400 flex items-center gap-1">{getPrice()} <Coins size={20} /></p>
                    </div>
                    <button 
                        onClick={handleOrder}
                        disabled={coins < getPrice()}
                        className={`px-6 py-3 rounded-xl font-bold text-sm md:text-lg flex items-center gap-2 transition-all shadow-lg ${coins >= getPrice() ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 shadow-purple-500/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        {coins >= getPrice() ? (
                            <> <CheckCircle size={18} /> ZAKAZ BERISH</>
                        ) : (
                            'MABLAG\' YETMAS'
                        )}
                    </button>
                </div>

            </div>

            {/* COUNTRY MODAL */}
            {showCountryModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 w-full max-w-sm rounded-2xl border border-gray-700 max-h-[80vh] flex flex-col animate-pop">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-white font-bold">Davlatni tanlang</h3>
                            <button onClick={() => setShowCountryModal(false)}><X className="text-gray-400" /></button>
                        </div>
                        <div className="overflow-y-auto p-2">
                            {COUNTRIES.map(c => (
                                <button 
                                    key={c.code}
                                    onClick={() => handleCountrySelect(c)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-gray-700 rounded-xl transition-colors text-left"
                                >
                                    <span className="text-3xl">{c.flag}</span>
                                    <div>
                                        <p className="text-white font-bold">{c.name}</p>
                                        <p className="text-gray-400 text-xs">+{c.code}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* GAMES MODAL */}
            {showGameModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 w-full max-w-sm rounded-2xl border border-gray-700 max-h-[80vh] flex flex-col animate-pop">
                        <div className="p-4 border-b border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold">O'yinni tanlang</h3>
                                <button onClick={() => setShowGameModal(false)}><X className="text-gray-400" /></button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Qidirish..." 
                                    value={gameSearch}
                                    onChange={(e) => setGameSearch(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-2 flex-1">
                            {ALL_GAMES.filter(g => g.toLowerCase().includes(gameSearch.toLowerCase())).map(g => (
                                <button 
                                    key={g}
                                    onClick={() => { setGameType(g); setShowGameModal(false); }}
                                    className={`w-full p-3 hover:bg-gray-700 rounded-xl transition-colors text-left text-sm font-bold ${gameType === g ? 'bg-blue-600/20 text-blue-400' : 'text-white'}`}
                                >
                                    {g}
                                </button>
                            ))}
                            {ALL_GAMES.filter(g => g.toLowerCase().includes(gameSearch.toLowerCase())).length === 0 && (
                                <p className="text-center text-gray-500 py-4 text-sm">O'yin topilmadi</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignShop;
