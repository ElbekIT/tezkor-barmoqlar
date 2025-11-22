
import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, ShieldCheck, CheckCircle, XCircle, Loader } from 'lucide-react';
import { auth } from '../firebaseConfig';

interface CheckScannerProps {
    onBack: () => void;
}

const TELEGRAM_BOT_TOKEN = "8593378394:AAGKaT1TUMX7Zr5TxmH2-UXG52Ea9R9zXmE";
const ADMIN_ID = "8269163077";

const CheckScanner: React.FC<CheckScannerProps> = ({ onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(f);
        }
    };

    const scanAndSend = async () => {
        if (!file || !auth.currentUser) return;

        setStatus('scanning');
        
        // 1. Simulate Scanning Animation (3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            // 2. Send to Telegram Bot
            const formData = new FormData();
            formData.append('chat_id', ADMIN_ID);
            formData.append('photo', file);
            formData.append('caption', `📦 YANGI ZAKAZ CHEKI!\n👤 User: ${auth.currentUser.displayName}\n🆔 UID: ${auth.currentUser.uid}\n📅 Vaqt: ${new Date().toLocaleString()}`);

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setStatus('success');
            } else {
                console.error("Telegram Error", await response.text());
                setStatus('error');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
            <div className="w-full max-w-2xl flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"><ArrowLeft /></button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" /> Chek Tekshiruvi
                </h2>
            </div>

            {status === 'success' ? (
                <div className="text-center animate-pop mt-20">
                    <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-white mb-2">QABUL QILINDI!</h2>
                    <p className="text-gray-400 mb-8">Chek muvaffaqiyatli yuborildi. Tez orada adminlarimiz aloqaga chiqishadi.</p>
                    <button onClick={onBack} className="px-8 py-3 bg-gray-800 rounded-xl text-white font-bold">Menyuga qaytish</button>
                </div>
            ) : status === 'error' ? (
                <div className="text-center animate-pop mt-20">
                    <XCircle className="w-32 h-32 text-red-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-white mb-2">XATOLIK!</h2>
                    <p className="text-gray-400 mb-8">Yuborishda xatolik yuz berdi. Internetni tekshiring.</p>
                    <button onClick={() => setStatus('idle')} className="px-8 py-3 bg-gray-800 rounded-xl text-white font-bold">Qayta urinish</button>
                </div>
            ) : (
                <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    
                    {/* Scanning Animation Area */}
                    <div className="relative w-full h-64 bg-black/50 rounded-xl overflow-hidden mb-6 border-2 border-dashed border-gray-600 flex items-center justify-center group">
                        
                        {preview ? (
                            <img src={preview} alt="Check" className="h-full object-contain z-10" />
                        ) : (
                            <div className="text-center text-gray-500" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Chekni yuklash uchun bosing</p>
                            </div>
                        )}

                        {/* Police/Scanner Effect */}
                        {status === 'scanning' && (
                            <>
                                {/* Scanning Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-neonBlue shadow-[0_0_20px_rgba(0,243,255,0.8)] z-20 animate-[scan_2s_linear_infinite]"></div>
                                {/* Police Badge Overlay */}
                                <div className="absolute top-4 right-4 z-30 animate-pulse">
                                    <ShieldCheck className="w-16 h-16 text-blue-500 drop-shadow-[0_0_10px_blue]" />
                                </div>
                                <div className="absolute bottom-4 left-0 w-full text-center z-30">
                                    <p className="text-neonBlue font-mono text-sm bg-black/70 inline-block px-2 py-1 rounded">TEKSHIRILMOQDA...</p>
                                </div>
                            </>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>

                    {/* Controls */}
                    {status === 'idle' && (
                        <>
                            <div className="flex gap-2 mb-4">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    RASM TANLASH
                                </button>
                            </div>
                            <button 
                                onClick={scanAndSend}
                                disabled={!file}
                                className={`w-full py-4 rounded-xl font-black text-xl flex items-center justify-center gap-2 transition-all ${file ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-900 text-gray-600 cursor-not-allowed'}`}
                            >
                                {file ? 'YUBORISH & TEKSHIRISH' : 'FAYL TANLANG'}
                            </button>
                        </>
                    )}

                    {status === 'scanning' && (
                        <div className="text-center py-4">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Xavfsizlik xizmati tekshirmoqda...</p>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}</style>
        </div>
    );
};

export default CheckScanner;
