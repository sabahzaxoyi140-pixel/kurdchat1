import React, { useState } from 'react';
import { User, FollowRequest, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { UserBadges, KurdistanShield } from './KurdistanBadge';
import { Search, UserPlus, Check, X, Clock, MessageSquare, Shield, Sparkles } from 'lucide-react';

interface FriendsExploreViewProps {
  currentUser: User;
  users: User[];
  followRequests: FollowRequest[];
  dialect: Dialect;
  onSendFollowRequest: (toUserId: string) => void;
  onRespondFollowRequest: (requestId: string, action: 'accept' | 'reject') => void;
  onStartChat: (user: User) => void;
}

export const FriendsExploreView: React.FC<FriendsExploreViewProps> = ({
  currentUser,
  users,
  followRequests,
  dialect,
  onSendFollowRequest,
  onRespondFollowRequest,
  onStartChat,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[dialect];

  // Incoming pending requests directed to the current user
  const incomingRequests = followRequests.filter(
    (r) => r.toUserId === currentUser.id && r.status === 'pending'
  );

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser.id) return false;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  // Helper to determine relationship state with a user
  const getRelationState = (otherUserId: string) => {
    // Check incoming request
    const incoming = followRequests.find(
      (r) => r.fromUserId === otherUserId && r.toUserId === currentUser.id
    );
    if (incoming) {
      return { type: 'incoming', request: incoming };
    }

    // Check outgoing request
    const outgoing = followRequests.find(
      (r) => r.fromUserId === currentUser.id && r.toUserId === otherUserId
    );
    if (outgoing) {
      return { type: 'outgoing', request: outgoing };
    }

    return { type: 'none', request: null };
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-zinc-100 select-none overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-zinc-900/80 bg-[#09090b]/80 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{t.friends || 'هەڤال'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-800 text-violet-300 font-mono">
              {users.length}
            </span>
          </h1>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            هەمی کەسێن ل سەرخەت و پەسەندکرنا داخوازێن فۆلۆو
          </p>
        </div>

        {/* Incoming badge trigger */}
        {incomingRequests.length > 0 && (
          <button
            onClick={() => setActiveTab('requests')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 animate-pulse cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{incomingRequests.length} داخواز</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-neutral-900/60 bg-neutral-950/40">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#1e1e24] text-white border border-neutral-700/80'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t.allUsers || 'هەمی بکارهێنەر'} ({users.length - 1 > 0 ? users.length - 1 : 0})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'requests'
              ? 'bg-[#1e1e24] text-white border border-neutral-700/80'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>{t.incomingRequests || 'داخوازێن هاتین'}</span>
          {incomingRequests.length > 0 && (
            <span className="mr-1.5 px-1.5 py-0.2 rounded-full bg-pink-600 text-[10px] text-white font-mono">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Input */}
      {activeTab === 'all' && (
        <div className="px-4 py-2.5">
          <div className="relative flex items-center bg-[#1c1c1e] rounded-2xl px-3.5 py-2 border border-neutral-800/80 focus-within:border-purple-500 transition-all">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
            <input
              type="text"
              placeholder="گەڕیان ب ناڤ یان Username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-neutral-400 text-xs focus:outline-none text-right font-sans"
              dir="rtl"
            />
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 no-scrollbar">
        {/* Tab 1: All Registered Users */}
        {activeTab === 'all' && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                چ کەس نەهاتنە دیتن
              </div>
            ) : (
              filteredUsers.map((user) => {
                const relation = getRelationState(user.id);
                const isFriend = relation.request?.status === 'accepted';
                const isPendingOutgoing = relation.type === 'outgoing' && relation.request?.status === 'pending';
                const isPendingIncoming = relation.type === 'incoming' && relation.request?.status === 'pending';

                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-[#141418] border border-neutral-800/80 hover:border-neutral-700 transition-all flex items-center justify-between gap-3"
                  >
                    {/* User Profile Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-purple-900 flex items-center justify-center font-bold text-sm text-white">
                            {user.name[0]}
                          </div>
                        )}
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white truncate">
                            {user.name}
                          </span>
                          <UserBadges user={user} />
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          @{user.username}
                        </span>
                        {user.bio && (
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-[170px]">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isFriend ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{t.following || 'هەڤال'}</span>
                          </span>
                          <button
                            onClick={() => onStartChat(user)}
                            title="چات"
                            className="p-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isPendingOutgoing ? (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-medium flex items-center gap-1 opacity-80 cursor-default"
                        >
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>داخواز هنارت</span>
                        </button>
                      ) : isPendingIncoming && relation.request ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onRespondFollowRequest(relation.request!.id, 'accept')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            {t.accept || 'پەسەندکرن'}
                          </button>
                          <button
                            onClick={() => onRespondFollowRequest(relation.request!.id, 'reject')}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSendFollowRequest(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm shadow-violet-600/20 transition-all cursor-pointer active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{t.follow || 'فۆلۆو'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Tab 2: Incoming Follow Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 text-neutral-600" />
                <span className="text-xs">{t.noRequests || 'چ داخوازێن نوو نینن'}</span>
              </div>
            ) : (
              incomingRequests.map((req) => {
                const requester = users.find((u) => u.id === req.fromUserId);
                if (!requester) return null;

                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1b1724] to-[#141419] border border-purple-900/40 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={requester.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${requester.username}`}
                          alt={requester.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-600/50"
                        />
                        <div className="flex flex-col text-right">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {requester.name}
                            </span>
                            <UserBadges user={requester} />
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            @{requester.username}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
                        داخوازی
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 text-right bg-black/40 rounded-xl p-2.5 border border-neutral-800/60">
                      ئەڤ کەسە داخواز دکەت ببیتە هەڤالێ تە و نامەیان بگەهینیت.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onRespondFollowRequest(req.id, 'accept')}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.accept || 'پەسەندکرن'}</span>
                      </button>
                      <button
                        onClick={() => onRespondFollowRequest(req.id, 'reject')}
                        className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>{t.reject || 'ڕەتکرن'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
