import React, { useEffect } from 'react';
import { LiveSentGift } from '../types/gifts';
import { Sparkles, Flame, Crown } from 'lucide-react';

interface LiveGiftAnimationOverlayProps {
  activeGift: LiveSentGift | null;
  onAnimationEnd: () => void;
}

export const LiveGiftAnimationOverlay: React.FC<LiveGiftAnimationOverlayProps> = ({
  activeGift,
  onAnimationEnd,
}) => {
  useEffect(() => {
    if (!activeGift) return;
    const duration = activeGift.gift.coins >= 10000 ? 4500 : 3200;
    const timer = setTimeout(onAnimationEnd, duration);
    return () => clearTimeout(timer);
  }, [activeGift, onAnimationEnd]);

  if (!activeGift) return null;

  const isEpic = activeGift.gift.coins >= 10000;
  const isHigh = activeGift.gift.coins >= 200;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* EPIC FULL-SCREEN BACKGROUND LIGHT BURST */}
      {isEpic && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-violet-500/20 blur-3xl animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_2px,transparent_2px)] [background-size:32px_32px] opacity-40 animate-ping" />
        </div>
      )}

      {/* TIKTOK STYLE GIFT BANNER (Slides in from right/center) */}
      <div className="relative animate-in slide-in-from-right-8 fade-in zoom-in-95 duration-300 max-w-md w-full flex flex-col items-center">
        {/* Top Royal Crown for Big Gifts */}
        {isEpic && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black font-black text-xs shadow-xl animate-bounce mb-2">
            <Crown className="w-4 h-4 fill-current" />
            <span>دیاری پاشایەتی • ROYAL GIFT</span>
          </div>
        )}

        {/* The Card Banner */}
        <div className="flex items-center gap-3 p-3.5 pr-4 pl-6 rounded-full bg-gradient-to-r from-black/90 via-zinc-900/95 to-black/90 border-2 border-rose-500/60 shadow-2xl backdrop-blur-xl relative">
          {/* Sender Avatar */}
          <div className="relative shrink-0">
            <img
              src={activeGift.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={activeGift.senderName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
              ★
            </span>
          </div>

          {/* Text Details */}
          <div className="flex flex-col text-right min-w-[130px]">
            <span className="text-xs font-bold text-white truncate max-w-[150px]">
              {activeGift.senderName}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-zinc-300">
              <span className="text-rose-400 font-bold">پێشکەشی کرد بە:</span>
              <span className="text-amber-300 font-bold truncate max-w-[90px]">
                {activeGift.recipientName}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              {activeGift.gift.kurName}
            </span>
          </div>

          {/* Big 3D Gift Icon */}
          <div className="text-4xl shrink-0 animate-bounce transition-transform duration-300 scale-120 drop-shadow-[0_10px_20px_rgba(244,63,94,0.4)]">
            {activeGift.gift.icon}
          </div>

          {/* Combo Multiplier Pill */}
          <div className="shrink-0 flex items-center gap-0.5 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-sm px-2.5 py-1 rounded-full shadow-lg italic animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>x{activeGift.comboCount}</span>
          </div>
        </div>

        {/* Floating Sparks particles */}
        <div className="flex gap-4 mt-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs font-black text-amber-300 font-mono tracking-wider drop-shadow-md">
            +{(activeGift.gift.coins * activeGift.comboCount).toLocaleString()} Coins
          </span>
          <Sparkles className="w-5 h-5 text-rose-400 animate-spin" />
        </div>
      </div>
    </div>
  );
};
