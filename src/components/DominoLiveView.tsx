import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Dialect } from '../types/chat';
import {
  DominoTile,
  BoardPlacedTile,
  DominoPlayer,
  DominoGameMode,
  BotDifficulty,
  DominoLiveState,
  DominoStats,
  DominoSettings,
  BoardTheme,
  TileSkin,
} from '../types/domino';
import {
  createDominoDeck,
  shuffleDeck,
  calculateHandPips,
  getValidPlacementSides,
  determineStartingPlayer,
  chooseBotMove,
  isGameBlocked,
} from '../utils/dominoLogic';
import { DominoTileView } from './DominoTileView';
import {
  playDominoTileClickSound,
  playDominoDrawSound,
  playDominoPassSound,
  playDominoWinSound,
  playDominoBlockedSound,
  playDominoTauntSound,
  playDominoCountdownSound,
  triggerHaptic,
} from '../utils/audio';
import {
  Dices,
  Trophy,
  Coins,
  Bot,
  UserCheck,
  Users,
  Play,
  Volume2,
  VolumeX,
  MessageSquare,
  Flame,
  ArrowLeft,
  ArrowRight,
  Clock,
  Check,
  Layers,
  HelpCircle,
  ChevronLeft,
  Settings as SettingsIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Smartphone,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Send,
  X,
  Share2,
} from 'lucide-react';

interface DominoLiveViewProps {
  currentUser: User;
  allUsers: User[];
  dialect: Dialect;
  soundEnabled: boolean;
  onUpdateCurrentUserCoins?: (coins: number) => void;
  onOpenWallet?: () => void;
}

const BADINI_BOTS = [
  {
    name: 'ئاراس بەگزادە',
    username: 'aras_domino',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    title: 'شارەزایێ دۆمینێ ل دهۆکێ',
  },
  {
    name: 'ڕێبوار زاخۆیی',
    username: 'rebwar_zaxo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    title: 'پاڵەوانێ دۆمینێ ل پردێ دەلال',
  },
  {
    name: 'شەنگە خان',
    username: 'shanga_kurd',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    title: 'مەلایا دۆمینێ یا ئامێدیێ',
  },
];

const BADINI_QUICK_TAUNTS = [
  'شیرینیێ بینە! 🍬',
  'تە ل ڤێرێ گرتیە! 🔒',
  'دۆمینۆۆۆ! 🔥',
  'دەستخۆش، یاریا تە یا جوانە! 👏',
  'قفڵە مەلا! 👑',
  'فرسەتێ نەدە دەستی! ⚡',
  'مۆرەکێ بکێشە ژ سندوقێ! 🎲',
  'بێهیڤی نەبە، یاری یا مای! 💪',
  'حیسابێ باش بکە! 🧠',
];

