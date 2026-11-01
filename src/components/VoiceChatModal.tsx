import React, { useState, useEffect } from 'react';
import { User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Users,
  Radio,
  Sparkles,
  Hand,
  Minimize2,
  Maximize2,
  X,
  Shield,
  Activity,
  Gift,
  Coins,
} from 'lucide-react';
import { playMicToggleSound, playVoiceChatJoinSound, playVoiceChatLeaveSound, playSendSound } from '../utils/audio';
import { VoiceRoomGiftsSheet } from './VoiceRoomGiftsSheet';
import { LiveGiftAnimationOverlay } from './LiveGiftAnimationOverlay';
import { VoiceGiftItem, LiveSentGift } from '../types/gifts';

export interface VoiceParticipant {
  user: User;
  isMuted: boolean;
  isSpeaking: boolean;
  hasHandRaised?: boolean;
  recentGift?: string;
}

interface VoiceChatModalProps {
  currentUser: User;
  contact?: User | null;
  allUsers: User[];
  dialect: Dialect;
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  onUpdateCurrentUserCoins?: (newCoins: number) => void;
  onOpenWallet?: () => void;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  currentUser,
  contact,
  allUsers,
  dialect,
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
  onUpdateCurrentUserCoins,
  onOpenWallet,
}) => {
  const t = translations[dialect];
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [isNoiseCancelOn, setIsNoiseCancelOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Gifts & Live animations
  const [isGiftsSheetOpen, setIsGiftsSheetOpen] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<LiveSentGift | null>(null);

  // Initial participants in the voice chat
  const [participants, setParticipants] = useState<VoiceParticipant[]>(() => {
    const list: VoiceParticipant[] = [
      {
        user: currentUser,
        isMuted: false,
        isSpeaking: true,
      },
    ];

    if (contact && contact.id !== currentUser.id) {
      list.push({
        user: contact,
        isMuted: false,
        isSpeaking: false,
      });
    } else {
      // Add a couple of active community friends
      const others = allUsers.filter((u) => u.id !== currentUser.id).slice(0, 3);
      for (const u of others) {
        list.push({
          user: u,
          isMuted: Math.random() > 0.6,
          isSpeaking: false,
        });
      }
    }
    return list;
  });

  // Play join chime on open
  useEffect(() => {
    if (isOpen) {
      playVoiceChatJoinSound();
      setCallDuration(0);
    }
  }, [isOpen]);

  // Duration counter
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Dynamic speaking simulator among other participants
  useEffect(() => {
    if (!isOpen) return;
    const speakTimer = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.user.id === currentUser.id) {
            return { ...p, isMuted, isSpeaking: !isMuted && Math.random() > 0.3 };
          }
          if (p.isMuted) return { ...p, isSpeaking: false };
          return {
            ...p,
            isSpeaking: Math.random() > 0.55,
          };
        })
      );
    }, 1200);

    return () => clearInterval(speakTimer);
  }, [isOpen, isMuted, currentUser.id]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playMicToggleSound(nextMuted);
    setParticipants((prev) =>
      prev.map((p) => (p.user.id === currentUser.id ? { ...p, isMuted: nextMuted, isSpeaking: !nextMuted } : p))
    );
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  const handleToggleHand = () => {
    const nextHand = !hasRaisedHand;
    setHasRaisedHand(nextHand);
    setParticipants((prev) =>
      prev.map((p) => (p.user.id === currentUser.id ? { ...p, hasHandRaised: nextHand } : p))
    );
  };

  const handleLeaveVoiceChat = () => {
    playVoiceChatLeaveSound();
    onClose();
  };

  const handleSendGift = async (recipient: User, gift: VoiceGiftItem, comboCount: number) => {
    const totalCost = gift.coins * comboCount;
    if ((currentUser.coins ?? 100) < totalCost) return;

    const newCoins = Math.max(0, (currentUser.coins ?? 100) - totalCost);
    if (onUpdateCurrentUserCoins) {
      onUpdateCurrentUserCoins(newCoins);
    }

    // Trigger visual celebration animation
    setActiveGiftAnimation({
      id: `live-gift-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: recipient.id,
      recipientName: recipient.name,
      gift,
      comboCount,
      timestamp: Date.now(),
    });

    // Mark recipient with recent gift icon
    setParticipants((prev) =>
      prev.map((p) => (p.user.id === recipient.id ? { ...p, recentGift: gift.icon } : p))
    );

    playSendSound();
    setIsGiftsSheetOpen(false);

    // Persist in background
    try {
      await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: recipient.id,
          amount: totalCost,
          note: `Live Voice Gift: ${gift.name} x${comboCount}`,
        }),
      });
    } catch {}
  };

  const handleRechargeCoins = (amount: number) => {
    const newCoins = (currentUser.coins ?? 100) + amount;
    if (onUpdateCurrentUserCoins) {
      onUpdateCurrentUserCoins(newCoins);
    }
    // Background recharge
    fetch('/api/wallet/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        packageAmount: amount,
        paymentMethod: 'SuperQi/FIB/FastPay/NassPay (7502236113)',
      }),
    }).catch(() => {});
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Minimized Floating Pill Mode
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#121218]/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-zinc-100 select-none animate-in fade-in slide-in-from-bottom-3"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <Radio className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-white">
            {contact ? `دەنگەچاتی: ${contact.name}` : 'دەنگەچاتی گشتی'}
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            {formatDuration(callDuration)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onToggleMinimize}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleLeaveVoiceChat}
            className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 select-none" dir="rtl">
      <div className="w-full max-w-lg bg-[#0e0e14] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col relative text-zinc-100 max-h-[92vh] overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {contact ? `دەنگەچات لەگەڵ ${contact.name}` : 'ژوورا دەنگەچاتێ'}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span className="text-emerald-400 font-mono font-bold">{formatDuration(callDuration)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-400" />
                  <span>{participants.length} بەژداربوو</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsGiftsSheetOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              title="باڵانسی کۆین و دیارییەکان"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{(currentUser.coins ?? 100).toLocaleString()}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMinimize}
              title="کەمکردنەوە بۆ لای خوارەوە"
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLeaveVoiceChat}
              title="چوونەدەرەوە لە دەنگەچات"
              className="w-9 h-9 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-rose-900/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Equalizer Bar */}
        <div className="py-3 px-4 my-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>شەپۆلێن دەنگی ڕاستەوخۆ</span>
          </div>

          <div className="flex items-center gap-1 h-5" dir="ltr">
            {[6, 14, 20, 10, 22, 16, 8, 18, 24, 12, 18, 10, 20, 14, 8].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-violet-500 to-emerald-400 rounded-full transition-all duration-200"
                style={{
                  height: !isMuted ? `${Math.max(4, Math.floor(h * (0.4 + Math.random() * 0.7)))}px` : '4px',
                  opacity: !isMuted ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-2.5 max-h-[46vh] relative z-10">
          <div className="grid grid-cols-2 gap-2.5">
            {participants.map((p) => {
              const isMe = p.user.id === currentUser.id;
              return (
                <div
                  key={p.user.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center relative overflow-hidden ${
                    p.isSpeaking
                      ? 'bg-gradient-to-b from-zinc-900/90 to-violet-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-900/50 border-zinc-800/80'
                  }`}
                >
                  {/* Status indicators */}
                  <div className="w-full flex items-center justify-between text-[11px] mb-2">
                    {p.hasHandRaised ? (
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full font-bold animate-bounce">
                        <Hand className="w-3 h-3" />
                        <span>دەست بەرز</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    <span
                      className={`p-1 rounded-full border ${
                        p.isMuted
                          ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                          : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      }`}
                    >
                      {p.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </span>
                  </div>

                  {/* Avatar with speaking wave aura */}
                  <div className="relative mb-2.5">
                    {p.isSpeaking && (
                      <div className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping" />
                    )}
                    <img
                      src={p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.id}`}
                      alt={p.user.name}
                      className={`w-16 h-16 rounded-full object-cover relative z-10 border-2 transition-transform duration-200 ${
                        p.isSpeaking
                          ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/30'
                          : 'border-zinc-700'
                      }`}
                    />
                  </div>

                  {/* Name & status */}
                  <div className="flex items-center gap-1 max-w-full">
                    <span className="text-xs font-bold text-white truncate">{p.user.name}</span>
                    {isMe && <span className="text-[10px] text-violet-400 font-bold">(تۆ)</span>}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-full">
                    @{p.user.username}
                  </span>

                  {p.isSpeaking && (
                    <span className="mt-1 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>قسە دەکات...</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Control Actions Bar */}
        <div className="pt-4 mt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3 relative z-10">
          {/* Mute/Unmute Mic Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
              isMuted
                ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'مایکرۆفۆن داخراوە' : 'مایکرۆفۆن کراوەیە'}</span>
          </button>

          {/* Raise Hand Toggle */}
          <button
            type="button"
            onClick={handleToggleHand}
            title="دەست بەرزکردنەوە بۆ قسەکردن"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
              hasRaisedHand
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* TikTok Live Gifts Button */}
          <button
            type="button"
            onClick={() => setIsGiftsSheetOpen(true)}
            title="دیارییەکانی لایڤ (Live Gifts)"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white flex items-center justify-center border border-pink-400/40 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <Gift className="w-5 h-5 fill-current" />
          </button>

          {/* Speaker Toggle */}
          <button
            type="button"
            onClick={handleToggleSpeaker}
            title="دەنگبێژ / بڵندگۆ"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
              isSpeakerOn
                ? 'bg-zinc-900 border-zinc-800 text-violet-400 hover:bg-zinc-800'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End/Leave Button */}
          <button
            type="button"
            onClick={handleLeaveVoiceChat}
            title="دەرچوون لە دەنگەچات"
            className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-rose-600/30 active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TIKTOK STYLE GIFTS BOTTOM SHEET */}
      <VoiceRoomGiftsSheet
        currentUser={currentUser}
        participants={participants}
        dialect={dialect}
        isOpen={isGiftsSheetOpen}
        onClose={() => setIsGiftsSheetOpen(false)}
        onSendGift={handleSendGift}
        onRechargeCoins={handleRechargeCoins}
      />

      {/* LIVE GIFT FLYING ANIMATION OVERLAY */}
      <LiveGiftAnimationOverlay
        activeGift={activeGiftAnimation}
        onAnimationEnd={() => setActiveGiftAnimation(null)}
      />
    </div>
  );
};
