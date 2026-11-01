import React, { useState } from 'react';
import { User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { X, Search, UserPlus, Share2, Check, UserCheck } from 'lucide-react';
import { KurdistanAdminVerifyBadge, UserBadges } from './KurdistanBadge';

interface NewChatModalProps {
  currentUser: User;
  users: User[];
  dialect: Dialect;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  users,
  dialect,
  onClose,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const t = translations[dialect];

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#18181c] border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            {t.newChat}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#232328] text-white placeholder-neutral-400 pl-4 pr-10 py-3 rounded-2xl text-xs border border-neutral-700/60 focus:border-blue-500 focus:outline-none"
            dir={dialect === 'english' ? 'ltr' : 'rtl'}
          />
          <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Registered Users list */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-1 text-right">
            <span className="text-[11px] font-semibold text-neutral-400">
              {t.users} ({filteredUsers.length}):
            </span>
            <span className="text-[10px] text-emerald-400">بەردەست لەسەر هێڵ 🟢</span>
          </div>

          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectUser(user)}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-neutral-800/80 transition-all text-right cursor-pointer group"
                dir="rtl"
              >
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-700 group-hover:ring-blue-500 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                      {user.name[0]}
                    </div>
                  )}
                  {user.isOnline !== false && (
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#18181c] rounded-full" />
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white truncate">
                      {user.name}
                    </span>
                    <UserBadges user={user} size="xs" />
                  </div>
                  <span className="text-xs text-neutral-400 truncate">
                    @{user.username}
                  </span>
                  {user.bio && (
                    <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {user.bio}
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="py-6 px-3 flex flex-col items-center justify-center text-center gap-3 bg-neutral-900/40 rounded-2xl border border-neutral-800/60">
              <p className="text-xs text-neutral-400 leading-relaxed">
                {searchTerm
                  ? 'هیچ بەکارهێنەرێک نەدۆزرایەوە بەم ناوە'
                  : 'تۆ یەکەم کەسیت لێرە! لینکی کورد چات بنێرە بۆ هاوڕێکانت تا بێنە ناو بەرنامەکە ☀️'}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    لینک کۆپیکرا!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    کۆپیکردنی لینکی ئەپ
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
