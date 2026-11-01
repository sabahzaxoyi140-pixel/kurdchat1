import React, { useState } from 'react';
import { Chat, Story, User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { KurdChatLogo } from './KurdChatLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { KurdistanShield, KurdistanAdminVerifyBadge, KurdistanFlagPill, UserBadges, BlueVerifiedBadge } from './KurdistanBadge';
import {
  Search,
  LogOut,
  Plus,
  PhoneMissed,
  CheckCheck,
  Mic,
  SlidersHorizontal,
  Sparkles,
  Lock,
  Bell,
  Shield,
  MessageSquare,
  Coins,
  Radio,
  Dices,
} from 'lucide-react';

interface ChatListProps {
  currentUser: User;
  chats: Chat[];
  stories: Story[];
  selectedChatId: string | null;
  dialect: Dialect;
  unreadNotificationsCount?: number;
  onOpenWallet: () => void;
  onOpenVoiceChat?: () => void;
  onOpenDomino?: () => void;
  onSelectChat: (chatId: string) => void;
  onOpenStory: (storyIndex: number) => void;
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  currentUser,
  chats,
  stories,
  selectedChatId,
  dialect,
  unreadNotificationsCount = 0,
  onOpenWallet,
  onOpenVoiceChat,
  onOpenDomino,
  onSelectChat,
  onOpenStory,
  onOpenNewChat,
  onOpenSettings,
  onOpenAdmin,
  onOpenNotifications,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatTab, setActiveChatTab] = useState<'normal' | 'requests'>('normal');
  const t = translations[dialect];

  const filteredChats = chats.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.contact.name.toLowerCase().includes(q) ||
      c.contact.username.toLowerCase().includes(q) ||
      (c.lastMessage.text && c.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const normalChats = filteredChats.filter((c) => !c.isLocked);
  const requestChats = filteredChats.filter((c) => c.isLocked);
  const displayedChats = activeChatTab === 'normal' ? normalChats : requestChats;

  // Check if current user has an active story
  const myStoryIndex = stories.findIndex((s) => s.userId === currentUser.id);
  const hasMyStory = myStoryIndex !== -1;
  const otherStories = stories.filter((s) => s.userId !== currentUser.id);

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-zinc-100 select-none overflow-hidden border-r border-zinc-900/80">
      {/* Top Header - Modern Minimalist Bar */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-900/70 bg-[#09090b]/80 backdrop-blur-md">
        {/* Left: Logout icon */}
        <button
          onClick={onLogout}
          title={t.logout}
          className="w-9 h-9 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center border border-zinc-800/60"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Center: Brand Title */}
        <div className="flex items-center gap-2">
          <KurdChatLogo size="sm" />
          <h1 className="text-lg font-bold tracking-tight text-white">
            {t.chats}
          </h1>
        </div>

        {/* Right: Balance, Domino, Voice Chat, Notifications, Admin, New Chat & Profile */}
        <div className="flex items-center gap-1.5">
          {/* Coin Balance Pill Button */}
          <button
            onClick={onOpenWallet}
            title={dialect === 'english' ? 'Coin Wallet' : dialect === 'badini' ? 'باڵانسی کۆینان' : 'باڵانسی کۆین'}
            className="h-9 px-2 sm:px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-200 tracking-tight">
              {(currentUser.coins ?? 100).toLocaleString()}
            </span>
          </button>

          {/* Domino LIVE Button */}
          {onOpenDomino && (
            <button
              onClick={onOpenDomino}
              title="دۆمینە LIVE"
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/35 hover:border-emerald-500/60 text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-200 hidden sm:inline">دۆمینە</span>
            </button>
          )}

          {/* Voice Chat Button */}
          {onOpenVoiceChat && (
            <button
              onClick={onOpenVoiceChat}
              title={dialect === 'english' ? 'Live Voice Chat' : dialect === 'badini' ? 'ژوورا دەنگەچاتێ' : 'دەنگەچاتی ڕاستەوخۆ'}
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/35 hover:border-violet-500/60 text-violet-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-violet-200 hidden sm:inline">Voice</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            title={dialect === 'english' ? 'Notifications' : dialect === 'badini' ? 'ئاگەهداری' : 'ئاگادارییەکان'}
            className="w-9 h-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer relative flex items-center justify-center border border-zinc-800"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center border border-[#09090b] shadow-sm animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Admin Panel button - sleek Lucide Shield */}
          <button
            onClick={onOpenAdmin}
            title="Admin Panel"
            className="h-9 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-violet-500/50 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-zinc-200 hidden sm:inline">Admin</span>
          </button>

          {/* New Chat */}
          <button
            onClick={onOpenNewChat}
            title={t.newChat}
            className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer flex items-center justify-center shadow-sm shadow-violet-600/30"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Settings & Avatar */}
          <button
            onClick={onOpenSettings}
            title={t.settings}
            className="p-0.5 rounded-full relative cursor-pointer group shrink-0"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className={`w-8 h-8 rounded-full object-cover ring-2 ${
                  currentUser.isVerified ? 'ring-blue-500' : 'ring-zinc-700'
                } group-hover:ring-blue-400 transition-all`}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center font-bold text-xs text-white">
                {currentUser.name[0]}
              </div>
            )}
            {currentUser.isVerified && (
              <span className="absolute -top-1 -right-1 drop-shadow-sm pointer-events-none">
                <BlueVerifiedBadge size="xs" />
              </span>
            )}
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#09090b] rounded-full" />
          </button>
        </div>
      </div>

      {/* Modern Search Input */}
      <div className="px-4 py-2.5 flex items-center gap-2">
        <div className="relative flex items-center flex-1 bg-[#121217] rounded-2xl px-3.5 py-2 border border-zinc-800/80 focus-within:border-violet-500/70 transition-all shadow-inner">
          <Search className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none text-right font-sans"
            dir="rtl"
          />
        </div>
        <PWAInstallButton />
      </div>

      {/* Stories / Status Carousel */}
      <div className="px-4 py-3 border-b border-zinc-900/80 flex flex-col gap-1.5 bg-[#0a0a0d]">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* First Item: "ستۆریت" (Your Story / Add Story) */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (hasMyStory) {
                    onOpenStory(myStoryIndex);
                  } else {
                    onOpenStory(-1); // Opens Add Story Creator directly!
                  }
                }}
                className={`p-0.5 rounded-full transition-transform active:scale-95 cursor-pointer flex items-center justify-center ${
                  hasMyStory
                    ? 'bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 p-[2.5px] shadow-md shadow-violet-600/30'
                    : 'border-2 border-dashed border-zinc-700 hover:border-violet-500 p-0.5'
                }`}
                title={hasMyStory ? 'بینینی ستۆریێ تە' : 'دانانا ستۆریێ نوی'}
              >
                <div className="rounded-full bg-black overflow-hidden w-12 h-12 flex items-center justify-center">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-violet-700 flex items-center justify-center font-bold text-white text-base">
                      {currentUser.name[0]}
                    </div>
                  )}
                </div>
              </button>

              {/* Plus Badge button - ALWAYS allows adding a new story */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStory(-1);
                }}
                title="دانانا ستۆریێ نوی"
                className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-violet-600 hover:bg-violet-500 rounded-full border-2 border-[#09090b] flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer shadow-sm"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-zinc-300">
              {t.yourStory || 'ستۆریت'}
            </span>
          </div>

          {/* Stories published by other contacts */}
          {otherStories.map((story) => {
            const realIdx = stories.findIndex((s) => s.id === story.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => onOpenStory(realIdx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div
                  className={`relative p-0.5 rounded-full ${
                    story.viewed
                      ? 'ring-1 ring-zinc-800'
                      : 'bg-gradient-to-tr from-violet-600 via-pink-500 to-blue-500 group-hover:scale-105 transition-transform'
                  }`}
                >
                  <div className="p-0.5 rounded-full bg-black">
                    {story.userAvatar ? (
                      <img
                        src={story.userAvatar}
                        alt={story.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-violet-700 flex items-center justify-center font-bold text-white text-base">
                        {story.userName[0]}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 max-w-[56px] truncate transition-colors">
                  {story.userName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chats Sub-tabs: Messages vs Locked Requests */}
      <div className="px-4 py-1.5 flex items-center gap-2 border-b border-zinc-900/70 bg-[#0c0c10]/50">
        <button
          onClick={() => setActiveChatTab('normal')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeChatTab === 'normal'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.messages || 'نامەکان'} ({normalChats.length})
        </button>
        <button
          onClick={() => setActiveChatTab('requests')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeChatTab === 'requests'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Lock className="w-3 h-3 text-amber-400" />
          <span>{dialect === 'english' ? 'Requests' : dialect === 'badini' ? 'داخواز' : 'داخوازییەکان'}</span>
          {requestChats.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              {requestChats.length}
            </span>
          )}
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-900/60">
        {displayedChats.length > 0 ? (
          displayedChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            const isMissedCall =
              chat.lastMessage.type === 'call' &&
              chat.lastMessage.callStatus === 'missed';
            const isVoice = chat.lastMessage.type === 'voice';

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`px-4 py-3.5 flex items-center gap-3.5 cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-zinc-900/90 border-r-2 border-violet-500'
                    : 'hover:bg-zinc-900/40'
                }`}
                dir="rtl"
              >
                {/* Contact Avatar */}
                <div className="relative shrink-0">
                  {chat.contact.avatar ? (
                    <img
                      src={chat.contact.avatar}
                      alt={chat.contact.name}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-zinc-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-base">
                      {chat.contact.name === 'Hii' ? 'H' : chat.contact.name[0]}
                    </div>
                  )}

                  {chat.contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#09090b] rounded-full ring-1 ring-emerald-400/50" />
                  )}
                </div>

                {/* Content: Name and Last Message */}
                <div className="flex flex-col flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-[14px] text-white tracking-tight truncate">
                        {chat.contact.name}
                      </span>
                      {chat.isLocked && (
                        <span className="p-0.5 rounded bg-amber-950/70 border border-amber-800/80 text-amber-400" title="داخواز / قفلکرییە">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      <UserBadges user={chat.contact} size="xs" />
                    </div>
                    <span className="text-[11px] text-zinc-500 font-sans shrink-0">
                      {chat.lastMessage.timestamp}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 truncate text-zinc-400">
                      {isMissedCall ? (
                        <>
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-rose-400 font-medium truncate">
                            {chat.lastMessage.text || t.callCancelled}
                          </span>
                        </>
                      ) : isVoice ? (
                        <>
                          <Mic className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span className="text-violet-300 truncate">
                            {t.voiceNote} ({chat.lastMessage.audioDuration || 14}s)
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-400 truncate">
                          {chat.lastMessage.senderId === currentUser.id
                            ? `${chat.lastMessage.text} :${t.you}`
                            : chat.lastMessage.text}
                        </span>
                      )}
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold shrink-0 shadow-sm">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-400 gap-3">
            <p className="text-xs">{t.noChatsFound}</p>
            <button
              onClick={onOpenNewChat}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-violet-600/30 transition-all"
            >
              {t.startChat}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
