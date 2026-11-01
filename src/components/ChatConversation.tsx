import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message, User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { playSendSound, playReceiveSound, playSimulatedVoiceNote } from '../utils/audio';
import { RealAudioRecorder, playRealAudio, stopRealAudio } from '../utils/audioRecorder';
import { KurdistanAdminVerifyBadge, KurdistanShield, KurdistanFlagPill, UserBadges } from './KurdistanBadge';
import { StickerPicker } from './StickerPicker';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Video,
  Send,
  Mic,
  Image as ImageIcon,
  Smile,
  PhoneMissed,
  Check,
  CheckCheck,
  Play,
  Pause,
  Sparkles,
  Paperclip,
  MoreVertical,
  Volume2,
  Camera,
  Upload,
  Lock,
  X,
  Coins,
  Radio,
  Dices,
} from 'lucide-react';

interface ChatConversationProps {
  chat: Chat;
  currentUser: User;
  dialect: Dialect;
  soundEnabled: boolean;
  onBack: () => void;
  onSendMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'status'>) => void;
  onStartCall: (contact: User, type: 'audio' | 'video') => void;
  onStartVoiceChat?: (contact: User) => void;
  onStartDomino?: (contact: User) => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  currentUser,
  dialect,
  soundEnabled,
  onBack,
  onSendMessage,
  onStartCall,
  onStartVoiceChat,
  onStartDomino,
  onAcceptRequest,
  onRejectRequest,
}) => {
  const [inputText, setInputText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showCoinGiftModal, setShowCoinGiftModal] = useState(false);
  const [giftCoinAmount, setGiftCoinAmount] = useState<number>(50);
  const [giftCoinNote, setGiftCoinNote] = useState('');
  const [isSendingCoin, setIsSendingCoin] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<{ [id: string]: number }>({});
  const [isContactTyping, setIsContactTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const audioRecorderRef = useRef<RealAudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[dialect];

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [chat.messages.length]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (stopVoiceRef.current) stopVoiceRef.current();
      stopRealAudio();
      if (audioRecorderRef.current) audioRecorderRef.current.cancel();
    };
  }, []);

  // Handle voice recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartRealRecording = async () => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new RealAudioRecorder();
    }
    setIsRecording(true);
    const started = await audioRecorderRef.current.start();
    if (!started) {
      // Still allow UI recording even if permission is restricted
      console.log('Recording in fallback mode');
    }
  };

  const handleStopRealRecording = async () => {
    setIsRecording(false);
    let duration = Math.max(recordingSeconds, 1);
    let audioUrl: string | undefined;

    if (audioRecorderRef.current) {
      const result = await audioRecorderRef.current.stop();
      if (result) {
        audioUrl = result.audioUrl;
        duration = result.duration;
      }
    }

    if (soundEnabled) playSendSound();

    onSendMessage(chat.id, {
      senderId: currentUser.id,
      type: 'voice',
      audioDuration: duration,
      mediaUrl: audioUrl,
      text: 'دەنگی',
    });
  };

  const handleCancelRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cancel();
    }
    setIsRecording(false);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (soundEnabled) playSendSound();

    const textToSend = inputText.trim();
    setInputText('');
    setShowStickers(false);

    onSendMessage(chat.id, {
      senderId: currentUser.id,
      text: textToSend,
      type: 'text',
    });
  };

  const handleSendSticker = (stickerText: string) => {
    if (soundEnabled) playSendSound();
    setShowStickers(false);
    onSendMessage(chat.id, {
      senderId: currentUser.id,
      text: stickerText,
      type: 'text',
    });
  };

  const handleSendCoinGift = async () => {
    if (isSendingCoin || giftCoinAmount <= 0) return;
    if ((currentUser.coins ?? 100) < giftCoinAmount) {
      alert(dialect === 'english' ? 'Insufficient coins!' : 'باڵانسی کۆینت بەشی ناکات!');
      return;
    }

    setIsSendingCoin(true);
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: chat.contact.id,
          amount: giftCoinAmount,
          note: giftCoinNote.trim() || undefined,
        }),
      });

      if (res.ok) {
        if (soundEnabled) playSendSound();
        onSendMessage(chat.id, {
          senderId: currentUser.id,
          text: giftCoinNote.trim() || `دیاریی ${giftCoinAmount} کۆین پێشکەش کرا`,
          type: 'coin_gift',
          coinAmount: giftCoinAmount,
        });
        setShowCoinGiftModal(false);
        setGiftCoinNote('');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'هەڵەیەک ڕوویدا');
      }
    } catch (err) {
      console.error('Error sending coin gift:', err);
    } finally {
      setIsSendingCoin(false);
    }
  };

  // Real Image File Selection from Phone/Computer
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (soundEnabled) playSendSound();
        onSendMessage(chat.id, {
          senderId: currentUser.id,
          type: 'image',
          mediaUrl: dataUrl,
          text: file.name || 'وێنە 📸',
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const togglePlayVoice = (messageId: string, duration = 10, mediaUrl?: string) => {
    if (playingVoiceId === messageId) {
      if (stopVoiceRef.current) stopVoiceRef.current();
      stopRealAudio();
      setPlayingVoiceId(null);
      return;
    }

    if (stopVoiceRef.current) {
      stopVoiceRef.current();
    }
    stopRealAudio();

    setPlayingVoiceId(messageId);
    setVoiceProgress((prev) => ({ ...prev, [messageId]: 0 }));

    if (mediaUrl && (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('http') || mediaUrl.startsWith('data:'))) {
      // Play real audio recorded from microphone!
      const stopFn = playRealAudio(
        mediaUrl,
        (pct) => {
          setVoiceProgress((prev) => ({ ...prev, [messageId]: pct }));
        },
        () => {
          setPlayingVoiceId(null);
          setVoiceProgress((prev) => ({ ...prev, [messageId]: 100 }));
        }
      );
      stopVoiceRef.current = stopFn;
    } else {
      // Synthesized audio fallback
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min((elapsed / duration) * 100, 100);
        setVoiceProgress((prev) => ({ ...prev, [messageId]: pct }));
      }, 100);

      const stopAudio = playSimulatedVoiceNote(duration, () => {
        clearInterval(interval);
        setPlayingVoiceId(null);
        setVoiceProgress((prev) => ({ ...prev, [messageId]: 100 }));
      });

      stopVoiceRef.current = () => {
        clearInterval(interval);
        stopAudio();
      };
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white relative select-none">
      {/* Conversation Top Header */}
      <div
        className="px-4 py-3 bg-[#0d0d10] border-b border-neutral-900 flex items-center justify-between z-10"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          {/* Back button for mobile navigation */}
          <button
            onClick={onBack}
            className="p-1 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Contact Avatar & Info */}
          <div className="relative">
            {chat.contact.avatar ? (
              <img
                src={chat.contact.avatar}
                alt={chat.contact.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-base text-white">
                {chat.contact.name === 'Hii' ? 'H' : chat.contact.name[0]}
              </div>
            )}
            {chat.contact.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
            )}
          </div>

          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="font-bold text-sm text-white">
                {chat.contact.name}
              </span>
              <UserBadges user={chat.contact} size="xs" />
            </div>
            <span className="text-[11px] text-neutral-400">
              {isContactTyping ? (
                <span className="text-purple-400 font-medium animate-pulse">
                  خەریکی نووسینە...
                </span>
              ) : chat.contact.isOnline ? (
                <span className="text-emerald-400 font-medium">{t.online}</span>
              ) : (
                `${t.lastSeen} ${chat.contact.lastSeen || '12:00'}`
              )}
            </span>
          </div>
        </div>

        {/* Action icons: Voice Chat, Audio Call, Video Call */}
        <div className="flex items-center gap-1">
          {onStartVoiceChat && (
            <button
              type="button"
              onClick={() => onStartVoiceChat(chat.contact)}
              title={dialect === 'english' ? 'Voice Chat' : dialect === 'badini' ? 'ژوورا دەنگەچاتێ' : 'دەنگەچاتی ڕاستەوخۆ'}
              className="p-2 rounded-xl text-zinc-300 hover:text-violet-300 hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1"
            >
              <Radio className="w-5 h-5 text-violet-400 animate-pulse" />
            </button>
          )}
          {onStartDomino && (
            <button
              type="button"
              onClick={() => onStartDomino(chat.contact)}
              title="ئاڵنگاری دۆمینە LIVE"
              className="p-2 rounded-xl text-zinc-300 hover:text-emerald-300 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
            >
              <Dices className="w-5 h-5 text-emerald-400" />
            </button>
          )}
          <button
            onClick={() => onStartCall(chat.contact, 'audio')}
            title={t.audioCall}
            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Phone className="w-5 h-5 text-emerald-400" />
          </button>
          <button
            onClick={() => onStartCall(chat.contact, 'video')}
            title={t.videoCall}
            className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Video className="w-5 h-5 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-gradient-to-b from-black via-[#0a0a0d] to-black"
        dir="rtl"
      >
        {/* Date Stamp */}
        <div className="flex justify-center my-2">
          <span className="bg-neutral-900/90 text-neutral-400 border border-neutral-800 text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-sm">
            {t.today}
          </span>
        </div>

        {/* Locked Message Request Banner */}
        {chat.isLocked && (
          <div className="my-3 p-4 rounded-3xl bg-gradient-to-r from-purple-950/80 via-neutral-900 to-indigo-950/80 border border-purple-800/60 shadow-2xl flex flex-col gap-3 text-right">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs justify-end">
              <span>داخوازەکا نامەیێ یە (Message Request)</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              ئەڤ کەسە نە د لیستا هەڤالێن تەیە و نامەیەک هنارتیە. ئایا تو ڤی کەسی دناسی؟
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onAcceptRequest}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-700/20 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>پەسەندکرن و ڤەکرن</span>
              </button>
              <button
                type="button"
                onClick={onRejectRequest}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>ڕەتکرن</span>
              </button>
            </div>
          </div>
        )}

        {chat.messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isMissedCall = msg.type === 'call' && msg.callStatus === 'missed';
          const isVoice = msg.type === 'voice';
          const isImage = msg.type === 'image';
          const isCoinGift = msg.type === 'coin_gift';

          if (isMissedCall) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-2 rounded-2xl text-xs backdrop-blur-md shadow-sm">
                  <PhoneMissed className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-medium">{msg.text || t.callCancelled}</span>
                  <span className="text-[10px] text-red-400/80 font-sans mr-2">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} group`}
            >
              <div
                className={`relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isCoinGift
                    ? 'bg-gradient-to-br from-amber-950/60 via-[#181512] to-[#121216] border border-amber-500/40 shadow-lg shadow-amber-500/10 text-white rounded-2xl'
                    : isMe
                    ? 'bg-violet-600 text-white rounded-br-sm shadow-violet-600/20'
                    : 'bg-[#14141a] text-zinc-100 rounded-bl-sm border border-zinc-800/80'
                }`}
              >
                {/* Coin Gift View */}
                {isCoinGift && (
                  <div className="flex flex-col gap-2 min-w-[210px] py-1 text-right" dir="rtl">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/30 shrink-0">
                        <Coins className="w-6 h-6 text-amber-950" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-amber-300">
                          {isMe ? 'دیاریی باڵانسی کۆینت نارد' : 'دیاریی باڵانسی کۆینت پێگەیشت'}
                        </span>
                        <span className="text-lg font-black text-white tracking-tight">
                          +{(msg.coinAmount || 0).toLocaleString()}{' '}
                          <span className="text-xs font-bold text-amber-400">کۆین</span>
                        </span>
                      </div>
                    </div>
                    {msg.text && (
                      <div className="text-xs text-amber-100/90 bg-black/30 rounded-xl px-3 py-2 font-medium border border-amber-500/20">
                        {msg.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Voice Note View */}
                {isVoice && (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]" dir="ltr">
                    <button
                      type="button"
                      onClick={() => togglePlayVoice(msg.id, msg.audioDuration || 14, msg.mediaUrl)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                        isMe ? 'bg-white text-violet-600 shadow-sm' : 'bg-violet-600 text-white'
                      }`}
                    >
                      {playingVoiceId === msg.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Animated waveform bars */}
                    <div className="flex-1 flex items-center gap-0.5 h-6">
                      {[4, 12, 18, 8, 22, 14, 10, 20, 16, 7, 15, 22, 12, 8, 19, 11].map(
                        (h, idx) => {
                          const isPlayed =
                            (voiceProgress[msg.id] || 0) >= (idx / 16) * 100;
                          return (
                            <span
                              key={idx}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                isPlayed
                                  ? isMe
                                    ? 'bg-white'
                                    : 'bg-violet-400'
                                  : isMe
                                  ? 'bg-violet-300/40'
                                  : 'bg-zinc-700'
                              } ${playingVoiceId === msg.id ? 'animate-pulse' : ''}`}
                              style={{ height: `${h}px` }}
                            />
                          );
                        }
                      )}
                    </div>

                    <span className="text-[11px] font-mono shrink-0 opacity-80">
                      0:{msg.audioDuration || 14}
                    </span>
                  </div>
                )}

                {/* Image Message */}
                {isImage && msg.mediaUrl && (
                  <div className="rounded-xl overflow-hidden mb-1.5 max-w-sm">
                    <img
                      src={msg.mediaUrl}
                      alt="Shared media"
                      className="w-full max-h-60 object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Text Message */}
                {!isVoice && !isCoinGift && msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Footer Timestamp & Delivery Status */}
                <div
                  className={`flex items-center gap-1 mt-1 text-[10px] font-sans ${
                    isMe ? 'text-violet-200 justify-start' : 'text-zinc-500 justify-end'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <CheckCheck className="w-3.5 h-3.5 text-violet-200" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isContactTyping && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 mr-2">
            <div className="flex gap-1 py-1 px-3 bg-[#1e1e24] rounded-2xl border border-neutral-800">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Sticker / Kurdish phrase drawer */}
      {showStickers && (
        <div className="absolute bottom-20 right-4 z-30">
          <StickerPicker
            onSelectSticker={handleSendSticker}
            onSelectEmoji={(emoji) => {
              setInputText((prev) => prev + emoji);
              setShowStickers(false);
            }}
            onClose={() => setShowStickers(false)}
          />
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <div className="p-3 bg-[#0d0d10] border-t border-neutral-900/90 z-20">
        {chat.isLocked ? (
          <div className="w-full py-2.5 px-4 rounded-2xl bg-[#18181f] border border-purple-900/50 flex items-center justify-between text-xs text-neutral-400" dir="rtl">
            <span className="flex items-center gap-2 font-medium text-neutral-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>پێدڤیە داخوازێ پەسەند بکەی بۆ بەرسڤدانێ</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onAcceptRequest}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-all active:scale-95"
              >
                پەسەندکرن
              </button>
              <button
                type="button"
                onClick={onRejectRequest}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
              >
                ڕەتکرن
              </button>
            </div>
          </div>
        ) : isRecording ? (
          <div
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-2.5 text-white"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-medium text-neutral-300">
                {t.recording}
              </span>
              <span className="font-mono text-xs text-red-400 font-bold">
                0:{recordingSeconds.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleStopRealRecording}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                {t.send}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSendText}
            className="flex items-center gap-2 w-full"
            dir="rtl"
          >
            {/* Hidden Real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileSelect}
            />

            {/* Kurdish stickers & emoji icon */}
            <button
              type="button"
              onClick={() => setShowStickers(!showStickers)}
              className={`p-2.5 rounded-full transition-all cursor-pointer ${
                showStickers
                  ? 'bg-purple-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Real Device Photo Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="هەڵبژاردنی وێنە لە مۆبایل یان کامێرا"
              className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Coin Gift Button */}
            <button
              type="button"
              onClick={() => setShowCoinGiftModal(true)}
              title="ناردنی دیاریی کۆین بۆ ئەم کەسە"
              className="p-2.5 rounded-full text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
            >
              <Coins className="w-5 h-5" />
            </button>

            {/* Text input with Kurdish placeholder */}
            <input
              type="text"
              placeholder={t.typeMessage}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#141419] text-white placeholder-zinc-500 px-4 py-2.5 rounded-full border border-zinc-800 focus:outline-none focus:border-violet-500/70 text-sm shadow-inner"
              dir="auto"
            />

            {/* Send or Voice Record Button */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-violet-600/30 shrink-0"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRealRecording}
                title={t.recordVoice}
                className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-zinc-700/50"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Quick Coin Gift Dialog */}
      {showCoinGiftModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-[#121217] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white" dir="rtl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">ناردنی دیاریی کۆین</h3>
                  <p className="text-[11px] text-zinc-400">بۆ: {chat.contact.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoinGiftModal(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-zinc-400">باڵانسی تۆ:</span>
              <span className="font-extrabold text-amber-300">
                {(currentUser.coins ?? 100).toLocaleString()} کۆین
              </span>
            </div>

            {/* Preset Amount buttons */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">بڕی کۆین:</label>
              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setGiftCoinAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      giftCoinAmount === amt
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Note input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">پەیامی هاوپێچ (ئارەزوومەندانە):</label>
              <input
                type="text"
                value={giftCoinNote}
                onChange={(e) => setGiftCoinNote(e.target.value)}
                placeholder="سڵاو، ئەمەش دیارییەک بۆ تۆ 🌟"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendCoinGift}
                disabled={isSendingCoin || (currentUser.coins ?? 100) < giftCoinAmount}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-4 h-4" />
                <span>{isSendingCoin ? 'دەینێرێت...' : `ناردنی ${giftCoinAmount} کۆین`}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCoinGiftModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
