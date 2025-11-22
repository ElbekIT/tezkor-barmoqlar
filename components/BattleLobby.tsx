
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Swords, User, Clock } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, set, remove, onDisconnect, push, update } from "firebase/database";

interface BattleLobbyProps {
  onBack: () => void;
  onBattleStart: (battleId: string) => void;
  playerName: string;
}

interface LobbyUser {
  uid: string;
  name: string;
  status: 'idle' | 'busy';
  timestamp: number;
}

const BattleLobby: React.FC<BattleLobbyProps> = ({ onBack, onBattleStart, playerName }) => {
  const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);
  const [pendingBattleId, setPendingBattleId] = useState<string | null>(null);
  const [inviteFrom, setInviteFrom] = useState<{ id: string, name: string } | null>(null);

  // 1. Register presence in Lobby
  useEffect(() => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;
    const lobbyRef = ref(db, `lobby/${myUid}`);

    set(lobbyRef, {
      uid: myUid,
      name: playerName,
      status: 'idle',
      timestamp: Date.now()
    });

    onDisconnect(lobbyRef).remove();

    return () => {
      remove(lobbyRef);
    };
  }, [playerName]);

  // 2. Listen to Lobby Users
  useEffect(() => {
    const lobbyRef = ref(db, 'lobby');
    const unsub = onValue(lobbyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users = Object.values(data) as LobbyUser[];
        // Filter out myself and stale users (>5 mins)
        const active = users.filter(u => 
            u.uid !== auth.currentUser?.uid && 
            (Date.now() - u.timestamp) < 300000
        );
        setOnlineUsers(active);
      } else {
        setOnlineUsers([]);
      }
    });
    return () => unsub();
  }, []);

  // 3. Listen for incoming invites (battles where I am player 2 and status is pending)
  useEffect(() => {
    if (!auth.currentUser) return;
    const battlesRef = ref(db, 'battles');
    
    const unsub = onValue(battlesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const battles = Object.entries(data);
        
        // Check for INVITES
        const myInvite = battles.find(([_, b]: any) => 
            b.player2.uid === auth.currentUser?.uid && b.status === 'pending'
        );

        if (myInvite) {
            setInviteFrom({ id: myInvite[0], name: (myInvite[1] as any).player1.name });
        } else {
            setInviteFrom(null);
        }

        // Check if my created battle was ACCEPTED
        if (pendingBattleId && data[pendingBattleId]) {
            if (data[pendingBattleId].status === 'accepted' || data[pendingBattleId].status === 'betting') {
                onBattleStart(pendingBattleId);
            }
        }
      }
    });

    return () => unsub();
  }, [pendingBattleId, onBattleStart]);

  const sendInvite = async (targetUid: string, targetName: string) => {
    if (!auth.currentUser) return;

    const newBattleRef = push(ref(db, 'battles'));
    const battleId = newBattleRef.key;

    if (battleId) {
        await set(newBattleRef, {
            id: battleId,
            player1: { uid: auth.currentUser.uid, name: playerName, ready: false, score: 0 },
            player2: { uid: targetUid, name: targetName, ready: false, score: 0 },
            status: 'pending',
            bet: { amount: 20, currency: 'coins' }, // Default bet
            startTime: Date.now()
        });
        setPendingBattleId(battleId);
    }
  };

  const acceptInvite = async () => {
    if (inviteFrom) {
        await update(ref(db, `battles/${inviteFrom.id}`), {
            status: 'betting' // Go straight to betting
        });
        onBattleStart(inviteFrom.id);
    }
  };

  const declineInvite = async () => {
    if (inviteFrom) {
        await remove(ref(db, `battles/${inviteFrom.id}`));
        setInviteFrom(null);
    }
  };

  const cancelMyInvite = async () => {
      if (pendingBattleId) {
          await remove(ref(db, `battles/${pendingBattleId}`));
          setPendingBattleId(null);
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700">
            <ArrowLeft />
          </button>
          <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
             <Swords className="text-red-500" /> JANG MAYDONI
          </h2>
          <div className="w-10"></div>
      </div>

      {/* My Pending Invite Status */}
      {pendingBattleId && (
          <div className="w-full max-w-md bg-yellow-500/20 border border-yellow-500 p-4 rounded-xl mb-6 flex justify-between items-center animate-pulse">
              <span className="text-yellow-200 font-bold">Raqib kutilmoqda...</span>
              <button onClick={cancelMyInvite} className="bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/40">Bekor qilish</button>
          </div>
      )}

      {/* Incoming Invite Modal */}
      {inviteFrom && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 border-2 border-neonBlue p-6 rounded-2xl max-w-sm w-full text-center animate-pop shadow-[0_0_30px_rgba(0,243,255,0.3)]">
                  <Swords className="w-12 h-12 text-neonBlue mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">JANG CHAQIRUVI!</h3>
                  <p className="text-gray-300 mb-6"><span className="font-bold text-neonPurple">{inviteFrom.name}</span> sizni jangga chorlamoqda!</p>
                  <div className="flex gap-4">
                      <button onClick={acceptInvite} className="flex-1 bg-green-600 py-3 rounded-xl text-white font-bold hover:bg-green-500">QABUL QILISH</button>
                      <button onClick={declineInvite} className="flex-1 bg-red-600 py-3 rounded-xl text-white font-bold hover:bg-red-500">RAD ETISH</button>
                  </div>
              </div>
          </div>
      )}

      <div className="w-full max-w-md">
          <h3 className="text-gray-400 text-sm mb-4 uppercase font-bold tracking-wider">Onlayn O'yinchilar ({onlineUsers.length})</h3>
          
          {onlineUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-gray-800 rounded-xl">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Hozircha hech kim yo'q. Do'stingizni chaqiring!
              </div>
          ) : (
              <div className="space-y-3">
                  {onlineUsers.map(u => (
                      <div key={u.uid} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700 hover:border-neonBlue transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                  <User className="text-gray-400" />
                              </div>
                              <div>
                                  <p className="text-white font-bold">{u.name}</p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <span className={`w-2 h-2 rounded-full ${u.status === 'idle' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      {u.status === 'idle' ? 'Bo\'sh' : 'O\'yinda'}
                                  </p>
                              </div>
                          </div>
                          <button 
                            onClick={() => sendInvite(u.uid, u.name)}
                            disabled={u.status === 'busy' || !!pendingBattleId}
                            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:from-red-500 hover:to-red-700 disabled:opacity-50"
                          >
                              JANG
                          </button>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default BattleLobby;
