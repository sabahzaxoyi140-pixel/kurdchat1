import React, { useState } from 'react';
import { User, Dialect } from '../types/chat';
import {
  GiftCategory,
  VoiceGiftItem,
  VoiceSongItem,
  RECHARGE_PACKAGES,
  RechargePackage,
} from '../types/gifts';
import { VOICE_GIFTS_CATALOG, VOICE_SONGS_CATALOG } from '../data/voiceGiftsData';
import { VoiceParticipant } from './VoiceChatModal';
import {
  X,
  Coins,
  Sparkles,
  ChevronRight,
  Disc3,
  Copy,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Play,
  Flame,
} from 'lucide-react';

interface VoiceRoomGiftsSheetProps {
  currentUser: User;
  participants: VoiceParticipant[];
  dialect: Dialect;
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (recipient: User, gift: VoiceGiftItem, comboCount: number) => void;
  onRechargeCoins: (amount: number) => void;
}

const OFFICIAL_PAYMENTS = [
  { id: 'superqi', name: 'SuperQi', account: '7502236113', icon: Smartphone },
  { id: 'fib', name: 'First Iraqi Bank (FIB)', account: '7502236113', icon: Building2 },
  { id: 'nasspay', name: 'NassPay', account: '7502236113', icon: CreditCard },
  { id: 'fastpay', name: 'FastPay', account: '7502236113', icon: Smartphone },
  { id: 'usdt', name: 'USDT TRC20', account: 'TAVaLZGavKH5ZaSiRY3mc65Eji6DPsXrRR', icon: Wallet },
];

