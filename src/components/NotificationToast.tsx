import React, { useEffect, useState } from 'react';
import { AppNotification, Dialect } from '../types/chat';
import {
  Heart,
  UserPlus,
  UserCheck,
  MessageSquare,
  Coins,
  Megaphone,
  Bell,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationToastProps {
  notification: AppNotification | null;
  dialect: Dialect;
  onClose: () => void;
  onOpenNotification: (notification: AppNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  dialect,
  onClose,
  onOpenNotification,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const duration = 4800;
    const interval = 50;
    const decrement = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, interval);

    const dismissTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification?.id, onClose]);

  if (!notification) return null;

  const getActionIcon = () => {
    switch (notification.type) {
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
      case 'broadcast':
        return <Megaphone className="w-3.5 h-3.5 text-amber-300" />;
      case 'message':
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  const getBadgeStyle = () => {
    switch (notification.type) {
      case 'story_like':
        return 'bg-rose-950/90 border-rose-700/80 text-rose-300';
      case 'follow_request':
        return 'bg-violet-950/90 border-violet-700/80 text-violet-300';
      case 'follow_accept':
        return 'bg-emerald-950/90 border-emerald-700/80 text-emerald-300';
      case 'coin_gift':
        return 'bg-amber-950/90 border-amber-700/80 text-amber-300';
      case 'verification_approved':
      case 'verification_request':
        return 'bg-blue-950/90 border-blue-500/80 text-blue-300';
      case 'verification_rejected':
        return 'bg-rose-950/90 border-rose-700/80 text-rose-300';
      case 'broadcast':
        return 'bg-amber-950/90 border-amber-600/80 text-amber-200';
      default:
        return 'bg-violet-950/90 border-violet-700/80 text-violet-300';
    }
  };

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300 select-none"
      dir="rtl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#14141c]/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl shadow-black/80 p-3.5 text-zinc-100 flex items-center justify-between gap-3">
        {/* Progress bar at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Left: Avatar with type icon badge */}
        <div className="relative shrink-0">
          <img
            src={
              notification.actorAvatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.actorId || 'kurd'}`
            }
            alt={notification.actorName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-700/80"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=user`;
            }}
          />
          <span
            className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border flex items-center justify-center shadow-md ${getBadgeStyle()}`}
          >
            {getActionIcon()}
          </span>
        </div>

        {/* Center: Info text */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            onOpenNotification(notification);
            onClose();
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate">
              {notification.actorName || notification.title}
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">
              · {notification.timestamp || 'ئێستا'}
            </span>
          </div>
          <p className="text-xs text-zinc-300 truncate mt-0.5 leading-snug">
            {notification.content}
          </p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenNotification(notification);
              onClose();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">
              {dialect === 'english' ? 'View' : dialect === 'badini' ? 'ڤەکە' : 'ببینە'}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