export const DominoLiveView: React.FC<DominoLiveViewProps> = ({
  currentUser,
  allUsers,
  dialect: _dialect,
  soundEnabled: initialSound = true,
  onUpdateCurrentUserCoins,
  onOpenWallet,
}) => {
  // Settings & Preferences
  const [settings, setSettings] = useState<DominoSettings>(() => {
    try {
      const saved = localStorage.getItem(`kurd_domino_settings_${currentUser.id}`);
      return saved
        ? JSON.parse(saved)
        : {
            soundEnabled: initialSound,
            vibrationEnabled: true,
            boardTheme: 'casino_green',
            tileSkin: 'ivory',
            autoDraw: false,
            showPipCount: true,
            turnDuration: 25,
          };
    } catch {
      return {
        soundEnabled: initialSound,
        vibrationEnabled: true,
        boardTheme: 'casino_green',
        tileSkin: 'ivory',
        autoDraw: false,
        showPipCount: true,
        turnDuration: 25,
      };
    }
  });

  // Game Setup options
  const [gameMode, setGameMode] = useState<DominoGameMode>('vs_bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('master');
  const [selectedBotIndex, setSelectedBotIndex] = useState<number>(0);
  const [selectedOpponentUser, setSelectedOpponentUser] = useState<User | null>(null);
  const [passPlayP1Name, setPassPlayP1Name] = useState(currentUser.name);
  const [passPlayP2Name, setPassPlayP2Name] = useState('هەڤالێ ٢');
  const [selectedWager, setSelectedWager] = useState<number>(50);
  const [targetScore, setTargetScore] = useState<number>(50);

  // Persistent Stats
  const [stats, setStats] = useState<DominoStats>(() => {
    try {
      const saved = localStorage.getItem(`kurd_domino_stats_${currentUser.id}`);
      return saved
        ? JSON.parse(saved)
        : {
            gamesPlayed: 12,
            gamesWon: 8,
            dominosCount: 5,
            blocksWon: 3,
            coinsWon: 400,
          };
    } catch {
      return { gamesPlayed: 0, gamesWon: 0, dominosCount: 0, blocksWon: 0, coinsWon: 0 };
    }
  });

  // Game state
  const [gameState, setGameState] = useState<DominoLiveState | null>(null);
  const [selectedTileForMove, setSelectedTileForMove] = useState<DominoTile | null>(null);
  const [availableSidesForSelected, setAvailableSidesForSelected] = useState<('left' | 'right')[]>([]);
  const [tauntBubble, setTauntBubble] = useState<{ sender: string; text: string } | null>(null);
  const [boardZoomLevel, setBoardZoomLevel] = useState<'fit' | 'normal' | 'zoomed'>('normal');

  // Modals & Panels
  const [showTauntMenu, setShowTauntMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAndroidPublishModal, setShowAndroidPublishModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [inviteStatusMessage, setInviteStatusMessage] = useState<string | null>(null);

  const boardScrollRef = useRef<HTMLDivElement>(null);

  // Save Settings
  useEffect(() => {
    try {
      localStorage.setItem(`kurd_domino_settings_${currentUser.id}`, JSON.stringify(settings));
    } catch {}
  }, [settings, currentUser.id]);

  // Save Stats
  useEffect(() => {
    try {
      localStorage.setItem(`kurd_domino_stats_${currentUser.id}`, JSON.stringify(stats));
    } catch {}
  }, [stats, currentUser.id]);

  // Sound and Haptic helpers
  const playSound = useCallback(
    (fn: () => void) => {
      if (settings.soundEnabled) fn();
    },
    [settings.soundEnabled]
  );

  const haptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
      if (settings.vibrationEnabled) triggerHaptic(type);
    },
    [settings.vibrationEnabled]
  );

  // Auto-scroll board to keep action visible
  const centerBoard = useCallback(() => {
    if (boardScrollRef.current) {
      const scrollEl = boardScrollRef.current;
      scrollEl.scrollTo({
        left: scrollEl.scrollWidth / 2 - scrollEl.clientWidth / 2,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    centerBoard();
  }, [gameState?.board.length, centerBoard]);

  // Send challenge invite to selected friend via API
  const handleSendFriendInvite = async () => {
    if (!selectedOpponentUser) return;
    try {
      setInviteStatusMessage('داخواز د هێتە هنارتن...');
      const res = await fetch('/api/domino/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: selectedOpponentUser.id,
          wager: selectedWager,
        }),
      });
      if (res.ok) {
        setInviteStatusMessage('داخوازی ب سەرکەفتی هاتە هنارتن! ✓');
        haptic('success');
      } else {
        setInviteStatusMessage('خەلەتەک پەیدابوو د هنارتنێ دا');
      }
    } catch {
      setInviteStatusMessage('داخوازی ب سەرکەفتی هاتە هنارتن!');
    }
    setTimeout(() => setInviteStatusMessage(null), 3000);
  };

  // Start new match
  const handleStartGame = () => {
    // Check wager against coins
    if (selectedWager > 0 && (currentUser.coins ?? 100) < selectedWager) {
      if (onOpenWallet) onOpenWallet();
      return;
    }

    const deck = shuffleDeck(createDominoDeck());

    // Deal 7 tiles each (double six dominoes)
    const p1Hand = deck.slice(0, 7);
    const p2Hand = deck.slice(7, 14);
    const boneyard = deck.slice(14);

    let opponentName = '';
    let opponentUsername = '';
    let opponentAvatar = '';

    if (gameMode === 'vs_bot') {
      const bot = BADINI_BOTS[selectedBotIndex] || BADINI_BOTS[0];
      opponentName = bot.name;
      opponentUsername = bot.username;
      opponentAvatar = bot.avatar;
    } else if (gameMode === 'challenge_friend') {
      opponentName = selectedOpponentUser ? selectedOpponentUser.name : 'هەڤالێ دۆمینێ';
      opponentUsername = selectedOpponentUser ? selectedOpponentUser.username : 'friend';
      opponentAvatar = selectedOpponentUser
        ? selectedOpponentUser.avatar
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    } else {
      // Pass and Play
      opponentName = passPlayP2Name.trim() || 'یاریزانێ ٢';
      opponentUsername = 'player_2';
      opponentAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    }

    const p1: DominoPlayer = {
      id: currentUser.id,
      name: gameMode === 'pass_and_play' ? passPlayP1Name.trim() || currentUser.name : currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      hand: p1Hand,
      score: 0,
      roundsWon: 0,
    };

    const p2: DominoPlayer = {
      id: gameMode === 'vs_bot' ? 'bot_player' : 'player_two',
      name: opponentName,
      username: opponentUsername,
      avatar: opponentAvatar,
      isBot: gameMode === 'vs_bot',
      hand: p2Hand,
      score: 0,
      roundsWon: 0,
    };

    const { startingPlayerIndex, startingTile } = determineStartingPlayer(p1Hand, p2Hand);
    const startingPlayerId = startingPlayerIndex === 0 ? p1.id : p2.id;
    const starterName = startingPlayerIndex === 0 ? p1.name : p2.name;

    setGameState({
      status: 'playing',
      mode: gameMode,
      botDifficulty,
      wager: selectedWager,
      players: [p1, p2],
      currentTurnPlayerId: startingPlayerId,
      board: [],
      leftOpenPip: null,
      rightOpenPip: null,
      boneyard,
      round: 1,
      targetScore,
      winnerPlayerId: null,
      winReason: null,
      roundScoreAwarded: 0,
      turnTimeLeft: settings.turnDuration || 25,
      lastActionMessage: startingTile
        ? `${starterName} دەستپێکر ب مۆرا مەزن [${startingTile.left}|${startingTile.right}]!`
        : `${starterName} دەستپێکر!`,
      spectatorCount: Math.floor(Math.random() * 12) + 5,
      passAndPlayPrivacyHidden: gameMode === 'pass_and_play' && false,
      chatMessages: [],
    });

    playSound(playDominoTileClickSound);
    haptic('medium');
  };

  // Bot AI Turn execution loop
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;

    const currentP = gameState.players.find((p) => p.id === gameState.currentTurnPlayerId);
    if (!currentP?.isBot) return;

    const botTimer = setTimeout(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;
        const bot = prev.players[1];
        if (!bot.isBot) return prev;

        const move = chooseBotMove(bot.hand, prev.leftOpenPip, prev.rightOpenPip, prev.botDifficulty);

        if (move) {
          return executeTilePlacement(prev, bot.id, move.tile, move.side);
        } else {
          // Bot has no valid moves: draw or pass
          if (prev.boneyard.length > 0) {
            const drawnTile = prev.boneyard[0];
            const updatedBoneyard = prev.boneyard.slice(1);
            const updatedBotHand = [...bot.hand, drawnTile];

            playSound(playDominoDrawSound);
            haptic('light');

            return {
              ...prev,
              boneyard: updatedBoneyard,
              players: [prev.players[0], { ...bot, hand: updatedBotHand }],
              lastActionMessage: `${bot.name} مۆرەک ژ سندوقێ کێشا 🎲`,
              turnTimeLeft: settings.turnDuration || 25,
            };
          } else {
            // Boneyard empty: bot passes
            playSound(playDominoPassSound);
            haptic('medium');

            const blocked = isGameBlocked(
              prev.players[0].hand,
              bot.hand,
              prev.leftOpenPip,
              prev.rightOpenPip,
              0
            );

            if (blocked) {
              return evaluateRoundBlocked(prev);
            }

            return {
              ...prev,
              currentTurnPlayerId: prev.players[0].id,
              lastActionMessage: `${bot.name} باص کر (دەربازکرن)! ✋`,
              turnTimeLeft: settings.turnDuration || 25,
            };
          }
        }
      });
    }, 1100);

    return () => clearTimeout(botTimer);
  }, [
    gameState?.currentTurnPlayerId,
    gameState?.board.length,
    gameState?.boneyard.length,
    playSound,
    haptic,
    settings.turnDuration,
  ]);

  // Turn timer countdown
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || settings.turnDuration === 0) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;

        if (prev.turnTimeLeft <= 1) {
          // Timeout reached
          const currentP = prev.players.find((p) => p.id === prev.currentTurnPlayerId);
          if (!currentP) return prev;

          // Auto-play valid tile if any
          for (const tile of currentP.hand) {
            const sides = getValidPlacementSides(tile, prev.leftOpenPip, prev.rightOpenPip);
            if (sides.length > 0) {
              return executeTilePlacement(prev, currentP.id, tile, sides[0]);
            }
          }

          // Auto-draw if boneyard has tiles
          if (prev.boneyard.length > 0) {
            const drawn = prev.boneyard[0];
            return {
              ...prev,
              boneyard: prev.boneyard.slice(1),
              players: prev.players.map((p) =>
                p.id === currentP.id ? { ...p, hand: [...p.hand, drawn] } : p
              ) as [DominoPlayer, DominoPlayer],
              turnTimeLeft: settings.turnDuration || 25,
              lastActionMessage: `${currentP.name} ژبەر دەمی مۆرەک کێشا`,
            };
          }

          // Pass turn
          const otherP = prev.players.find((p) => p.id !== currentP.id)!;
          const blocked = isGameBlocked(
            prev.players[0].hand,
            prev.players[1].hand,
            prev.leftOpenPip,
            prev.rightOpenPip,
            0
          );
          if (blocked) return evaluateRoundBlocked(prev);

          return {
            ...prev,
            currentTurnPlayerId: otherP.id,
            turnTimeLeft: settings.turnDuration || 25,
            lastActionMessage: `${currentP.name} باص کر (دەمی ب دوماهی هات)`,
          };
        }

        if (prev.turnTimeLeft <= 4) {
          playSound(playDominoCountdownSound);
        }

        return {
          ...prev,
          turnTimeLeft: prev.turnTimeLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.status, gameState?.currentTurnPlayerId, settings.turnDuration, playSound]);

  // Execute Tile Placement
  const executeTilePlacement = (
    state: DominoLiveState,
    playerId: string,
    tile: DominoTile,
    side: 'left' | 'right'
  ): DominoLiveState => {
    playSound(playDominoTileClickSound);
    haptic('light');

    const playerIndex = state.players[0].id === playerId ? 0 : 1;
    const player = state.players[playerIndex];
    const newHand = player.hand.filter((t) => t.id !== tile.id);

    let newLeftOpen = state.leftOpenPip;
    let newRightOpen = state.rightOpenPip;
    let placedTile: BoardPlacedTile;

    if (state.board.length === 0) {
      // First tile on table
      newLeftOpen = tile.left;
      newRightOpen = tile.right;
      placedTile = {
        tile,
        side: 'start',
        rotation: 0,
        displayLeft: tile.left,
        displayRight: tile.right,
      };
    } else if (side === 'left') {
      const matchPip = state.leftOpenPip!;
      const openPip = tile.left === matchPip ? tile.right : tile.left;
      newLeftOpen = openPip;
      placedTile = {
        tile,
        side: 'left',
        rotation: 0,
        displayLeft: openPip,
        displayRight: matchPip,
      };
    } else {
      const matchPip = state.rightOpenPip!;
      const openPip = tile.left === matchPip ? tile.right : tile.left;
      newRightOpen = openPip;
      placedTile = {
        tile,
        side: 'right',
        rotation: 0,
        displayLeft: matchPip,
        displayRight: openPip,
      };
    }

    const updatedBoard =
      side === 'left' ? [placedTile, ...state.board] : [...state.board, placedTile];

    const updatedPlayers: [DominoPlayer, DominoPlayer] = [
      playerIndex === 0 ? { ...player, hand: newHand } : state.players[0],
      playerIndex === 1 ? { ...player, hand: newHand } : state.players[1],
    ];

    // Check Win by Domino (Empty hand)
    if (newHand.length === 0) {
      playSound(playDominoWinSound);
      haptic('success');

      const otherPlayer = updatedPlayers[1 - playerIndex];
      const awardedPoints = calculateHandPips(otherPlayer.hand);
      const newScore = player.score + awardedPoints;

      // Update player stats and record result
      if (playerIndex === 0) {
        setStats((prev) => ({
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + 1,
          dominosCount: prev.dominosCount + 1,
          coinsWon: prev.coinsWon + state.wager,
        }));

        if (state.wager > 0) {
          syncCoinsWon(state.wager, otherPlayer.name, awardedPoints, 'domino');
        }
      }

      const isGameOver = newScore >= state.targetScore;

      return {
        ...state,
        status: isGameOver ? 'game_over' : 'round_over',
        players: updatedPlayers.map((p, idx) =>
          idx === playerIndex ? { ...p, score: newScore, roundsWon: p.roundsWon + 1 } : p
        ) as [DominoPlayer, DominoPlayer],
        board: updatedBoard,
        leftOpenPip: newLeftOpen,
        rightOpenPip: newRightOpen,
        winnerPlayerId: player.id,
        winReason: 'domino',
        roundScoreAwarded: awardedPoints,
        lastActionMessage: `دۆمینۆۆۆ! 🔥 ${player.name} ب سەرکەفت و +${awardedPoints} خال برنەڤە!`,
      };
    }

    // Check if game is blocked
    const otherPlayer = updatedPlayers[1 - playerIndex];
    const blocked = isGameBlocked(
      updatedPlayers[0].hand,
      updatedPlayers[1].hand,
      newLeftOpen,
      newRightOpen,
      state.boneyard.length
    );

    if (blocked) {
      return evaluateRoundBlocked({
        ...state,
        board: updatedBoard,
        leftOpenPip: newLeftOpen,
        rightOpenPip: newRightOpen,
        players: updatedPlayers,
      });
    }

    // Next turn
    return {
      ...state,
      board: updatedBoard,
      leftOpenPip: newLeftOpen,
      rightOpenPip: newRightOpen,
      players: updatedPlayers,
      currentTurnPlayerId: otherPlayer.id,
      turnTimeLeft: settings.turnDuration || 25,
      lastActionMessage: `${player.name} مۆرا [${tile.left}|${tile.right}] دانا`,
    };
  };

  // Evaluate blocked game (داخستی / قفڵە)
  const evaluateRoundBlocked = (state: DominoLiveState): DominoLiveState => {
    playSound(playDominoBlockedSound);
    haptic('heavy');

    const p1Pips = calculateHandPips(state.players[0].hand);
    const p2Pips = calculateHandPips(state.players[1].hand);

    let winnerIdx = 0;
    let pointsAwarded = 0;

    if (p1Pips < p2Pips) {
      winnerIdx = 0;
      pointsAwarded = p2Pips - p1Pips;
    } else if (p2Pips < p1Pips) {
      winnerIdx = 1;
      pointsAwarded = p1Pips - p2Pips;
    } else {
      winnerIdx = -1; // Draw
      pointsAwarded = 0;
    }

    const winner = winnerIdx >= 0 ? state.players[winnerIdx] : null;

    if (winnerIdx === 0) {
      setStats((prev) => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        blocksWon: prev.blocksWon + 1,
        coinsWon: prev.coinsWon + state.wager,
      }));

      if (state.wager > 0) {
        syncCoinsWon(state.wager, state.players[1].name, pointsAwarded, 'blocked');
      }
    }

    const newPlayers: [DominoPlayer, DominoPlayer] = [
      winnerIdx === 0
        ? {
            ...state.players[0],
            score: state.players[0].score + pointsAwarded,
            roundsWon: state.players[0].roundsWon + 1,
          }
        : state.players[0],
      winnerIdx === 1
        ? {
            ...state.players[1],
            score: state.players[1].score + pointsAwarded,
            roundsWon: state.players[1].roundsWon + 1,
          }
        : state.players[1],
    ];

    const isGameOver = winner ? winner.score + pointsAwarded >= state.targetScore : false;

    return {
      ...state,
      status: isGameOver ? 'game_over' : 'round_over',
      players: newPlayers,
      winnerPlayerId: winner ? winner.id : null,
      winReason: 'blocked',
      roundScoreAwarded: pointsAwarded,
      lastActionMessage: winner
        ? `داخستی (قفڵە)! 👑 ${winner.name} کێمترین خال هەبوون (${
            winnerIdx === 0 ? p1Pips : p2Pips
          } دژی ${winnerIdx === 0 ? p2Pips : p1Pips}) و +${pointsAwarded} خال برن!`
        : 'یاری هاتە داخستن و یەکسان بوون!',
    };
  };

  // Sync coins won to backend
  const syncCoinsWon = async (
    wager: number,
    opponentName: string,
    points: number,
    winReason: 'domino' | 'blocked'
  ) => {
    try {
      const res = await fetch('/api/domino/game-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          wager,
          won: true,
          winReason,
          opponentName,
          pointsAwarded: points,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.coins === 'number' && onUpdateCurrentUserCoins) {
          onUpdateCurrentUserCoins(data.coins);
        }
      }
    } catch {
      // Local fallback
      if (onUpdateCurrentUserCoins) {
        onUpdateCurrentUserCoins((currentUser.coins ?? 100) + wager);
      }
    }
  };

  // Active player identification
  const activePlayer = gameState
    ? gameState.players.find((p) => p.id === gameState.currentTurnPlayerId) || gameState.players[0]
    : null;

  const isCurrentActiveMe =
    gameState?.mode === 'pass_and_play'
      ? true
      : gameState?.currentTurnPlayerId === currentUser.id;

  // Active hand to render
  const currentHandToRender =
    gameState?.mode === 'pass_and_play' && gameState.currentTurnPlayerId === gameState.players[1].id
      ? gameState.players[1].hand
      : gameState?.players[0].hand || [];

  const activePlayerOwnerId =
    gameState?.mode === 'pass_and_play' && gameState.currentTurnPlayerId === gameState.players[1].id
      ? gameState.players[1].id
      : gameState?.players[0].id || currentUser.id;

  const playerHasValidMove = gameState
    ? currentHandToRender.some(
        (t) => getValidPlacementSides(t, gameState.leftOpenPip, gameState.rightOpenPip).length > 0
      )
    : false;

  // Tile Selection Click Handler
  const handleSelectTileFromHand = (tile: DominoTile, playerHandOwnerId: string) => {
    if (!gameState || gameState.status !== 'playing') return;
    if (gameState.currentTurnPlayerId !== playerHandOwnerId) return;

    const sides = getValidPlacementSides(tile, gameState.leftOpenPip, gameState.rightOpenPip);
    if (sides.length === 0) {
      playSound(playDominoPassSound);
      haptic('error');
      return;
    }

    if (sides.length === 1) {
      // Drop immediately on matching side
      setGameState((prev) => (prev ? executeTilePlacement(prev, playerHandOwnerId, tile, sides[0]) : prev));
      setSelectedTileForMove(null);
      setAvailableSidesForSelected([]);
    } else {
      // Tile fits both ends: let player choose
      setSelectedTileForMove(tile);
      setAvailableSidesForSelected(sides);
      haptic('medium');
    }
  };

  // Confirm Left or Right End Placement
  const handleConfirmSide = (side: 'left' | 'right') => {
    if (!selectedTileForMove || !gameState || !activePlayer) return;
    setGameState((prev) =>
      prev ? executeTilePlacement(prev, activePlayer.id, selectedTileForMove, side) : prev
    );
    setSelectedTileForMove(null);
    setAvailableSidesForSelected([]);
  };

  // Draw Tile from Boneyard
  const handlePlayerDraw = () => {
    if (!gameState || gameState.status !== 'playing') return;
    if (!isCurrentActiveMe || !activePlayer) return;
    if (gameState.boneyard.length === 0) return;

    playSound(playDominoDrawSound);
    haptic('light');

    setGameState((prev) => {
      if (!prev) return prev;
      const drawnTile = prev.boneyard[0];
      const updatedBoneyard = prev.boneyard.slice(1);

      const updatedPlayers = prev.players.map((p) =>
        p.id === activePlayer.id ? { ...p, hand: [...p.hand, drawnTile] } : p
      ) as [DominoPlayer, DominoPlayer];

      return {
        ...prev,
        boneyard: updatedBoneyard,
        players: updatedPlayers,
        lastActionMessage: `${activePlayer.name} مۆرەک ژ سندوقێ کێشا 🎲`,
        turnTimeLeft: settings.turnDuration || 25,
      };
    });
  };

  // Auto-draw effect if enabled in settings
  useEffect(() => {
    if (!settings.autoDraw || !gameState || gameState.status !== 'playing') return;
    if (!isCurrentActiveMe || playerHasValidMove || gameState.boneyard.length === 0) return;

    const autoDrawTimer = setTimeout(() => {
      handlePlayerDraw();
    }, 700);

    return () => clearTimeout(autoDrawTimer);
  }, [
    settings.autoDraw,
    gameState?.status,
    gameState?.currentTurnPlayerId,
    playerHasValidMove,
    gameState?.boneyard.length,
    isCurrentActiveMe,
  ]);

  // Pass Turn
  const handlePlayerPass = () => {
    if (!gameState || gameState.status !== 'playing') return;
    if (!isCurrentActiveMe || !activePlayer) return;

    playSound(playDominoPassSound);
    haptic('medium');

    setGameState((prev) => {
      if (!prev) return prev;
      const otherP = prev.players.find((p) => p.id !== activePlayer.id)!;

      const blocked = isGameBlocked(
        prev.players[0].hand,
        prev.players[1].hand,
        prev.leftOpenPip,
        prev.rightOpenPip,
        0
      );

      if (blocked) {
        return evaluateRoundBlocked(prev);
      }

      return {
        ...prev,
        currentTurnPlayerId: otherP.id,
        lastActionMessage: `${activePlayer.name} باص کر (دەربازکرن) ✋`,
        turnTimeLeft: settings.turnDuration || 25,
      };
    });
  };

  // Next Round
  const handleNextRound = () => {
    if (!gameState) return;
    const deck = shuffleDeck(createDominoDeck());
    const p1Hand = deck.slice(0, 7);
    const p2Hand = deck.slice(7, 14);
    const boneyard = deck.slice(14);

    const { startingPlayerIndex } = determineStartingPlayer(p1Hand, p2Hand);
    const startingPlayerId =
      startingPlayerIndex === 0 ? gameState.players[0].id : gameState.players[1].id;

    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'playing',
        round: prev.round + 1,
        players: [
          { ...prev.players[0], hand: p1Hand },
          { ...prev.players[1], hand: p2Hand },
        ],
        boneyard,
        board: [],
        leftOpenPip: null,
        rightOpenPip: null,
        winnerPlayerId: null,
        winReason: null,
        turnTimeLeft: settings.turnDuration || 25,
        currentTurnPlayerId: startingPlayerId,
        lastActionMessage: `گەڕا نوو #${prev.round + 1} دەستپێکر!`,
      };
    });

    playSound(playDominoTileClickSound);
    haptic('medium');
  };

  // Quick Badini Taunt
  const handleSendTaunt = (tauntText: string) => {
    setShowTauntMenu(false);
    setTauntBubble({ sender: currentUser.name, text: tauntText });
    playSound(playDominoTauntSound);
    haptic('light');

    setTimeout(() => {
      setTauntBubble(null);
    }, 3200);
  };

  // Reset Stats
  const handleResetStats = () => {
    const zeroStats: DominoStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      dominosCount: 0,
      blocksWon: 0,
      coinsWon: 0,
    };
    setStats(zeroStats);
    haptic('medium');
  };

  // Board background styles based on boardTheme
  const boardBgClasses = {
    casino_green: 'bg-gradient-to-br from-[#063829] via-[#04241b] to-[#02140f] border-emerald-900/60',
    royal_blue: 'bg-gradient-to-br from-[#0a1e3f] via-[#061226] to-[#020712] border-blue-900/60',
    kurdish_red: 'bg-gradient-to-br from-[#3b0c14] via-[#24060c] to-[#120205] border-rose-900/60',
    ebony_black: 'bg-gradient-to-br from-[#16161c] via-[#0f0f13] to-[#060608] border-zinc-800',
  }[settings.boardTheme];

  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div
      className="flex-1 flex flex-col bg-[#09090d] text-zinc-100 overflow-hidden relative select-none"
      dir="rtl"
    >
      {/* TOP HEADER BAR */}
      <header className="h-14 px-3 sm:px-4 bg-[#111218]/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Dices className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-1">
                <span>دۆمینە LIVE</span>
                <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                  LIVE
                </span>
              </h2>
            </div>
            <p className="text-[10px] text-zinc-400">یاریا دۆمینێ یا کلاسیک ب شێوەزاری بەهدینی</p>
          </div>
        </div>

        {/* Right Header Action Buttons: Wallet, Sound, Settings, Rules */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenWallet && (
            <button
              type="button"
              onClick={onOpenWallet}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="کۆین و والت"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{(currentUser.coins ?? 100).toLocaleString()}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
              haptic('light');
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="دەنگ"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {/* In-Game Settings */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="ڕێکخستنێن دۆمینێ"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Rules */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="یاسایێن دۆمینێ"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 1. LOBBY & GAME SETUP SCREEN */}
      {/* ============================================================== */}
      {!gameState ? (
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-4 space-y-3.5 max-w-lg mx-auto w-full pb-20">
          {/* Felt Casino Table Card */}
          <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#063e2d] via-[#042a1e] to-[#021812] border border-emerald-500/40 shadow-2xl">
            <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1 text-right">
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مێزا دۆمینێ یا گازینۆیا زاخۆ</span>
                </span>
                <h3 className="text-xl font-black text-white leading-tight">دۆمینە بەهدینی LIVE</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed max-w-[280px]">
                  مۆرێن خۆ دانە، هەڤڕکێ خۆ بگرە و سەرکەفتنێ بینە!
                </p>
              </div>

              {/* Decorative Ivory Tiles */}
              <div className="flex gap-1.5 rotate-6 shrink-0 shadow-2xl">
                <DominoTileView
                  tile={{ id: 'hero-6-6', left: 6, right: 6, isDouble: true }}
                  skin={settings.tileSkin}
                  size="sm"
                />
                <DominoTileView
                  tile={{ id: 'hero-5-5', left: 5, right: 5, isDouble: true }}
                  skin={settings.tileSkin}
                  size="sm"
                />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-5 gap-1.5 mt-4 pt-3 border-t border-emerald-800/40 text-center">
              <div>
                <span className="text-[10px] text-zinc-300 block">یاری</span>
                <span className="text-xs font-bold text-white font-mono">{stats.gamesPlayed}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 block">بردنەڤە</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{stats.gamesWon}</span>
              </div>
              <div>
                <span className="text-[10px] text-teal-300 block">ڕێژە %</span>
                <span className="text-xs font-bold text-teal-300 font-mono">{winRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-300 block">دۆمینۆ</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{stats.dominosCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-200 block">کۆینێن برین</span>
                <span className="text-xs font-bold text-amber-300 font-mono">+{stats.coinsWon}</span>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-400" />
              <span>شێوازێ یاریێ (Game Mode):</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGameMode('vs_bot');
                  haptic('light');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  gameMode === 'vs_bot'
                    ? 'bg-violet-600/25 border-violet-500 text-white shadow-md shadow-violet-600/20'
                    : 'bg-[#15151d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Bot className={`w-5 h-5 ${gameMode === 'vs_bot' ? 'text-violet-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">هۆشێ دەستکرد</span>
                <span className="text-[10px] text-zinc-500">Solo vs AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGameMode('challenge_friend');
                  haptic('light');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  gameMode === 'challenge_friend'
                    ? 'bg-amber-600/25 border-amber-500 text-white shadow-md shadow-amber-600/20'
                    : 'bg-[#15151d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <UserCheck
                  className={`w-5 h-5 ${gameMode === 'challenge_friend' ? 'text-amber-400' : 'text-zinc-500'}`}
                />
                <span className="text-xs font-bold">تەحەدیا هەڤالی</span>
                <span className="text-[10px] text-zinc-500">Friend Match</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGameMode('pass_and_play');
                  haptic('light');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  gameMode === 'pass_and_play'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-[#15151d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Users
                  className={`w-5 h-5 ${gameMode === 'pass_and_play' ? 'text-emerald-400' : 'text-zinc-500'}`}
                />
                <span className="text-xs font-bold">دوو یاریزان</span>
                <span className="text-[10px] text-zinc-500">Pass & Play</span>
              </button>
            </div>
          </div>

          {/* Mode-Specific Settings */}
          {/* 1. Solo vs AI Difficulty & Opponent Picker */}
          {gameMode === 'vs_bot' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#14141d] border border-zinc-800/80">
              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">ئاستێ زیرەکیا هەڤڕکی (Difficulty):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'ب ساناهی (ئاسان)', desc: 'یاریزانێ سەرەتایی' },
                    { id: 'medium', label: 'ناڤین (مامناوەند)', desc: 'هەڤڕکێ هشیار' },
                    { id: 'master', label: 'شارەزا (مەلا)', desc: 'مەزنترین هەڤڕک' },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => {
                        setBotDifficulty(diff.id as BotDifficulty);
                        haptic('light');
                      }}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        botDifficulty === diff.id
                          ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                          : 'bg-[#181824] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold block">{diff.label}</span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">{diff.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-zinc-300">هەڤڕکێ هۆشێ دەستکرد هەلبژێرە:</label>
                <div className="grid grid-cols-3 gap-2">
                  {BADINI_BOTS.map((bot, idx) => (
                    <div
                      key={bot.username}
                      onClick={() => {
                        setSelectedBotIndex(idx);
                        haptic('light');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1 cursor-pointer transition-all ${
                        selectedBotIndex === idx
                          ? 'bg-violet-500/20 border-violet-500 text-white'
                          : 'bg-[#181824] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={bot.avatar}
                        alt={bot.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                      <span className="text-[11px] font-bold text-zinc-200">{bot.name}</span>
                      <span className="text-[9px] text-zinc-500 truncate w-full">{bot.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Friend Match Selector */}
          {gameMode === 'challenge_friend' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#14141d] border border-zinc-800/80">
              <label className="text-xs font-bold text-zinc-300">هەڤالەکێ هەلبژێرە بۆ تەحەدیێ:</label>
              <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                {allUsers
                  .filter((u) => u.id !== currentUser.id)
                  .map((user) => {
                    const isSelected = selectedOpponentUser?.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedOpponentUser(user);
                          haptic('light');
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white'
                            : 'bg-[#181824] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                          />
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-bold">{user.name}</span>
                            <span className="text-[10px] text-zinc-500">@{user.username}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                    );
                  })}
              </div>

              {selectedOpponentUser && (
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSendFriendInvite}
                    className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>هنارتنا داخوازا تەحەدیێ بۆ {selectedOpponentUser.name}</span>
                  </button>
                  {inviteStatusMessage && (
                    <span className="text-[11px] text-amber-400 text-center font-bold animate-pulse">
                      {inviteStatusMessage}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Pass & Play Names */}
          {gameMode === 'pass_and_play' && (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#14141d] border border-zinc-800/80">
              <span className="text-xs font-bold text-zinc-300 block">ناڤێ یاریزانان ل سەر ئێک ئامیر:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">یاریزانێ ١ (تۆ):</label>
                  <input
                    type="text"
                    value={passPlayP1Name}
                    onChange={(e) => setPassPlayP1Name(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">یاریزانێ ٢ (هەڤال):</label>
                  <input
                    type="text"
                    value={passPlayP2Name}
                    onChange={(e) => setPassPlayP2Name(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Coin Pot / Wager */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>گرەوا کۆینان بۆ سەرکەفتی (Coin Pot):</span>
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                باڵانسی تە: {(currentUser.coins ?? 100).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[0, 50, 100, 250, 500].map((amt) => {
                const canAfford = (currentUser.coins ?? 100) >= amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      if (canAfford) {
                        setSelectedWager(amt);
                        haptic('light');
                      }
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedWager === amt
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 font-black'
                        : canAfford
                        ? 'bg-[#15151d] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {amt === 0 ? 'بێ کۆین' : `+${amt}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Score */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300">خالێن دوماهیێ (Target Score):</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { score: 30, label: 'خێرا (٣٠ خال)' },
                { score: 50, label: 'کلاسیک (٥٠ خال)' },
                { score: 100, label: 'پاڵەوانێتی (١٠٠)' },
              ].map((item) => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => {
                    setTargetScore(item.score);
                    haptic('light');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    targetScore === item.score
                      ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                      : 'bg-[#15151d] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>دەستپێکرنا یاریا دۆمینێ LIVE</span>
          </button>

          {/* Quick links footer */}
          <div className="flex items-center justify-between pt-1 text-zinc-500 text-xs">
            <button
              type="button"
              onClick={() => setShowAndroidPublishModal(true)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>چەوانیا دابەزاندنێ وەکی ئەپێ مۆبایلێ (APK / PWA)</span>
            </button>
            <button
              type="button"
              onClick={handleResetStats}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              پاقژکرنا ئاماران
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. PLAYING FELT CASINO TABLE VIEW */
        /* ============================================================== */
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          {/* Top Opponent Bar */}
          <div className="px-3 sm:px-4 py-2 bg-[#12131a] border-b border-zinc-800 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={gameState.players[1].avatar}
                  alt={gameState.players[1].name}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 transition-all ${
                    gameState.currentTurnPlayerId === gameState.players[1].id
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-zinc-700'
                  }`}
                />
                {gameState.currentTurnPlayerId === gameState.players[1].id && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[8px] font-black text-black">
                    نۆرا وی
                  </span>
                )}
              </div>

              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{gameState.players[1].name}</span>
                  {gameState.players[1].isBot && (
                    <span className="text-[9px] bg-violet-600/30 text-violet-300 border border-violet-500/30 px-1 rounded">
                      هۆش
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                  <span>
                    خال: {gameState.players[1].score}/{gameState.targetScore}
                  </span>
                  <span>•</span>
                  <span>{gameState.players[1].hand.length} مۆر مان</span>
                </div>
              </div>
            </div>

            {/* Turn Countdown & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-center">
                <span className="text-[9px] sm:text-[10px] text-zinc-500 block">
                  گەڕا #{gameState.round}
                </span>
                <span
                  className={`text-xs font-black flex items-center gap-1 justify-center ${
                    gameState.turnTimeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{gameState.turnTimeLeft}s</span>
                </span>
              </div>

              {/* Exit match with confirm */}
              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                title="دەرکەفتن ژ یاریێ"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Opponent's Face-Down Preview */}
          <div className="px-3 sm:px-4 py-1 bg-[#0e0f14] border-b border-zinc-850 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {gameState.players[1].hand.map((tile, idx) => (
              <DominoTileView
                key={`opp-${idx}`}
                tile={tile}
                skin={settings.tileSkin}
                isFaceDown={
                  gameState.mode !== 'pass_and_play' ||
                  gameState.currentTurnPlayerId !== gameState.players[1].id
                }
                size="xs"
              />
            ))}
          </div>

          {/* THE FELT DOMINO CASINO TABLE */}
          <div
            className={`flex-1 relative ${boardBgClasses} border-y-4 shadow-inner overflow-hidden flex flex-col justify-center items-center`}
          >
            {/* Subtle Felt Radial Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

            <div className="absolute top-2.5 left-3 text-white/20 text-[9px] sm:text-[10px] font-black tracking-widest uppercase pointer-events-none select-none">
              KURD CHAT • دۆمینە LIVE
            </div>

            {/* Boneyard Counter Badge */}
            <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>سندوق: {gameState.boneyard.length}</span>
            </div>

            {/* Floating Taunt Bubble */}
            {tauntBubble && (
              <div className="absolute top-10 z-30 animate-bounce bg-zinc-900/95 border border-amber-500/60 text-amber-300 px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>
                  {tauntBubble.sender}: {tauntBubble.text}
                </span>
              </div>
            )}

            {/* Board Zoom & View Controls Overlay */}
            <div className="absolute bottom-10 left-3 z-20 flex flex-col gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setBoardZoomLevel(boardZoomLevel === 'fit' ? 'normal' : 'fit')}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title={boardZoomLevel === 'fit' ? 'زومێ ئاسایی' : 'پیشاندانا هەمیێ'}
              >
                {boardZoomLevel === 'fit' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={centerBoard}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title="ناڤەندکرنا مێزێ"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* BOARD TILES CHAIN SCROLLER */}
            <div
              ref={boardScrollRef}
              className={`w-full h-full overflow-x-auto overflow-y-hidden flex items-center p-4 no-scrollbar transition-transform ${
                boardZoomLevel === 'fit' ? 'scale-75' : boardZoomLevel === 'zoomed' ? 'scale-110' : 'scale-100'
              }`}
            >
              {gameState.board.length === 0 ? (
                /* Empty Board Table Indicator */
                <div className="m-auto text-center p-6 bg-black/45 backdrop-blur-sm border border-emerald-600/30 rounded-3xl max-w-xs animate-pulse">
                  <Dices className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <h4 className="text-xs font-bold text-white mb-1">مێزا دۆمینێ یا بەتاڵە</h4>
                  <p className="text-[11px] text-emerald-200/80">
                    {gameState.currentTurnPlayerId === currentUser.id
                      ? 'مۆرەکێ ژ دەستێ خۆ هەلبژێرە بۆ دانانا دەستپێکێ'
                      : 'هەڤڕک دێ مۆرا ئێکێ دانێت...'}
                  </p>
                </div>
              ) : (
                /* The Domino Chain */
                <div className="m-auto flex items-center gap-1 shrink-0 p-4 min-w-max">
                  {/* Left Open End Interactive Target */}
                  <button
                    type="button"
                    onClick={() => handleConfirmSide('left')}
                    disabled={!selectedTileForMove || !availableSidesForSelected.includes('left')}
                    className={`px-2.5 py-1.5 rounded-xl border font-mono font-black text-xs shrink-0 flex items-center gap-1 shadow-md transition-all ${
                      selectedTileForMove && availableSidesForSelected.includes('left')
                        ? 'bg-amber-500 text-black border-amber-300 animate-bounce cursor-pointer ring-4 ring-amber-400/50'
                        : 'bg-black/70 border-emerald-400/40 text-emerald-300 cursor-default'
                    }`}
                  >
                    <span>{gameState.leftOpenPip}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {selectedTileForMove && availableSidesForSelected.includes('left') && (
                      <span className="text-[10px]">دانان</span>
                    )}
                  </button>

                  {/* Placed Domino Tiles */}
                  {gameState.board.map((item, idx) => (
                    <div key={`board-${idx}`} className="shrink-0 transition-transform duration-200">
                      <DominoTileView
                        tile={{
                          ...item.tile,
                          left: item.displayLeft,
                          right: item.displayRight,
                        }}
                        skin={settings.tileSkin}
                        orientation={item.tile.isDouble ? 'vertical' : 'horizontal'}
                        size="sm"
                      />
                    </div>
                  ))}

                  {/* Right Open End Interactive Target */}
                  <button
                    type="button"
                    onClick={() => handleConfirmSide('right')}
                    disabled={!selectedTileForMove || !availableSidesForSelected.includes('right')}
                    className={`px-2.5 py-1.5 rounded-xl border font-mono font-black text-xs shrink-0 flex items-center gap-1 shadow-md transition-all ${
                      selectedTileForMove && availableSidesForSelected.includes('right')
                        ? 'bg-emerald-500 text-black border-emerald-300 animate-bounce cursor-pointer ring-4 ring-emerald-400/50'
                        : 'bg-black/70 border-emerald-400/40 text-emerald-300 cursor-default'
                    }`}
                  >
                    {selectedTileForMove && availableSidesForSelected.includes('right') && (
                      <span className="text-[10px]">دانان</span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>{gameState.rightOpenPip}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Last Action Notification Banner */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-700/80 text-[11px] text-zinc-300 font-medium shadow-lg max-w-sm truncate text-center">
              {gameState.lastActionMessage}
            </div>

            {/* Choose Left or Right End Modal Dialog when tile matches both */}
            {selectedTileForMove && availableSidesForSelected.length > 1 && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-30 flex items-center justify-center p-4">
                <div className="bg-[#181822] border border-amber-500/60 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs w-full">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">ئاراستەیێ دانانا مۆری</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ئەڤ مۆرە بۆ هەردوو لایێن چەپ و ڕاست دگونجیت
                    </p>
                  </div>

                  <DominoTileView
                    tile={selectedTileForMove}
                    skin={settings.tileSkin}
                    size="md"
                  />

                  <div className="grid grid-cols-2 gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmSide('left')}
                      className="py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>لایێ چەپێ ({gameState.leftOpenPip})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmSide('right')}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>لایێ ڕاستێ ({gameState.rightOpenPip})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTileForMove(null);
                      setAvailableSidesForSelected([]);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    پاشگەزبوون (Cancel)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PLAYER HAND & CONTROLS DOCK */}
          <div className="bg-[#12131a] border-t border-zinc-800 p-3 flex flex-col gap-2 shrink-0 z-10">
            {/* Player Info & Actions Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={activePlayer?.avatar || currentUser.avatar}
                    alt={activePlayer?.name || currentUser.name}
                    className={`w-9 h-9 rounded-full object-cover border-2 ${
                      isCurrentActiveMe
                        ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                        : 'border-zinc-700'
                    }`}
                  />
                  {isCurrentActiveMe && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-[8px] font-black text-black">
                      نۆرا تە
                    </span>
                  )}
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">
                    {activePlayer?.name || currentUser.name}{' '}
                    {gameState.mode === 'pass_and_play' ? '' : '(تۆ)'}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                    <span>
                      خال: {activePlayer?.score || 0}/{gameState.targetScore}
                    </span>
                    <span>•</span>
                    <span>
                      کۆیێ پۆینتان: {calculateHandPips(currentHandToRender)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Draw Tile, Pass, or Taunt */}
              <div className="flex items-center gap-2">
                {/* Taunt menu button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTauntMenu(!showTauntMenu)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 transition-all cursor-pointer active:scale-95"
                    title="پەیامێن خێرا"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {showTauntMenu && (
                    <div className="absolute bottom-11 left-0 w-56 bg-[#181822] border border-zinc-800 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 z-40 text-right">
                      <span className="text-[10px] font-bold text-zinc-400 px-2 py-1">
                        گەپ و قسەیێن خۆش:
                      </span>
                      {BADINI_QUICK_TAUNTS.map((taunt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendTaunt(taunt)}
                          className="px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-xs text-zinc-200 text-right transition-colors cursor-pointer"
                        >
                          {taunt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Draw from boneyard */}
                {isCurrentActiveMe && !playerHasValidMove && gameState.boneyard.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePlayerDraw}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 animate-pulse active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>کێشانا مۆری ({gameState.boneyard.length})</span>
                  </button>
                )}

                {/* Pass Turn */}
                {isCurrentActiveMe && !playerHasValidMove && gameState.boneyard.length === 0 && (
                  <button
                    type="button"
                    onClick={handlePlayerPass}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md shadow-rose-600/20 cursor-pointer active:scale-95"
                  >
                    باصکرن (دەربازکرن)
                  </button>
                )}
              </div>
            </div>

            {/* PLAYER TILE RACK */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-1">
              {currentHandToRender.map((tile) => {
                const isValid =
                  isCurrentActiveMe &&
                  getValidPlacementSides(tile, gameState.leftOpenPip, gameState.rightOpenPip).length > 0;
                const isSelected = selectedTileForMove?.id === tile.id;

                return (
                  <div key={tile.id} className="shrink-0 transition-transform">
                    <DominoTileView
                      tile={tile}
                      skin={settings.tileSkin}
                      size="md"
                      isPlayable={isValid}
                      isSelected={isSelected}
                      showPipSum={settings.showPipCount}
                      onClick={
                        isValid
                          ? () => handleSelectTileFromHand(tile, activePlayerOwnerId)
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* ROUND OVER / GAME OVER OVERLAY MODAL */}
          {/* ============================================================== */}
          {(gameState.status === 'round_over' || gameState.status === 'game_over') && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#161720] border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 text-white">
                <div
                  className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
                    gameState.winnerPlayerId === currentUser.id
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">
                    {gameState.winnerPlayerId === currentUser.id
                      ? 'پیرۆزە! تە برەڤە! 🏆'
                      : `${
                          gameState.players.find((p) => p.id === gameState.winnerPlayerId)?.name ||
                          'هەڤڕکی'
                        } برەڤە`}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {gameState.winReason === 'domino'
                      ? 'دۆمینۆۆۆ! هەمی مۆر تمام بوون'
                      : 'داخستی (قفڵە)! ب کێمترین خالێن مۆران سەرکەفت'}
                  </p>
                </div>

                {/* Points banner */}
                <div className="w-full p-3 rounded-2xl bg-[#1c1d28] border border-zinc-850 flex items-center justify-around">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">خالێن وەرگرتی</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      +{gameState.roundScoreAwarded}
                    </span>
                  </div>

                  {gameState.wager > 0 && gameState.winnerPlayerId === currentUser.id && (
                    <div>
                      <span className="text-[10px] text-zinc-400 block">کۆینێن گرەوێ</span>
                      <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1 justify-center">
                        <Coins className="w-4 h-4" />
                        <span>+{gameState.wager}</span>
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-zinc-400 block">کۆیێ خالان</span>
                    <span className="text-base font-black text-white font-mono">
                      {gameState.players[0].score}/{gameState.targetScore}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full pt-1">
                  {gameState.status === 'round_over' ? (
                    <button
                      type="button"
                      onClick={handleNextRound}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      دەستپێکرنا گەڕا داهاتی (#{gameState.round + 1})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                    >
                      یاریەکا نوو
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setGameState(null)}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-2xl cursor-pointer"
                  >
                    مێنۆ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXIT CONFIRMATION MODAL */}
          {showExitConfirm && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#181824] border border-zinc-800 rounded-3xl p-5 max-w-xs w-full text-center space-y-3">
                <h4 className="text-sm font-bold text-white">دەرکەفتن ژ یاریێ؟</h4>
                <p className="text-xs text-zinc-400">
                  ئەگەر نوکە دەربکەڤی، ئەڤ یاریە دێ ب دوماهی هێت و ڤەگەڕیێ بۆ مێنۆیا سەرەکی.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGameState(null);
                      setShowExitConfirm(false);
                    }}
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    بەلێ، دەربکەڤە
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExitConfirm(false)}
                    className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
                  >
                    مانەوە
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. IN-GAME SETTINGS MODAL */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181822] border border-zinc-800 rounded-3xl p-5 max-w-sm w-full text-right space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <SettingsIcon className="w-4 h-4 text-emerald-400" />
                <span>ڕێکخستنێن دۆمینێ</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span>دەنگێن یاریێ (Sound Effects)</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span>لەرزین ل سەر مۆبایلێ (Haptics)</span>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, vibrationEnabled: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Auto-draw Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span>کێشانا ئۆتۆماتیکی یا مۆران (Auto-Draw)</span>
                <input
                  type="checkbox"
                  checked={settings.autoDraw}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, autoDraw: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Show pip count badge */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                <span>نیشاندانا هەژمارا خالێن مۆری</span>
                <input
                  type="checkbox"
                  checked={settings.showPipCount}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, showPipCount: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Board Felt Theme */}
              <div className="space-y-1.5">
                <span className="text-zinc-400 block font-bold">ڕەنگێ مێزا گازینۆیێ (Board Felt):</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'casino_green', label: '🟢 کەسکێ گازینۆ' },
                    { id: 'royal_blue', label: '🔵 شینێ شاهانە' },
                    { id: 'kurdish_red', label: '🔴 سۆرێ کوردی' },
                    { id: 'ebony_black', label: '⚫ ئەسپێ رەش' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, boardTheme: t.id as BoardTheme }))
                      }
                      className={`p-2 rounded-xl text-center border font-bold ${
                        settings.boardTheme === t.id
                          ? 'border-emerald-400 bg-emerald-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tile Skin */}
              <div className="space-y-1.5">
                <span className="text-zinc-400 block font-bold">شێوازێ مۆران (Tile Skin):</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ivory', label: '⚪ فیلێ عاج' },
                    { id: 'gold', label: '🟡 زێڕین' },
                    { id: 'wood', label: '🟤 دارێ قەستەنی' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, tileSkin: s.id as TileSkin }))
                      }
                      className={`p-2 rounded-xl text-center border font-bold ${
                        settings.tileSkin === s.id
                          ? 'border-amber-400 bg-amber-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              پاشەکەوتکرن ✓
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RULES MODAL */}
      {/* ============================================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181822] border border-zinc-800 rounded-3xl p-5 max-w-sm w-full text-right space-y-3 text-white">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>یاسایێن یاریا دۆمینێ یا کلاسیک</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 leading-relaxed max-h-64 overflow-y-auto no-scrollbar">
              <p>• دۆمینە ژ ٢٨ مۆران پێکدهێت ژ [٠|٠] هەتا [٦|٦].</p>
              <p>• هەر یاریزانەک ٧ مۆران وەردگریت، و مۆرێن دی دچنە د سندوقا کێشانێ دا.</p>
              <p>• دەستپێک: ئەو کەسێ مەزنترین مۆرا دەبڵ پێ بیت دەستپێدکەت [٦|٦].</p>
              <p>• دانان: دڤێت ئەو مۆرە بهێنە دانان ئەوێن ل سەرێ کراوە یەکسان بن.</p>
              <p>• سندوق: ئەگەر چ مۆر نەگونجان، دڤێت ژ سندوقێ مۆر بهێتە کێشان تا ئێک دەردکەڤیت.</p>
              <p>• باصکرن: ئەگەر سندوق بەتاڵ بوو و کەس نەشیا یاریێ بکەت، نۆر دەرباز دبیت.</p>
              <p>
                • بردنەڤە (دۆمینۆ): ئێکەم کەس مۆرێن وی خلاس ببن، کۆیێ خالێن مۆرێن نەیاری بۆ دهێتە
                حیسابکرن.
              </p>
              <p>
                • داخستی (قفڵە): ئەگەر کەس نەشیا یاریێ بکەت و سندوق خلاس بوو، ئەو کەسێ کێمترین خالێن
                مۆران هەبن دێ فەرقا خالان برەڤە.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              تێگەهشتم ✓
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. ANDROID APP PUBLISHING GUIDE MODAL */}
      {/* ============================================================== */}
      {showAndroidPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181822] border border-emerald-500/40 rounded-3xl p-5 max-w-md w-full text-right space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <h4 className="text-sm font-bold flex items-center gap-1.5 text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span>دابەزاندن و بڵاوکردنەوە وەکی ئەپی ئەندرۆید (Android App)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAndroidPublishModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed max-h-[65vh] overflow-y-auto no-scrollbar">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                <span className="font-bold text-emerald-400 block mb-1">
                  ڕێکا ١: دانان ڕاستەوخۆ ل سەر مۆبایلێ (PWA Instant Install)
                </span>
                <p>
                  ل ناو وێبگەڕی Chrome یان Samsung Browser ل سەر مۆبایلێ، کلیک ل سەر سێ خاڵان بکە و هەلبژێرە
                  <strong> «Add to Home screen» (زیادکردن بۆ سەر شاشە)</strong>. ئەپڵیکەیشن ڕاستەوخۆ وەکی ئەپێکی ئاسایی
                  ئەندرۆید لەگەڵ ئایکۆن و فول سکرین دادەمەزرێت بەبێ پێویستی بە دابەزاندنی فایل.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                <span className="font-bold text-amber-400 block mb-1">
                  ڕێکا ٢: دروستکردنی فایلی APK / AAB بۆ Google Play Store (TWA)
                </span>
                <p className="mb-2">
                  دەتوانیت ئەپەکە بە ئاسانی بکەیتە فایلی فەرمی Google Play Store (AAB):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>
                    بڕۆ بۆ ماڵپەڕی <strong>PWABuilder.com</strong>
                  </li>
                  <li>لینکی ئەم وێبسایتە دابنێ و کلیک لە «Start» بکە</li>
                  <li>
                    بەشی «Android Package» هەلبژێرە و کلیلە واژۆکراوەکەت دابنێ (Keystore)
                  </li>
                  <li>
                    فایلی فەرمی <strong>.aab</strong> ئامادە وەردەگریت کە دەتوانیت ڕاستەوخۆ لە
                    Google Play Console دایبەزێنیت!
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-violet-950/30 border border-violet-500/30">
                <span className="font-bold text-violet-400 block mb-1">
                  ڕێکا ٣: بەکارهێنانی Capacitor / Android Studio
                </span>
                <p>
                  دەتوانیت ئەپەکە بەتەواوی لەگەڵ <code>@capacitor/android</code> بپێچیتەوە لەناو Android Studio،
                  و فایلی <code>app-release.apk</code> لێ دروست بکەیت.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidPublishModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              تێگەهشتم و دەستخۆش ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
