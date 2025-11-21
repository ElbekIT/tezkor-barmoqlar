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
  LEADERBOARD = 'LEADERBOARD'
}

export interface Target {
  id: number;
  x: number; // Percentage
  y: number; // Percentage
  color: string;
}
