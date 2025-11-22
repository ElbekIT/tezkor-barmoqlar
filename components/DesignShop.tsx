
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Palette, Youtube, Instagram, Facebook, MessageCircle, Image, Monitor, User, Coins, Download, CheckCircle, Globe } from 'lucide-react';
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

const GAMES = [
    { id: 'pubg', name: 'PUBG Mobile' },
    { id: 'freefire', name: 'Free Fire' },
    { id: 'minecraft', name: 'Minecraft' },
    { id: 'roblox', name: 'Roblox' },
    { id: 'cod', name: 'Call of Duty' },
    { id: 'brawl', name: 'Brawl Stars' },
];

const DESIGN_TYPES = [
    { id: 'preview', name: 'Preview (Thumbnail)', price: 100, icon: <Image /> },
    { id: 'banner', name: 'Banner (Muqova)', price: 120, icon: <Monitor /> },
    { id: 'avatar', name: 'Avatarka (Logo)', price: 50, icon: <User /> },
];

const COUNTRIES = [
    { code: '998', flag: '🇺🇿', name: 'Uzbekistan', mask: '##-###-##-##' },
    { code: '7', flag: '🇷🇺', name: 'Russia', mask: '(###) ###-##-##' },
    { code: '1', flag: '🇺🇸', name: 'USA', mask: '(###) ###-####' },
    { code: '996', flag: '🇰🇬', name: 'Kyrgyzstan', mask: '###-###-###' },
    { code: '97', flag: '🇦🇪', name: 'UAE', mask: '##-###-####' },
    // Add more as needed
];

