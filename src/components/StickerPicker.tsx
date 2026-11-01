import React from 'react';
import { KURDISH_STICKERS } from '../data/mockData';
import { KurdistanVerifiedBadgeIcon, KurdistanSunEmoji, KurdistanShield } from './KurdistanBadge';
import { X, Sparkles, Smile, ShieldCheck } from 'lucide-react';

interface StickerPickerProps {
  onSelectSticker: (text: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '❤️', '🌹', '☀️', '☕', '🔥', '😂', '😍', '👏', '🤲', '✨',
  '🦁', '✌️', '💪', '💙', '⭐', '🏔️', '🦅', '🕊️', '💐', '🎉'
];

export const StickerPicker: React.FC<StickerPickerProps> = ({
  onSelectSticker,
  onSelectEmoji,
  onClose,
}) => {
  return (
    <div className="bg-[#18181c] border border-neutral-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 w-full max-w-sm select-none">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ستیکەر و ئیمۆجی فەرمی کوردستان</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Kurdistan Verified Badges Row */}
      <div className="flex flex-col gap-1.5 bg-neutral-900/90 border border-amber-500/30 p-2.5 rounded-2xl">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
          <span className="flex items-center gap-1">
            <KurdistanVerifiedBadgeIcon size="xs" />
            <span>باجی پشتڕاستکراوی کوردستان (Verified)</span>
          </span>
          <span className="text-amber-400">☀️</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onSelectSticker('☀️✓ [Verified Kurdistan]')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 transition-all cursor-pointer hover:scale-105"
          >
            <KurdistanVerifiedBadgeIcon size="xs" />
            <span>باجی فەرمی</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectSticker('👑☀️ [Admin Kurdistan]')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-300 transition-all cursor-pointer hover:scale-105"
          >
            <span>👑☀️</span>
            <span>Admin</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectSticker('بژی کوردستان ☀️🦁✌️')}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 transition-all cursor-pointer hover:scale-105"
          >
            <span>🦁☀️</span>
            <span>کوردستان</span>
          </button>
        </div>
      </div>

      {/* Quick Kurdish Phrases */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-neutral-400 text-right">
          دەستەواژە باوەکان:
        </span>
        <div className="grid grid-cols-2 gap-2" dir="rtl">
          {KURDISH_STICKERS.map((stk) => (
            <button
              key={stk.id}
              type="button"
              onClick={() => onSelectSticker(stk.text)}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/70 hover:border-purple-500/50 rounded-xl text-xs font-medium text-neutral-200 transition-all text-right truncate cursor-pointer hover:scale-[1.02]"
            >
              {stk.text}
            </button>
          ))}
        </div>
      </div>

      {/* Common Kurdish & Chat Emojis */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-800/50">
        <span className="text-[11px] font-medium text-neutral-400 text-right">
          ئیمۆجی:
        </span>
        <div className="grid grid-cols-5 gap-2 text-center">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="p-2 hover:bg-neutral-800 rounded-xl text-xl transition-all cursor-pointer hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
