import { DominoTile, BotDifficulty } from '../types/domino';

// Generate complete 28-tile double-six domino set ([0|0] through [6|6])
export function createDominoDeck(): DominoTile[] {
  const deck: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      deck.push({
        id: `${i}-${j}`,
        left: i,
        right: j,
        isDouble: i === j,
      });
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: DominoTile[]): DominoTile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate sum of pips in hand
export function calculateHandPips(hand: DominoTile[]): number {
  return hand.reduce((sum, tile) => sum + tile.left + tile.right, 0);
}

// Check which ends a tile can match
export function getValidPlacementSides(
  tile: DominoTile,
  leftOpenPip: number | null,
  rightOpenPip: number | null
): ('left' | 'right')[] {
  if (leftOpenPip === null && rightOpenPip === null) {
    return ['left']; // Starting tile can be placed anywhere on board
  }

  const sides: ('left' | 'right')[] = [];
  if (leftOpenPip !== null && (tile.left === leftOpenPip || tile.right === leftOpenPip)) {
    sides.push('left');
  }
  if (rightOpenPip !== null && (tile.left === rightOpenPip || tile.right === rightOpenPip)) {
    sides.push('right');
  }
  return sides;
}

// Determine who starts the match (highest double from [6|6] down, or highest total tile)
export function determineStartingPlayer(
  handA: DominoTile[],
  handB: DominoTile[]
): { startingPlayerIndex: 0 | 1; startingTile: DominoTile | null } {
  // Check doubles from [6|6] down to [0|0]
  for (let d = 6; d >= 0; d--) {
    const hasA = handA.find((t) => t.left === d && t.right === d);
    const hasB = handB.find((t) => t.left === d && t.right === d);
    if (hasA && !hasB) return { startingPlayerIndex: 0, startingTile: hasA };
    if (hasB && !hasA) return { startingPlayerIndex: 1, startingTile: hasB };
  }

  // Fallback to highest tile sum
  const maxA = [...handA].sort((x, y) => y.left + y.right - (x.left + x.right))[0];
  const maxB = [...handB].sort((x, y) => y.left + y.right - (x.left + x.right))[0];

  const sumA = (maxA?.left ?? 0) + (maxA?.right ?? 0);
  const sumB = (maxB?.left ?? 0) + (maxB?.right ?? 0);

  if (sumA >= sumB) {
    return { startingPlayerIndex: 0, startingTile: maxA || null };
  }
  return { startingPlayerIndex: 1, startingTile: maxB || null };
}

// Count how many tiles in a hand contain a specific pip number
export function countPipInHand(hand: DominoTile[], pip: number): number {
  return hand.filter((t) => t.left === pip || t.right === pip).length;
}

// Smart Bot AI Move Picker
export function chooseBotMove(
  botHand: DominoTile[],
  leftOpenPip: number | null,
  rightOpenPip: number | null,
  difficulty: BotDifficulty = 'medium'
): { tile: DominoTile; side: 'left' | 'right' } | null {
  const validMoves: { tile: DominoTile; side: 'left' | 'right' }[] = [];

  for (const tile of botHand) {
    const sides = getValidPlacementSides(tile, leftOpenPip, rightOpenPip);
    for (const side of sides) {
      validMoves.push({ tile, side });
    }
  }

  if (validMoves.length === 0) return null;

  // 1. Easy difficulty (ب ساناهی): pick a random valid move
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  // 2. Medium difficulty (مامناوەند / ناڤین): play highest double, then heaviest pip tile
  if (difficulty === 'medium') {
    validMoves.sort((a, b) => {
      if (a.tile.isDouble && !b.tile.isDouble) return -1;
      if (!a.tile.isDouble && b.tile.isDouble) return 1;
      return b.tile.left + b.tile.right - (a.tile.left + a.tile.right);
    });
    return validMoves[0];
  }

  // 3. Master / Mela difficulty (شارەزا / مەلا):
  // Advanced Kurdish domino strategy:
  // - Starts with the strongest double
  // - Rewards keeping numbers that the bot holds dominance in (+12 per matching tile in hand)
  // - Discards heavy doubles early to avoid massive point loss if blocked
  // - Heavily penalizes leaving an end where bot has 0 tiles (-25)
  // - Favors shedding highest pip weight
  const scoredMoves = validMoves.map((m) => {
    let score = 0;
    const { tile, side } = m;

    if (leftOpenPip === null && rightOpenPip === null) {
      // First move: prefer starting with heaviest double
      score += tile.isDouble ? 60 : 25;
      score += tile.left + tile.right;
      return { move: m, score };
    }

    const matchedEnd = side === 'left' ? leftOpenPip! : rightOpenPip!;
    const newOpenPip = tile.left === matchedEnd ? tile.right : tile.left;

    // Discarding doubles is crucial in Kurdish Domino
    if (tile.isDouble) {
      score += 25;
    }

    // Discard heavy tiles to minimize risk in case of a lock (قفڵە)
    score += (tile.left + tile.right) * 2;

    // Hand synergy: count how many OTHER tiles bot has with newOpenPip
    const remainingHand = botHand.filter((t) => t.id !== tile.id);
    const countInHand = countPipInHand(remainingHand, newOpenPip);

    if (countInHand > 0) {
      score += countInHand * 12; // High versatility
    } else {
      score -= 22; // Risk: bot has no tiles with this new end!
    }

    return { move: m, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

// Check if game is completely blocked (neither player can move and boneyard is empty)
export function isGameBlocked(
  handA: DominoTile[],
  handB: DominoTile[],
  leftOpenPip: number | null,
  rightOpenPip: number | null,
  boneyardLength: number
): boolean {
  if (boneyardLength > 0) return false;
  if (leftOpenPip === null || rightOpenPip === null) return false;

  const aCanPlay = handA.some((t) => getValidPlacementSides(t, leftOpenPip, rightOpenPip).length > 0);
  const bCanPlay = handB.some((t) => getValidPlacementSides(t, leftOpenPip, rightOpenPip).length > 0);

  return !aCanPlay && !bCanPlay;
}
