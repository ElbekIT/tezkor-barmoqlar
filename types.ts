
export interface ScoreEntry {
  id?: string;
  name: string;
  score: number;
  timestamp: number;
  aiComment?: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
  CHAT = 'CHAT',
  CRASH = 'CRASH',
  WHEEL = 'WHEEL',
  SHOP = 'SHOP',
  DESIGN_SHOP = 'DESIGN_SHOP',
  CHECK_SCANNER = 'CHECK_SCANNER',
  BATTLE_LOBBY = 'BATTLE_LOBBY',
  BATTLE_ARENA = 'BATTLE_ARENA'
}

export interface Target {
  id: number;
  x: number; // Percentage
  y: number; // Percentage
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  uid: string;
}

export interface UserProfile {
  coins: number;
  diamonds: number;
  unlockedChannel: boolean;
  telegramId?: string;
}

export interface BattleSession {
  id: string;
  player1: { uid: string; name: string; ready: boolean; score: number };
  player2: { uid: string; name: string; ready: boolean; score: number };
  status: 'pending' | 'accepted' | 'betting' | 'countdown' | 'playing' | 'finished';
  bet: { amount: number; currency: 'coins' | 'diamonds' };
  startTime?: number;
  winner?: string;
}
