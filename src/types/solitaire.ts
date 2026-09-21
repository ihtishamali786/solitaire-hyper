export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string;
  suit: Suit;
  value: number;
  isFaceUp: boolean;
}

export type PileType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: Card[][];
  score: number;
  moves: number;
  timeElapsed: number;
  drawMode: 1 | 3;
  vegasMode: boolean;
  isWon: boolean;
  hintsUsed: number;
  gameId: string;
  isDaily: boolean;
  dailyDate?: string;
}

export interface MoveHistory {
  state: GameState;
  description: string;
}

export interface HintResult {
  from: { type: PileType; colIndex?: number; cardIndex?: number; card: Card };
  to: { type: PileType; colIndex?: number };
  explanation: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  bgGradient: string;
  accentColor: string;
  feltColor: string;
  cardBackPattern: 'classic' | 'emerald' | 'sapphire' | 'amethyst' | 'crest' | 'gold3d' | 'velvet' | 'blossom' | 'baroque' | 'gothic';
  price: number;
  isVIP?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
  rewardCoins: number;
}

export interface UserStatistics {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  fastestWinSeconds: number | null;
  fewestMovesWin: number | null;
  totalHintsUsed: number;
  vegasBankroll: number;
  dailyStreak: number;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  defaultDrawMode: 1 | 3;
  defaultVegasScoring: boolean;
  activeThemeId: string;
  notificationsEnabled: boolean;
  geminiApiKey?: string;
}