export const VoiceRoomGiftsSheet: React.FC<VoiceRoomGiftsSheetProps> = ({
  currentUser,
  participants,
  dialect,
  isOpen,
  onClose,
  onSendGift,
  onRechargeCoins,
}) => {
  const [activeCategory, setActiveCategory] = useState<GiftCategory>('gifts');
  const [selectedGift, setSelectedGift] = useState<VoiceGiftItem>(VOICE_GIFTS_CATALOG[0]);
  const [selectedSong, setSelectedSong] = useState<VoiceSongItem | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(() => {
    // Default to first other participant on mic
    const other = participants.find((p) => p.user.id !== currentUser.id);
    return other ? other.user.id : currentUser.id;
  });
  const [comboCount, setComboCount] = useState<number>(1);
  const [showRechargeSheet, setShowRechargeSheet] = useState(false);
  const [selectedRechargePack, setSelectedRechargePack] = useState<RechargePackage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const userCoins = currentUser.coins ?? 100;

  // Filter gifts by active category
  const displayedGifts = VOICE_GIFTS_CATALOG.filter((g) => g.category === activeCategory);

  const selectedRecipient =
    participants.find((p) => p.user.id === selectedRecipientId)?.user || currentUser;

  const totalCost = selectedGift ? selectedGift.coins * comboCount : 0;
  const canAfford = userCoins >= totalCost;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = () => {
    if (!canAfford) {
      setShowRechargeSheet(true);
      return;
    }
    if (activeCategory === 'songs' && selectedSong) {
      // Send song as special gift
      const songAsGift: VoiceGiftItem = {
        id: selectedSong.id,
        name: selectedSong.title,
        kurName: `گۆرانی: ${selectedSong.title}`,
        category: 'songs',
        coins: selectedSong.coins,
        icon: '🎵',
        animationType: 'flight',
      };
      onSendGift(selectedRecipient, songAsGift, 1);
      return;
    }

    if (selectedGift) {
      onSendGift(selectedRecipient, selectedGift, comboCount);
    }
  };

  const handleQuickRechargeConfirm = (pkg: RechargePackage) => {
    onRechargeCoins(pkg.coins);
    setShowRechargeSheet(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end select-none animate-in fade-in duration-200" dir="rtl">
      {/* Tap outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="w-full bg-[#11121a]/98 border-t border-zinc-800 rounded-t-[32px] p-4 shadow-2xl flex flex-col max-h-[80vh] relative text-white overflow-hidden">
        {/* Decorative Pull Notch */}
        <div className="w-10 h-1 rounded-full bg-zinc-700/80 mx-auto mb-3" />

        {/* Top Header: Recipient Selector & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          {/* Recipient Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">ناردن بۆ:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[240px]">
              {participants.map((p) => {
                const isSelected = p.user.id === selectedRecipientId;
                return (
                  <button
                    key={p.user.id}
                    type="button"
                    onClick={() => setSelectedRecipientId(p.user.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <img
                      src={p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.id}`}
                      alt={p.user.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="truncate max-w-[80px]">
                      {p.user.id === currentUser.id ? 'هەمووان' : p.user.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Close sheet */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs (TikTok Live exact: Gifts, Songs, Interactive, Exclusive) */}
        <div className="flex items-center gap-2 py-2.5 border-b border-zinc-850 overflow-x-auto no-scrollbar">
          {[
            { id: 'gifts', label: 'Gifts (دیارییەکان)' },
            { id: 'songs', label: 'Songs (گۆرانییەکان)' },
            { id: 'interactive', label: 'Interactive (تفاعلی)' },
            { id: 'exclusive', label: 'Exclusive (تایبەت)' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as GiftCategory)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* GIFTS GRID (4 cols x 2 rows / scrollable) */}
        {activeCategory !== 'songs' ? (
          <div className="grid grid-cols-4 gap-2.5 py-3 overflow-y-auto max-h-[38vh] no-scrollbar">
            {displayedGifts.map((gift) => {
              const isSelected = selectedGift?.id === gift.id;
              return (
                <div
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-between text-center cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'bg-gradient-to-b from-rose-950/40 to-pink-950/20 border-2 border-rose-500 shadow-lg shadow-rose-500/20 scale-102'
                      : 'bg-[#161722]/60 hover:bg-[#1a1b28] border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Badge (HOT, VIP, etc) */}
                  {gift.badge && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-[8px] font-black text-black uppercase shadow-xs">
                      {gift.badge}
                    </span>
                  )}

                  {/* 3D Animated Icon */}
                  <div className="w-12 h-12 flex items-center justify-center text-3xl group-hover:scale-115 transition-transform duration-200 my-1">
                    {gift.icon}
                  </div>

                  {/* Name */}
                  <span className="text-[11px] font-bold text-zinc-100 truncate w-full">
                    {gift.name}
                  </span>

                  {/* Price */}
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>{gift.coins.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* SONGS VINYL RECORD TAB */
          <div className="grid grid-cols-4 gap-2.5 py-3 overflow-y-auto max-h-[38vh] no-scrollbar">
            {VOICE_SONGS_CATALOG.map((song) => {
              const isSelected = selectedSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-between text-center cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-950/40 to-teal-950/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-[#161722]/60 hover:bg-[#1a1b28] border border-zinc-800/80'
                  }`}
                >
                  {/* Rotating Vinyl Record */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${song.color} border-2 border-zinc-900 shadow-md flex items-center justify-center text-white my-1 ${isSelected ? 'animate-spin' : ''}`}>
                    <Disc3 className="w-6 h-6" />
                  </div>

                  <span className="text-[11px] font-bold text-zinc-100 truncate w-full">
                    {song.title}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>{song.coins}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM ACTION BAR: RECHARGE & SEND WITH COMBO */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 mt-1">
          {/* Left: Recharge Button & Balance Pill */}
          <button
            type="button"
            onClick={() => setShowRechargeSheet(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-amber-300">{userCoins.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400">شحن باڵانس</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
          </button>

          {/* Right: Combo multiplier + Send button */}
          <div className="flex items-center gap-1.5">
            {/* Combo selector */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-2xl border border-zinc-800">
              {[1, 5, 10, 99].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setComboCount(count)}
                  className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                    comboCount === count
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  x{count}
                </button>
              ))}
            </div>

            {/* Main Send Button */}
            <button
              type="button"
              onClick={handleSend}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5 ${
                canAfford
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-rose-500/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
              }`}
            >
              <span>{canAfford ? 'ناردن (Send)' : 'پڕکردنەوە'}</span>
              <Coins className="w-3.5 h-3.5" />
              <span className="font-mono">{totalCost > 0 ? totalCost.toLocaleString() : ''}</span>
            </button>
          </div>
        </div>

        {/* TIKTOK STYLE RECHARGE OVERLAY MODAL */}
        {showRechargeSheet && (
          <div className="absolute inset-0 bg-[#0e0f17] z-50 p-4 flex flex-col justify-between overflow-y-auto no-scrollbar animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">پڕکردنەوەی باڵانسی کۆین</h4>
                  <span className="text-[11px] text-zinc-400">باڵانسی ئێستا: {userCoins.toLocaleString()} کۆین</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRechargeSheet(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Payment Accounts Reminder */}
            <div className="my-2 p-3 rounded-2xl bg-[#141520] border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>حسابات الدفع العراقية المعتمدة (کۆپیکردن):</span>
              </span>

              <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                {OFFICIAL_PAYMENTS.map((m) => {
                  const isCopied = copiedId === m.id;
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-bold text-white truncate">{m.name}:</span>
                        <span className="text-[11px] font-mono text-amber-300 font-bold select-all truncate">
                          {m.account}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.account)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'کۆپی کرا' : 'کۆپی'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TikTok Recharge Packages Grid */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-300">پاکێجی دیاریکراو هەڵبژێرە:</span>
              <div className="grid grid-cols-2 gap-2">
                {RECHARGE_PACKAGES.map((pkg) => {
                  const isSelected = selectedRechargePack?.coins === pkg.coins;
                  return (
                    <div
                      key={pkg.coins}
                      onClick={() => setSelectedRechargePack(pkg)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-[#151622] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-white">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>{pkg.coins.toLocaleString()}</span>
                        </div>
                        {pkg.popular && (
                          <span className="px-1.5 py-0.2 rounded-md bg-rose-600 text-[9px] font-black text-white">
                            باو
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono mt-1">
                        {pkg.iqdPrice}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Recharge Button */}
            <div className="pt-3 border-t border-zinc-800 flex gap-2 mt-2">
              <button
                type="button"
                disabled={!selectedRechargePack}
                onClick={() => selectedRechargePack && handleQuickRechargeConfirm(selectedRechargePack)}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {selectedRechargePack
                  ? `شحن +${selectedRechargePack.coins} کۆین (${selectedRechargePack.iqdPrice})`
                  : 'پاکێجێک دیاری بکە'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
