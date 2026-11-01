import React from 'react';
import { Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { MessageSquare, Users, Sparkles, Settings as SettingsIcon, Dices } from 'lucide-react';

export type ActiveTab = 'home' | 'friends' | 'domino' | 'stories' | 'settings';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  dialect: Dialect;
  onTabChange: (tab: ActiveTab) => void;
  pendingRequestsCount?: number;
  unreadMessagesCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  dialect,
  onTabChange,
  pendingRequestsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const t = translations[dialect];

  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: t.home || 'سەرەکی',
      icon: MessageSquare,
      badge: unreadMessagesCount,
      isLive: false,
    },
    {
      id: 'friends' as ActiveTab,
      label: t.friends || 'هەڤال',
      icon: Users,
      badge: pendingRequestsCount,
      isLive: false,
    },
    {
      id: 'domino' as ActiveTab,
      label: 'دۆمینە LIVE',
      icon: Dices,
      badge: 0,
      isLive: true,
    },
    {
      id: 'stories' as ActiveTab,
      label: t.storiesTab || 'ستۆری',
      icon: Sparkles,
      badge: 0,
      isLive: false,
    },
    {
      id: 'settings' as ActiveTab,
      label: t.settingsTab || 'ڕێکخستن',
      icon: SettingsIcon,
      badge: 0,
      isLive: false,
    },
  ];

  return (
    <div className="w-full bg-[#0d0d11]/95 backdrop-blur-2xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around select-none z-30 shrink-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-2xl transition-all cursor-pointer relative group ${
              isActive
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div
              className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
                isActive ? 'bg-violet-600/20 text-violet-400 shadow-sm' : 'group-hover:bg-zinc-800/50'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-105 text-violet-400' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />

              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-violet-600 text-[10px] font-bold text-white flex items-center justify-center border border-[#0d0d11] shadow-sm">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {item.isLive && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-emerald-500 text-[8px] font-black text-black tracking-tighter uppercase shadow-sm animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            <span
              className={`text-[11px] mt-0.5 transition-colors tracking-tight font-medium ${
                isActive ? 'text-violet-300 font-bold' : 'text-zinc-400 group-hover:text-zinc-300'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
