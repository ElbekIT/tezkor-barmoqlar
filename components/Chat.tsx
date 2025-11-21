import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, push, onValue, limitToLast, query } from "firebase/database";
import { ChatMessage } from '../types';

interface ChatProps {
  onBack: () => void;
  playerName: string;
}

const Chat: React.FC<ChatProps> = ({ onBack, playerName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = ref(db, 'chat');
    const chatQuery = query(chatRef, limitToLast(50));

    const unsubscribe = onValue(chatQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(loadedMessages);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      const chatRef = ref(db, 'chat');
      await push(chatRef, {
        sender: playerName,
        text: newMessage.trim(),
        timestamp: Date.now(),
        uid: auth.currentUser.uid
      });
      setNewMessage('');
    } catch (error) {
      console.error("Xabar yuborishda xatolik:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-4">
        <button onClick={onBack} className="text-white hover:text-neonBlue">
          <ArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageCircle className="text-green-400" /> Online Chat
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.uid === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-500 mb-1">{msg.sender}</span>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                isMe 
                  ? 'bg-neonBlue text-black rounded-tr-none' 
                  : 'bg-gray-700 text-white rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-600 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Xabar yozing..."
          className="flex-1 bg-gray-900 text-white border border-gray-600 rounded-xl px-4 py-2 focus:outline-none focus:border-neonBlue"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-neonBlue text-black p-3 rounded-xl hover:bg-white disabled:opacity-50 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;