const DesignShop: React.FC<DesignShopProps> = ({ onBack }) => {
    const [coins, setCoins] = useState(0);
    const [step, setStep] = useState(1); // 1: Form, 2: Loading, 3: Download
    const [loadingProgress, setLoadingProgress] = useState(0);
    
    // Form State
    const [platform, setPlatform] = useState(PLATFORMS[0].id);
    const [designType, setDesignType] = useState(DESIGN_TYPES[0].id);
    const [gameType, setGameType] = useState(GAMES[0].id);
    const [designName, setDesignName] = useState("");
    const [phoneCode, setPhoneCode] = useState("+998");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [comment, setComment] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

    const [orderId, setOrderId] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (auth.currentUser) {
            const userRef = ref(db, `users/${auth.currentUser.uid}/coins`);
            onValue(userRef, (snap) => setCoins(snap.val() || 0));
        }
    }, []);

    useEffect(() => {
        // Auto-detect country from phone code input
        const code = phoneCode.replace('+', '');
        const found = COUNTRIES.find(c => c.code === code);
        if (found) setSelectedCountry(found);
    }, [phoneCode]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        // Simple masking logic could go here, but for now raw input with auto-dash
        if (selectedCountry.code === '998') {
            if (val.length > 2) val = val.slice(0,2) + '-' + val.slice(2);
            if (val.length > 6) val = val.slice(0,6) + '-' + val.slice(6);
            if (val.length > 9) val = val.slice(0,9) + '-' + val.slice(9);
            if (val.length > 12) val = val.slice(0,12); // Max length
        }
        setPhoneNumber(val);
    };

    const getPrice = () => {
        const type = DESIGN_TYPES.find(d => d.id === designType);
        return type ? type.price : 0;
    };

    const generateCheck = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup Canvas High Res
        const width = 600;
        const height = 800;
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
        ctx.fillRect(0, 0, width, 100);
        
        // Title
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#e94560';
        ctx.textAlign = 'center';
        ctx.fillText('TEZKOR BARMOQLAR', width / 2, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('RASMIY TO\'LOV CHEKI', width / 2, 90);

        // Check Info Box
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(50, 140, width - 100, height - 240);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 140, width - 100, height - 240);

        // Details
        const startY = 200;
        const lineHeight = 40;
        
        ctx.textAlign = 'left';
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#4cc9f0';
        
        const details = [
            `BUYURTMA ID: #${orderId}`,
            `SANA: ${new Date().toLocaleDateString()}`,
            `PLATFORMA: ${PLATFORMS.find(p => p.id === platform)?.name}`,
            `O'YIN: ${GAMES.find(g => g.id === gameType)?.name}`,
            `TUR: ${DESIGN_TYPES.find(d => d.id === designType)?.name}`,
            `ISM: ${designName}`,
            `TEL: ${phoneCode} ${phoneNumber}`,
            `NARX: ${getPrice()} TANGA`
        ];

        details.forEach((text, i) => {
            ctx.fillText(text, 80, startY + (i * lineHeight));
        });

        // Total
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TO'LANDI`, width / 2, height - 150);
        
        // Footer Key (Security)
        ctx.font = '12px Monospace';
        ctx.fillStyle = '#555';
        ctx.fillText(`KEY: ${orderId}-${Date.now()}`, width / 2, height - 20);
    };

    const handleOrder = async () => {
        if (!designName || !phoneNumber) {
            alert("Barcha maydonlarni to'ldiring!");
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
                setTimeout(() => generateCheck(), 100); // Wait for canvas render
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
                <div className="w-24 h-24 relative mb-8">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-neonBlue rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h2 className="text-2xl text-white font-bold mb-4">Chek tayyorlanmoqda...</h2>
                <div className="w-full max-w-md bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div className="bg-neonBlue h-full transition-all duration-75" style={{width: `${loadingProgress}%`}}></div>
                </div>
                <p className="text-neonBlue mt-2 font-mono">{loadingProgress}%</p>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 pt-10">
                <h2 className="text-3xl text-green-400 font-black mb-4 uppercase text-center">Muvaffaqiyatli!</h2>
                <p className="text-gray-400 mb-6 text-center max-w-xs">Chekni yuklab oling va asosiy menyudagi "Chekni Yuklash" bo'limiga o'ting.</p>
                
                <div className="bg-gray-800 p-2 rounded-xl border border-gray-700 shadow-2xl mb-6 max-w-sm w-full">
                    <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
                </div>

                <button 
                    onClick={downloadCheck} 
                    className="w-full max-w-sm py-4 bg-neonBlue text-black font-black rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors animate-pop"
                >
                    <Download /> CHEKNI YUKLASH
                </button>

                <button 
                    onClick={onBack} 
                    className="mt-4 text-gray-500 hover:text-white"
                >
                    Menyuga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
            <div className="w-full max-w-2xl flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"><ArrowLeft /></button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="text-purple-500" /> Dizayn Buyurtma
                </h2>
                <div className="ml-auto bg-gray-800 px-3 py-1 rounded-lg border border-yellow-500/30 text-yellow-400 font-bold text-sm">
                    {coins} <Coins className="inline w-3 h-3" />
                </div>
            </div>

            <div className="w-full max-w-md space-y-6 pb-20">
                
                {/* Platform */}
                <section className="space-y-2">
                    <label className="text-gray-400 text-xs font-bold uppercase">1. Platforma</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PLATFORMS.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => setPlatform(p.id)}
                                className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${platform === p.id ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'}`}
                            >
                                {p.icon}
                                <span className="text-[10px] font-bold">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Design Type */}
                <section className="space-y-2">
                    <label className="text-gray-400 text-xs font-bold uppercase">2. Dizayn Turi</label>
                    <div className="space-y-2">
                        {DESIGN_TYPES.map(d => (
                            <button 
                                key={d.id} 
                                onClick={() => setDesignType(d.id)}
                                className={`w-full p-3 rounded-xl flex justify-between items-center border transition-all ${designType === d.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {d.icon}
                                    <span className="font-bold">{d.name}</span>
                                </div>
                                <span className="font-mono text-yellow-400 font-bold">{d.price} C</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Game */}
                <section className="space-y-2">
                    <label className="text-gray-400 text-xs font-bold uppercase">3. O'yin Turi</label>
                    <select 
                        value={gameType} 
                        onChange={(e) => setGameType(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-xl outline-none focus:border-purple-500"
                    >
                        {GAMES.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </section>

                {/* Details */}
                <section className="space-y-3 bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <label className="text-gray-400 text-xs font-bold uppercase">4. Ma'lumotlar</label>
                    
                    <input 
                        type="text" 
                        placeholder="Dizayndagi Nom (Nick)" 
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500"
                    />

                    <div className="flex gap-2">
                        <div className="relative w-24">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-lg">{selectedCountry.flag}</div>
                            <input 
                                type="text" 
                                value={phoneCode}
                                onChange={(e) => setPhoneCode(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-white p-3 pl-8 rounded-lg outline-none focus:border-blue-500 text-center"
                            />
                        </div>
                        <input 
                            type="text" 
                            placeholder={selectedCountry.mask}
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            className="flex-1 bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500 font-mono"
                        />
                    </div>

                    <textarea 
                        placeholder="Izoh (ixtiyoriy)..." 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-lg outline-none focus:border-blue-500 h-20"
                    ></textarea>
                </section>

                {/* Total & Pay */}
                <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase">Jami summa:</p>
                        <p className="text-2xl font-black text-yellow-400 flex items-center gap-1">{getPrice()} <Coins size={20} /></p>
                    </div>
                    <button 
                        onClick={handleOrder}
                        disabled={coins < getPrice()}
                        className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${coins >= getPrice() ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                        {coins >= getPrice() ? (
                            <> <CheckCircle /> ZAKAZ BERISH</>
                        ) : (
                            'MABLAG\' YETMAS'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DesignShop;
