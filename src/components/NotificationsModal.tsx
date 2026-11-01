import React, { useState } from 'react';
import { AppNotification, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import {
  X,
  Bell,
  Heart,
  UserPlus,
  UserCheck,
  MessageSquare,
  Megaphone,
  Coins,
  CheckCheck,
  Trash2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface NotificationsModalProps {
  notifications: AppNotification[];
  dialect: Dialect;
  onClose: () => void;
  onMarkAsRead: (notificationId?: string) => void;
  onClearNotifications: () => void;
  onSelectNotificationAction?: (notification: AppNotification) => void;
  onSendTestNotification?: (type: 'follow_request' | 'story_like' | 'message' | 'coin_gift') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  dialect,
  onClose,
  onMarkAsRead,
  onClearNotifications,
  onSelectNotificationAction,
  onSendTestNotification,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'messages' | 'follows' | 'likes' | 'coins'>('all');
  const [showTestMenu, setShowTestMenu] = useState(false);
  const t = translations[dialect];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'messages') return n.type === 'message';
    if (activeFilter === 'follows') return n.type === 'follow_request' || n.type === 'follow_accept';
    if (activeFilter === 'likes') return n.type === 'story_like';
    if (activeFilter === 'coins') return n.type === 'coin_gift';
    return true;
  });

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'story_like':
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />;
      case 'follow_request':
        return <UserPlus className="w-3.5 h-3.5 text-violet-400" />;
      case 'follow_accept':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'coin_gift':
        return <Coins className="w-3.5 h-3.5 text-amber-400" />;
      case 'verification_approved':
      case 'verification_request':
        return <Bell className="w-3.5 h-3.5 text-blue-400" />;
      case 'verification_rejected':
        return <Bell className="w-3.5 h-3.5 text-rose-400" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'broadcast':
        return <Megaphone className="w-3.5 h-3.5 text-amber-300" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getBadgeBgForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'story_like':
        return 'bg-rose-950/80 border-rose-800/80';
      case 'follow_request':
        return 'bg-violet-950/80 border-violet-800/80';
      case 'follow_accept':
        return 'bg-emerald-950/80 border-emerald-800/80';
      case 'coin_gift':
        return 'bg-amber-950/80 border-amber-800/80';
      case 'verification_approved':
      case 'verification_request':
        return 'bg-blue-950/80 border-blue-500/80';
      case 'verification_rejected':
        return 'bg-rose-950/80 border-rose-800/80';
      case 'message':
        return 'bg-blue-950/80 border-blue-800/80';
      case 'broadcast':
        return 'bg-amber-950/80 border-amber-700/80';
      default:
        return 'bg-zinc-900 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none" dir="rtl">
      <div className="w-full max-w-[440px] bg-[#121217] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col relative text-zinc-100 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{dialect === 'english' ? 'Notifications' : dialect === 'badini' ? 'ئاگەهداری' : 'ئاگادارییەکان'}</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold font-mono">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {dialect === 'english' ? 'Real-time updates and activity' : dialect === 'badini' ? 'هەمی ئاگەهداری و کارلێکێن تە' : 'ئاگادارییەکان بۆ نامە، فۆڵۆو و لایکی ستۆری'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onSendTestNotification && (
              <button
                type="button"
                onClick={() => setShowTestMenu(!showTestMenu)}
                title="تاقیکردنەوەی ئاگادارییەکان"
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Test Notification Dropdown */}
        {showTestMenu && onSendTestNotification && (
          <div className="p-2.5 my-2 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-1.5 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-zinc-300">تاقیکردنەوەی خێرای ئاگادارییەکان:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onSendTestNotification('follow_request');
                  setShowTestMenu(false);
                }}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-violet-950/50 border border-zinc-800 text-zinc-200 text-xs rounded-xl flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                <span>ئاگاداری فۆلۆو</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendTestNotification('story_like');
                  setShowTestMenu(false);
                }}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-rose-950/50 border border-zinc-800 text-zinc-200 text-xs rounded-xl flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>لایکی ستۆری</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendTestNotification('message');
                  setShowTestMenu(false);
                }}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-blue-950/50 border border-zinc-800 text-zinc-200 text-xs rounded-xl flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>نامەی نوێ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendTestNotification('coin_gift');
                  setShowTestMenu(false);
                }}
                className="py-1.5 px-2 bg-zinc-900 hover:bg-amber-950/50 border border-zinc-800 text-zinc-200 text-xs rounded-xl flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>دیاریی کۆین</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter & Actions Bar */}
        <div className="py-2.5 flex items-center justify-between gap-2 border-b border-zinc-800/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dialect === 'english' ? 'All' : dialect === 'badini' ? 'هەمی' : 'هەموو'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dialect === 'english' ? 'Unread' : dialect === 'badini' ? 'نەخوێندتی' : 'نەخوێندراو'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('follows')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'follows'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dialect === 'english' ? 'Follows' : 'فۆڵۆو'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('likes')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'likes'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dialect === 'english' ? 'Likes' : 'لایک'}
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkAsRead()}
                title="هەمووی بخوێنەوە"
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-violet-300 border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <CheckCheck className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">خوێندنەوە</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearNotifications}
                title="سڕینەوەی هەمووی"
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-2 max-h-[55vh]">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                {activeFilter === 'unread'
                  ? (dialect === 'english' ? 'No unread notifications' : 'هیچ ئاگادارییەکی نەخوێندراو نییە')
                  : (dialect === 'english' ? 'No notifications yet' : 'هیچ ئاگادارییەک نییە')}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                {dialect === 'english'
                  ? 'Activity such as messages, story likes, and follows will appear here.'
                  : 'ئاگاداری بۆ نامە، لایکی ستۆری و فۆڵۆوەکان لێرە دەردەکەون.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkAsRead(notif.id);
                    if (onSelectNotificationAction) onSelectNotificationAction(notif);
                  }}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    notif.read
                      ? 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/60 text-zinc-300'
                      : 'bg-violet-950/20 hover:bg-violet-950/30 border-violet-900/50 text-white'
                  }`}
                >
                  {/* Avatar + Type badge */}
                  <div className="relative shrink-0">
                    <img
                      src={notif.actorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actorId}`}
                      alt={notif.actorName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700/60"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actorName}`;
                      }}
                    />
                    <span
                      className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border flex items-center justify-center ${getBadgeBgForType(
                        notif.type
                      )}`}
                    >
                      {getIconForType(notif.type)}
                    </span>
                  </div>

                  {/* Body content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-sans">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-violet-400">
                        ● {dialect === 'english' ? 'New' : 'نوێ'}
                      </span>
                    )}
                  </div>

                  <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:-translate-x-0.5 transition-transform shrink-0 self-center" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
