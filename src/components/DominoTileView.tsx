import React from 'react';
import { DominoTile, TileSkin } from '../types/domino';

interface DominoTileViewProps {
  tile: DominoTile;
  orientation?: 'vertical' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  skin?: TileSkin;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  showPipSum?: boolean;
  onClick?: () => void;
  className?: string;
}

// Render pips for a single half of a tile (0 to 6)
const PipHalf: React.FC<{ value: number; size: 'xs' | 'sm' | 'md' | 'lg'; skin?: TileSkin }> = ({
  value,
  size,
  skin = 'ivory',
}) => {
  const dotSize =
    size === 'xs'
      ? 'w-1 h-1'
      : size === 'sm'
      ? 'w-1.5 h-1.5'
      : size === 'md'
      ? 'w-2 h-2'
      : 'w-2.5 h-2.5';

  const dotColor =
    skin === 'gold'
      ? 'bg-[#3d2605] shadow-xs'
      : skin === 'wood'
      ? 'bg-[#f4efe6] shadow-xs'
      : 'bg-[#18181b] shadow-inner';

  const dotClass = `${dotSize} rounded-full ${dotColor} shrink-0`;

  const renderDots = () => {
    switch (value) {
      case 0:
        return null;
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={dotClass} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-0.5">
            <div className="flex items-start justify-start">
              <span className={dotClass} />
            </div>
            <div />
            <div />
            <div className="flex items-end justify-end">
              <span className={dotClass} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-0.5">
            <div className="flex items-start justify-start">
              <span className={dotClass} />
            </div>
            <div /><div /><div />
            <div className="flex items-center justify-center">
              <span className={dotClass} />
            </div>
            <div /><div /><div />
            <div className="flex items-end justify-end">
              <span className={dotClass} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-0.5">
            <div className="flex items-start justify-start"><span className={dotClass} /></div>
            <div className="flex items-start justify-end"><span className={dotClass} /></div>
            <div className="flex items-end justify-start"><span className={dotClass} /></div>
            <div className="flex items-end justify-end"><span className={dotClass} /></div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-0.5">
            <div className="flex items-start justify-start"><span className={dotClass} /></div>
            <div />
            <div className="flex items-start justify-end"><span className={dotClass} /></div>
            <div />
            <div className="flex items-center justify-center"><span className={dotClass} /></div>
            <div />
            <div className="flex items-end justify-start"><span className={dotClass} /></div>
            <div />
            <div className="flex items-end justify-end"><span className={dotClass} /></div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-0.5">
            <div className="flex items-center justify-start"><span className={dotClass} /></div>
            <div className="flex items-center justify-end"><span className={dotClass} /></div>
            <div className="flex items-center justify-start"><span className={dotClass} /></div>
            <div className="flex items-center justify-end"><span className={dotClass} /></div>
            <div className="flex items-center justify-start"><span className={dotClass} /></div>
            <div className="flex items-center justify-end"><span className={dotClass} /></div>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="w-full h-full relative">{renderDots()}</div>;
};

export const DominoTileView: React.FC<DominoTileViewProps> = ({
  tile,
  orientation = 'vertical',
  size = 'md',
  skin = 'ivory',
  isFaceDown = false,
  isPlayable = false,
  isSelected = false,
  showPipSum = false,
  onClick,
  className = '',
}) => {
  // Guaranteed 1:2 aspect ratio
  const dims = {
    xs: orientation === 'vertical' ? 'w-[26px] h-[52px]' : 'w-[52px] h-[26px]',
    sm: orientation === 'vertical' ? 'w-[34px] h-[68px]' : 'w-[68px] h-[34px]',
    md: orientation === 'vertical' ? 'w-[44px] h-[88px]' : 'w-[88px] h-[44px]',
    lg: orientation === 'vertical' ? 'w-[52px] h-[104px]' : 'w-[104px] h-[52px]',
  }[size];

  if (isFaceDown) {
    const faceDownBg =
      skin === 'gold'
        ? 'bg-gradient-to-br from-amber-700 via-amber-900 to-black border-amber-500/50'
        : skin === 'wood'
        ? 'bg-gradient-to-br from-[#3b2210] via-[#241407] to-black border-amber-900/60'
        : 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-zinc-700';

    return (
      <div
        className={`${dims} rounded-lg ${faceDownBg} shadow-md flex items-center justify-center select-none overflow-hidden relative ${className}`}
      >
        <div className="absolute inset-1 border border-zinc-700/40 rounded-sm opacity-50 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 border border-amber-400/70 shadow-sm z-10" />
      </div>
    );
  }

  const isVertical = orientation === 'vertical';

  // Tile backgrounds based on skin
  const skinStyles = {
    ivory: {
      bg: 'bg-gradient-to-b from-[#faf8f4] via-[#f3ede1] to-[#e7decb]',
      border: 'border-amber-200/60',
      divider: 'bg-[#a8822d]',
      rivet: 'bg-gradient-to-br from-[#f8de7e] via-[#d4af37] to-[#8c6b1b] border-[#6b5212]',
    },
    gold: {
      bg: 'bg-gradient-to-b from-[#ffe58f] via-[#ffd666] to-[#d48806]',
      border: 'border-amber-300',
      divider: 'bg-[#874d00]',
      rivet: 'bg-gradient-to-br from-[#fff1b8] via-[#faad14] to-[#ad6800] border-[#613400]',
    },
    wood: {
      bg: 'bg-gradient-to-b from-[#5c3a21] via-[#462813] to-[#2e190b]',
      border: 'border-[#7a4e2d]',
      divider: 'bg-[#a8822d]',
      rivet: 'bg-gradient-to-br from-[#e5a855] via-[#ba7b2c] to-[#6d4310] border-[#382006]',
    },
  }[skin];

  const totalPips = tile.left + tile.right;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`Domino tile ${tile.left}-${tile.right}`}
      className={`relative ${dims} select-none transition-all duration-150 rounded-lg shadow-md border ${
        isSelected
          ? 'border-violet-500 shadow-violet-500/50 -translate-y-2 ring-2 ring-violet-400'
          : isPlayable
          ? 'border-emerald-400 shadow-emerald-500/30 cursor-pointer hover:-translate-y-1 ring-2 ring-emerald-400/80'
          : skinStyles.border
      } ${
        onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'
      } ${skinStyles.bg} overflow-hidden flex ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${className}`}
    >
      {/* Top / Left Half */}
      <div className={`${isVertical ? 'w-full h-1/2' : 'w-1/2 h-full'} p-1 flex items-center justify-center relative`}>
        <PipHalf value={tile.left} size={size} skin={skin} />
      </div>

      {/* Brass Spinner & Divider */}
      <div
        className={`relative shrink-0 flex items-center justify-center ${
          isVertical ? `w-full h-[1.5px] ${skinStyles.divider}` : `h-full w-[1.5px] ${skinStyles.divider}`
        }`}
      >
        {/* Brass rivet */}
        <span
          className={`absolute rounded-full ${skinStyles.rivet} shadow-sm z-10 ${
            size === 'xs'
              ? 'w-1 h-1'
              : size === 'sm'
              ? 'w-1.5 h-1.5'
              : size === 'md'
              ? 'w-2 h-2'
              : 'w-2.5 h-2.5'
          }`}
        />
      </div>

      {/* Bottom / Right Half */}
      <div className={`${isVertical ? 'w-full h-1/2' : 'w-1/2 h-full'} p-1 flex items-center justify-center relative`}>
        <PipHalf value={tile.right} size={size} skin={skin} />
      </div>

      {/* Playable Aura indicator if active */}
      {isPlayable && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse pointer-events-none" />
      )}

      {/* Pip sum badge for quick counting */}
      {showPipSum && size !== 'xs' && (
        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded-xs bg-black/60 text-[9px] font-mono font-bold text-amber-300 pointer-events-none">
          {totalPips}
        </span>
      )}
    </button>
  );
};
