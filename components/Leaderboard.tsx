import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { ScoreEntry } from '../types';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scoresRef = ref(db, 'scores');
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(50));

    const unsubscribe = onValue(topScoresQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scoresArray: ScoreEntry[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort descending (highest first)
        scoresArray.sort((a, b) => b.score - a.score);
        setScores(scoresArray);
      } else {
        setScores([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-mono font-bold text-gray-500">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
            TOP O'YINCHILAR
          </h2>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center text-gray-500 py-20 text-lg">
            Hozircha natijalar yo'q. Birinchi bo'ling!
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {scores.map((entry, index) => (
              <div 
                key={entry.id || index}
                className={`flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm ${index === 0 ? 'shadow-[0_0_15px_rgba(250,204,21,0.3)] border-yellow-500/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg truncate max-w-[150px] md:max-w-[300px]">
                      {entry.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-black text-neonBlue">
                      {entry.score}
                    </span>
                    {entry.aiComment && (
                        <span className="block text-[10px] text-neonPurple italic max-w-[150px] md:max-w-[200px] truncate">
                            "{entry.aiComment}"
                        </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
