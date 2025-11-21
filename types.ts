
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
  SHOP = 'SHOP'
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
