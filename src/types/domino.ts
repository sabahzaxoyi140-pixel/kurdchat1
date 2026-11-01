export interface DominoTile {
  id: string;
  left: number;
  right: number;
  isDouble: boolean;
}

export interface BoardPlacedTile {
  tile: DominoTile;
  side: 'left' | 'right' | 'start';
  rotation: 0 | 90 | 180 | 270;
  displayLeft: number;
  displayRight: number;
}

export interface DominoPlayer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isBot?: boolean;
  hand: DominoTile[];
  score: number;
  roundsWon: number;
}

export type DominoGameMode = 'vs_bot' | 'challenge_friend' | 'pass_and_play';
export type BotDifficulty = 'easy' | 'medium' | 'master';
export type DominoGameStatus = 'lobby' | 'playing' | 'round_over' | 'game_over';

export type BoardTheme = 'casino_green' | 'royal_blue' | 'kurdish_red' | 'ebony_black';
export type TileSkin = 'ivory' | 'gold' | 'wood';

export interface DominoSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  boardTheme: BoardTheme;
  tileSkin: TileSkin;
  autoDraw: boolean;
  showPipCount: boolean;
  turnDuration: number; // in seconds: 15, 25, 45, or 0 (unlimited)
}

export interface DominoLiveState {
  status: DominoGameStatus;
  mode: DominoGameMode;
  botDifficulty: BotDifficulty;
  wager: number;
  players: [DominoPlayer, DominoPlayer];
  currentTurnPlayerId: string;
  board: BoardPlacedTile[];
  leftOpenPip: number | null;
  rightOpenPip: number | null;
  boneyard: DominoTile[];
  round: number;
  targetScore: number;
  winnerPlayerId: string | null;
  winReason: 'domino' | 'blocked' | null;
  roundScoreAwarded: number;
  turnTimeLeft: number;
  lastActionMessage: string;
  spectatorCount: number;
  passAndPlayPrivacyHidden?: boolean;
  chatMessages: {
    id: string;
    senderName: string;
    text: string;
    isTaunt?: boolean;
    timestamp: string;
  }[];
}

export interface DominoStats {
  gamesPlayed: number;
  gamesWon: number;
  dominosCount: number;
  blocksWon: number;
  coinsWon: number;
}
