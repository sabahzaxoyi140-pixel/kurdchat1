import React, { useState, useRef, useEffect } from 'react';
import { User, Story, Chat, Message, AdminPermissions, VerificationRequest } from '../types/chat';
import { KurdistanShield, KurdistanAdminVerifyBadge, BlueVerifiedBadge, UserBadges, KurdistanSunEmoji } from './KurdistanBadge';
import {
  X,
  Megaphone,
  Trash2,
  LogOut,
  ShieldAlert,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Check,
  Search,
  UserX,
  UserCheck,
  Crown,
  Play,
  Eye,
  BadgeCheck,
  AlertTriangle,
  Camera,
  Upload,
  Shield,
  KeyRound,
  Save,
  Ban,
  User as UserIcon,
  Coins,
} from 'lucide-react';

interface AdminPanelModalProps {
  currentUser: User;
  allUsers: User[];
  chats: Chat[];
  stories: Story[];
  onClose: () => void;
  onUpdateAdminName: (newName: string) => void;
  onBroadcastMessage: (text: string) => void;
  onClearChats: () => void;
  onLogout: () => void;
  bannedUsers: string[];
  onToggleBanUser: (username: string) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeleteConversation: (chatId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onEditUser: (userId: string, data: { name?: string; bio?: string; avatar?: string; isVerified?: boolean; isAdmin?: boolean }) => void;
  onUpdatePermissions?: (targetUserId: string, isAdmin: boolean, permissions: AdminPermissions) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  currentUser,
  allUsers,
  chats,
  stories,
  onClose,
  onUpdateAdminName,
  onBroadcastMessage,
  onClearChats,
  onLogout,
  bannedUsers,
  onToggleBanUser,
  onDeleteUser,
  onDeleteMessage,
  onDeleteConversation,
  onDeleteStory,
  onEditUser,
  onUpdatePermissions,
}) => {
  const [adminName, setAdminName] = useState(currentUser.name || 'Sabah Sndi');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'main' | 'users' | 'verifications' | 'conversations' | 'stories' | 'broadcast' | 'clearConfirm'
  >('main');

  const [userSearch, setUserSearch] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [inspectingChatId, setInspectingChatId] = useState<string | null>(null);
  const [editingAvatarUserId, setEditingAvatarUserId] = useState<string | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<AdminPermissions>({});
  const [coinTargetUser, setCoinTargetUser] = useState<User | null>(null);
  const [coinGrantAmount, setCoinGrantAmount] = useState<number>(500);
  const [isGrantingCoins, setIsGrantingCoins] = useState(false);

  // Account Verification (Pejirandina Hesabê) State
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectPrompt, setRejectPrompt] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const fetchVerificationRequests = async () => {
    setIsLoadingVerifications(true);
    try {
      const res = await fetch('/api/admin/verification/requests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.requests)) {
          setVerificationRequests(data.requests);
        }
      }
    } catch (e) {
      console.error('Error fetching verification requests:', e);
    } finally {
      setIsLoadingVerifications(false);
    }
  };

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const handleReviewVerification = async (
    requestId: string,
    action: 'approve' | 'reject' | 'revoke',
    adminNote?: string
  ) => {
    try {
      const res = await fetch('/api/admin/verification/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          requestId,
          action,
          adminNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationRequests((prev) =>
          prev.map((r) => (r.id === requestId ? data.request : r))
        );
        if (data.user) {
          onEditUser(data.user.id, { isVerified: data.user.isVerified });
        }
        setRejectPrompt(null);
        setRejectReason('');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'هەڵە لە پێداچوونەوەی داواکاری');
      }
    } catch (e) {
      console.error('Error reviewing verification:', e);
    }
  };

  const handleGrantCoinsToUser = async () => {
    if (!coinTargetUser || isGrantingCoins) return;
    setIsGrantingCoins(true);
    try {
      const res = await fetch('/api/admin/users/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          targetUserId: coinTargetUser.id,
          amount: coinGrantAmount,
        }),
      });
      if (res.ok) {
        setCoinTargetUser(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'هەڵە لە بەخشینی کۆین');
      }
    } catch (e) {
      console.error('Error granting coins:', e);
    } finally {
      setIsGrantingCoins(false);
    }
  };

  const isSuperAdmin = currentUser.isSuperAdmin || currentUser.username.toLowerCase() === 'sabah';
  const perms = currentUser.adminPermissions || {};
  const canViewChats = isSuperAdmin || Boolean(perms.canViewChats);
  const canDeleteMessages = isSuperAdmin || Boolean(perms.canDeleteMessages);
  const canDeleteStories = isSuperAdmin || Boolean(perms.canDeleteStories);
  const canBanUsers = isSuperAdmin || Boolean(perms.canBanUsers);
  const canBroadcast = isSuperAdmin || Boolean(perms.canBroadcast);
  const canVerifyUsers = isSuperAdmin || Boolean(perms.canVerifyUsers);

  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const userFileInputRef = useRef<HTMLInputElement>(null);

  // Live real stats
  const totalMessagesCount = chats.reduce((acc, c) => acc + c.messages.length, 0);
  const totalUsersCount = allUsers.length > 0 ? allUsers.length : 1;
  const totalStoriesCount = stories.length;
  const bannedCount = bannedUsers.length;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;
    onUpdateAdminName(adminName.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcastMessage(broadcastText.trim());
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setBroadcastText('');
      setActiveTab('main');
    }, 1200);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const inspectingChat = chats.find((c) => c.id === inspectingChatId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-[440px] bg-[#151518] border border-neutral-800 rounded-[32px] p-5 shadow-2xl flex flex-col relative text-white max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Top Header matching screenshot */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#232328] hover:bg-[#2e2e34] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <KurdistanShield size="md" />
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Admin Panel
            </h2>
          </div>

          <div className="w-10" />
        </div>

        {/* Executive Super Admin Badge */}
        <div className="flex flex-col items-center gap-1 mb-4 p-2.5 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-emerald-950/40 border border-amber-500/30 rounded-2xl text-center">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              المدير العام والمدير التنفيذي والفني للموقع
            </span>
            <KurdistanAdminVerifyBadge size="sm" />
          </div>
          <p className="text-[11px] text-neutral-400">
            سەرپەرشتیار و بەڕێوەبەری باڵا: <strong className="text-white">Sabah Sndi ☀️</strong>
          </p>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 bg-[#1b1b20] p-1 rounded-2xl mb-4 overflow-x-auto no-scrollbar border border-neutral-800/80 text-xs">
          <button
            onClick={() => {
              setActiveTab('main');
              setInspectingChatId(null);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer font-semibold ${
              activeTab === 'main'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            سەرەکی
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer font-semibold ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            بەکارهێنەران ({totalUsersCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('verifications');
              fetchVerificationRequests();
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer font-semibold flex items-center justify-center gap-1 ${
              activeTab === 'verifications'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>پەژراندن</span>
            {verificationRequests.filter((r) => r.status === 'pending').length > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 text-[10px] font-black rounded-full shadow-xs">
                {verificationRequests.filter((r) => r.status === 'pending').length}
              </span>
            ) : (
              <BlueVerifiedBadge size="xs" />
            )}
          </button>
          {canViewChats && (
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer font-semibold ${
                activeTab === 'conversations'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              گفتوگۆکان ({chats.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer font-semibold ${
              activeTab === 'stories'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ستۆری ({totalStoriesCount})
          </button>
        </div>

        {/* TAB 1: MAIN DASHBOARD */}
        {activeTab === 'main' && (
          <div className="flex flex-col gap-4">
            {/* Admin Name Row matching screenshot */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <KurdistanAdminVerifyBadge size="sm" />
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>ناوی Admin (Sabah Sndi)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-violet-600/25 shrink-0"
                >
                  <span>{isSaved ? 'پاشەکەوت کرا' : 'پاشەکەوت'}</span>
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-[#1e1e24] text-white px-3.5 py-2.5 rounded-2xl border border-zinc-700/60 focus:border-violet-500 focus:outline-none text-right font-medium text-xs"
                    dir="rtl"
                  />
                  <span className="absolute left-3 top-3 text-[10px] text-amber-400 pointer-events-none">
                    <Crown className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Avatar & Photo Editor */}
            <div className="flex items-center justify-between p-3 bg-[#18181e] border border-zinc-800 rounded-2xl" dir="rtl">
              <div className="flex items-center gap-3">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => adminFileInputRef.current?.click()}
                  title="کلیک بکە بۆ گۆڕینی وێنەی ئەدمین لە مۆبایل"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-600 font-bold flex items-center justify-center text-white">
                      {currentUser.name[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">وێنەی پڕۆفایلی ئەدمین</span>
                    <Camera className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    گۆڕینی وێنە لە مۆبایل یان کامێرا
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => adminFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#22222a] hover:bg-zinc-700 border border-zinc-700 rounded-xl text-[11px] font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-violet-400" />
                <span>گۆڕین</span>
              </button>

              <input
                type="file"
                ref={adminFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    if (result) {
                      onEditUser(currentUser.id, { avatar: result });
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* 4 Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 my-1">
              {/* Card 1: Users */}
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="bg-[#18181e] hover:bg-[#202028] border border-zinc-800/90 rounded-[22px] p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-[1.02] group"
              >
                <span className="text-3xl font-extrabold text-emerald-400 mb-1 tracking-tight">
                  {totalUsersCount}
                </span>
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-violet-400" />
                  <span>بەکارهێنەر</span>
                </span>
              </button>

              {/* Card 2: Stories */}
              <button
                type="button"
                onClick={() => setActiveTab('stories')}
                className="bg-[#18181e] hover:bg-[#202028] border border-zinc-800/90 rounded-[22px] p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span className="text-3xl font-extrabold text-emerald-400 mb-1 tracking-tight">
                  {totalStoriesCount}
                </span>
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                  <span>ستۆری</span>
                </span>
              </button>

              {/* Card 3: Messages */}
              <button
                type="button"
                onClick={() => {
                  if (canViewChats) {
                    setActiveTab('conversations');
                  }
                }}
                className={`bg-[#18181e] hover:bg-[#202028] border border-zinc-800/90 rounded-[22px] p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-[1.02] ${
                  !canViewChats ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title={canViewChats ? 'گفتوگۆکان' : 'دەسەڵاتی بینینی چات پێویستە'}
              >
                <span className="text-3xl font-extrabold text-emerald-400 mb-1 tracking-tight">
                  {totalMessagesCount}
                </span>
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>نامە</span>
                </span>
              </button>

              {/* Card 4: Ban */}
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="bg-[#18181e] hover:bg-[#202028] border border-zinc-800/90 rounded-[22px] p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span className="text-3xl font-extrabold text-emerald-400 mb-1 tracking-tight">
                  {bannedCount}
                </span>
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ban</span>
                </span>
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-2.5">
              {canBroadcast && (
                <button
                  type="button"
                  onClick={() => setActiveTab('broadcast')}
                  className="w-full py-3.5 px-5 bg-[#18181e] hover:bg-[#22222a] active:bg-[#141418] border border-zinc-800 rounded-2xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:border-violet-500/40"
                >
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>ئاگاداری بۆ هەمووان</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('clearConfirm')}
                  className="w-full py-3.5 px-5 bg-[#18181e] hover:bg-[#22222a] active:bg-[#141418] border border-zinc-800 rounded-2xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:border-rose-500/40"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>پاککردنەوەی گفتوگۆ</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3.5 px-5 bg-[#18181e] hover:bg-[#22222a] active:bg-[#141418] border border-zinc-800 rounded-2xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:border-zinc-600"
              >
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT (Full Control & Ban) */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs text-neutral-400">
                کۆی گشتی: {filteredUsers.length} بەکارهێنەر
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>بەڕێوەبردنی بەکارهێنەران</span>
                <Users className="w-4 h-4 text-blue-400" />
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="گەڕان بەدوای بەکارهێنەردا..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#232328] text-white placeholder-neutral-500 px-3 py-2 text-xs rounded-xl border border-neutral-700/60 focus:border-blue-500 focus:outline-none"
                dir="rtl"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            </div>

            {/* Users List */}
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto no-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isBanned = bannedUsers.includes(user.username);
                  const isSabah = user.username === 'sabah_sndi';

                  return (
                    <div
                      key={user.id}
                      className="p-3 bg-[#1b1b20] border border-neutral-800/80 rounded-2xl flex flex-col gap-2"
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                              {user.name[0]}
                            </div>
                          )}
                          <div className="flex flex-col text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{user.name}</span>
                              <UserBadges user={user} size="xs" />
                              {isSabah && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              @{user.username}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 mt-0.5">
                              <Coins className="w-3 h-3 text-amber-400" />
                              <span>{(user.coins ?? 100).toLocaleString()} کۆین</span>
                            </div>
                            {user.bio && (
                              <span className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                                {user.bio}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status tags */}
                        <div className="flex items-center gap-1 shrink-0">
                          {user.isAdmin && !isSabah && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700 text-[10px] font-bold text-amber-300">
                              ئەدمین 👑
                            </span>
                          )}
                          {isBanned ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <Ban className="w-2.5 h-2.5" />
                              <span>باندکراوە</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>چالاک</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Admin Controls on this user */}
                      {!isSabah && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/60 justify-end flex-wrap">
                          {/* Super Admin Grant Coins */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setCoinTargetUser(user);
                                setCoinGrantAmount(500);
                              }}
                              title="بەخشینی کۆین بەم بەکارهێنەرە"
                              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <Coins className="w-3 h-3 text-amber-400" />
                              <span>بەخشینی کۆین</span>
                            </button>
                          )}

                          {/* Toggle Blue Verification Badge (Only if canVerifyUsers) */}
                          {canVerifyUsers && (
                            <button
                              type="button"
                              onClick={() =>
                                onEditUser(user.id, { isVerified: !user.isVerified })
                              }
                              title={
                                user.isVerified
                                  ? 'مسح المصادقة وإلغاء العلامة الزرقاء'
                                  : 'منح التوثيق بالعلامة الزرقاء'
                              }
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                user.isVerified
                                  ? 'bg-zinc-800 hover:bg-rose-950 text-zinc-300 hover:text-rose-300 border border-zinc-700'
                                  : 'bg-zinc-900 hover:bg-violet-950 text-violet-300 border border-violet-500/40'
                              }`}
                            >
                              <BlueVerifiedBadge size="xs" />
                              <span>{user.isVerified ? 'لابردنی باج' : 'بەخشینی باج'}</span>
                            </button>
                          )}

                          {/* Granular Admin Permissions (Only Super Admin Sabah can grant/revoke) */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPerms(user);
                                setTempPermissions(
                                  user.adminPermissions || {
                                    canViewChats: true,
                                    canDeleteMessages: false,
                                    canDeleteStories: false,
                                    canBanUsers: false,
                                    canBroadcast: false,
                                    canVerifyUsers: false,
                                  }
                                );
                              }}
                              title="دیاریکردنا دەسەڵاتێن ئەدمینی یێن سنووردار"
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                user.isAdmin
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              <KeyRound className="w-3 h-3 text-amber-300" />
                              <span>{user.isAdmin ? 'دەسەڵات' : 'بەخشینا ئەدمینیێ'}</span>
                            </button>
                          )}

                          {/* Ban / Unban (Only if canBanUsers) */}
                          {canBanUsers && (
                            <button
                              type="button"
                              onClick={() => onToggleBanUser(user.username)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                                isBanned
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-red-600 hover:bg-red-500 text-white'
                              }`}
                            >
                              {isBanned ? 'لابردنی Ban' : 'سزادان (Ban)'}
                            </button>
                          )}

                          {/* Change User Avatar */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAvatarUserId(user.id);
                              userFileInputRef.current?.click();
                            }}
                            title="گۆڕینی وێنەی ئەم بەکارهێنەرە"
                            className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-purple-400" />
                            <span>وێنە</span>
                          </button>

                          {/* Delete User Completely (Only Super Admin Sabah) */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`ئایا دڵنیایت لە سڕینەوەی یەکجاری هەژماری @${user.username}؟`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-950 hover:text-red-400 text-neutral-400 transition-colors cursor-pointer"
                              title="سڕینەوەی یەکجاری هەژمار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  هیچ بەکارهێنەرێک نەدۆزرایەوە
                </div>
              )}
            </div>

            {/* Hidden file input for updating other user's avatar */}
            <input
              type="file"
              ref={userFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || !editingAvatarUserId) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const result = ev.target?.result as string;
                  if (result) {
                    onEditUser(editingAvatarUserId, { avatar: result });
                    setEditingAvatarUserId(null);
                  }
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* TAB: ACCOUNT VERIFICATION REQUESTS (PEJIRANDINA HESABÊ) */}
        {activeTab === 'verifications' && (
          <div className="flex flex-col gap-3">
            {/* Header & Stats */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <button
                type="button"
                onClick={fetchVerificationRequests}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>نویژەنکرن ↻</span>
              </button>

              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>پەژراندنا هەژمارێ (Pejirandina Hesabê)</span>
                <BlueVerifiedBadge size="sm" />
              </span>
            </div>

            {/* Filter pills: All, Pending, Approved, Rejected */}
            <div className="flex items-center gap-1 bg-[#1b1b20] p-1 rounded-xl text-xs border border-neutral-800/80">
              <button
                type="button"
                onClick={() => setVerificationFilter('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  verificationFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                هەمی ({verificationRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('pending')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                  verificationFilter === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>چاڤدێری</span>
                <span className="px-1.5 py-0.2 bg-black/40 rounded-full text-[10px]">
                  {verificationRequests.filter((r) => r.status === 'pending').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('approved')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  verificationFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                پەژراندی ({verificationRequests.filter((r) => r.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('rejected')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer text-center ${
                  verificationFilter === 'rejected'
                    ? 'bg-rose-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ڕەتکری ({verificationRequests.filter((r) => r.status === 'rejected').length})
              </button>
            </div>

            {/* Verification Requests List */}
            <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto no-scrollbar">
              {isLoadingVerifications ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  خەریکە داخواز دهێنە بارکرن...
                </div>
              ) : verificationRequests.filter((r) =>
                  verificationFilter === 'all' ? true : r.status === verificationFilter
                ).length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <BadgeCheck className="w-8 h-8 text-zinc-600" />
                  <span>هیچ داواکارییەکی پەژراندن لەم بەشەدا نییە</span>
                </div>
              ) : (
                verificationRequests
                  .filter((r) => (verificationFilter === 'all' ? true : r.status === verificationFilter))
                  .map((vReq) => {
                    const isPending = vReq.status === 'pending';
                    const isApproved = vReq.status === 'approved';
                    const isRejected = vReq.status === 'rejected';

                    return (
                      <div
                        key={vReq.id}
                        className={`p-3 bg-[#191920] border rounded-2xl flex flex-col gap-2.5 text-right transition-all ${
                          isPending
                            ? 'border-amber-500/40 bg-amber-950/10'
                            : isApproved
                            ? 'border-blue-500/40 bg-blue-950/10'
                            : 'border-zinc-800'
                        }`}
                        dir="rtl"
                      >
                        {/* User Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {vReq.userAvatar ? (
                              <img
                                src={vReq.userAvatar}
                                alt={vReq.userName}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                                {vReq.userName?.[0] || 'U'}
                              </div>
                            )}

                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{vReq.userName}</span>
                                {isApproved && <BlueVerifiedBadge size="xs" />}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                @{vReq.username}
                              </span>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div>
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                <span>ل بن چاڤدێریێ</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                                <BlueVerifiedBadge size="xs" />
                                <span>پەژراندی 🔵✓</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold">
                                ڕەتکری ✕
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Request Details Grid */}
                        <div className="p-2.5 bg-black/40 border border-zinc-800/80 rounded-xl flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-500 text-[11px]">ناڤێ تەواو / یاسایی:</span>
                            <span className="font-bold text-white">{vReq.fullName}</span>
                          </div>

                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-500 text-[11px]">بەش / جۆر:</span>
                            <span className="font-bold text-blue-400">
                              {vReq.categoryLabel || vReq.category}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-500 text-[11px]">جۆرێ بەڵگەنامێ:</span>
                            <span className="text-zinc-300 font-medium">
                              {vReq.documentType === 'id_card'
                                ? 'ناسناما نیشتمانی'
                                : vReq.documentType === 'passport'
                                ? 'پاسپۆرت'
                                : 'بەستەرێ فەرمی'}
                            </span>
                          </div>

                          {vReq.documentNote && (
                            <div className="flex flex-col gap-0.5 pt-1 border-t border-zinc-800/60">
                              <span className="text-[10px] text-zinc-500">بەستەر یان وەسف:</span>
                              <span className="text-[11px] text-zinc-300 font-mono break-all">
                                {vReq.documentNote}
                              </span>
                            </div>
                          )}

                          {/* Attached Document Image Preview */}
                          {vReq.documentUrl && (
                            <div className="mt-1 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-500">وێنەی بەڵگەنامێ:</span>
                              <button
                                type="button"
                                onClick={() => setExpandedImage(vReq.documentUrl || null)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>دیتنا وێنەی</span>
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {vReq.adminNote && (
                            <div className="mt-1 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800 text-[11px] text-zinc-300">
                              <span className="font-bold text-amber-300 block mb-0.5">تێبینی:</span>
                              <span>{vReq.adminNote}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons for Super Admin Sabah & Authorized Admins */}
                        {canVerifyUsers && (
                          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60 justify-end">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReviewVerification(vReq.id, 'approve')}
                                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <BlueVerifiedBadge size="xs" />
                                  <span>پەسەندکرن و بەخشینا باجێ شین 🔵✓</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectPrompt({ id: vReq.id, name: vReq.userName })}
                                  className="py-2 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  ڕەتکرن ✕
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => handleReviewVerification(vReq.id, 'revoke')}
                                className="py-1.5 px-3 bg-zinc-900 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-800 text-zinc-300 hover:text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                لابردنا پەژراندنێ (Revoke)
                              </button>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleReviewVerification(vReq.id, 'approve')}
                                className="py-1.5 px-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>پەسەندکرنی دووبارە</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONVERSATION INSPECTOR & DELETION */}
        {activeTab === 'conversations' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs text-neutral-400">
                {inspectingChat ? 'پشکنینی گفتوگۆ' : `سەرجەم چاتەکان: ${chats.length}`}
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>چاودێری گفتوگۆکان</span>
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </span>
            </div>

            {inspectingChat ? (
              // Inspecting a specific chat
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-800">
                  <button
                    onClick={() => setInspectingChatId(null)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    ← گەڕانەوە بۆ لیست
                  </button>
                  {canDeleteMessages && (
                    <button
                      onClick={() => {
                        if (confirm('ئایا دڵنیایت لە سڕینەوەی تەواوی ئەم چاتە؟')) {
                          onDeleteConversation(inspectingChat.id);
                          setInspectingChatId(null);
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>سڕینەوەی تەواوی گفتوگۆکە</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto no-scrollbar p-1">
                  {inspectingChat.messages.length > 0 ? (
                    inspectingChat.messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-[#1c1c21] border border-neutral-800 rounded-xl flex items-start justify-between gap-2 text-right"
                        dir="rtl"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                            <span>نێرەر: {m.senderId === currentUser.id ? 'ئەدمین (تۆ)' : m.senderId}</span>
                            <span>{m.timestamp}</span>
                          </div>

                          {m.type === 'image' && m.mediaUrl ? (
                            <img
                              src={m.mediaUrl}
                              alt="media"
                              className="w-32 h-24 object-cover rounded-lg my-1 border border-neutral-700"
                            />
                          ) : m.type === 'voice' ? (
                            <div className="flex items-center gap-2 text-xs text-purple-300 my-1">
                              <span>🎙️ نامەی دەنگی ({m.audioDuration || 14} چرکە)</span>
                            </div>
                          ) : (
                            <p className="text-xs text-white break-words">{m.text}</p>
                          )}
                        </div>

                        {canDeleteMessages && (
                          <button
                            onClick={() => onDeleteMessage(m.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                            title="سڕینەوەی ئەم نامەیە"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-neutral-500 text-xs">
                      هیچ نامەیەک لەم گفتوگۆیەدا نییە
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // List of all conversations
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto no-scrollbar">
                {chats.length > 0 ? (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className="p-3 bg-[#1b1b20] border border-neutral-800 rounded-2xl flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#222228] transition-colors"
                      dir="rtl"
                      onClick={() => setInspectingChatId(chat.id)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {chat.contact.avatar ? (
                          <img
                            src={chat.contact.avatar}
                            alt={chat.contact.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {chat.contact.name[0]}
                          </div>
                        )}
                        <div className="flex flex-col text-right flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">
                              {chat.contact.name}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {chat.messages.length} نامە
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {chat.lastMessage?.text || 'دواین پەیام'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingChatId(chat.id);
                          }}
                          className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-[10px] font-semibold transition-colors"
                        >
                          پشکنین 👁️
                        </button>
                        {canDeleteMessages && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم چاتە؟')) {
                                onDeleteConversation(chat.id);
                              }
                            }}
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-neutral-500 text-xs">
                    هێشتا هیچ گفتوگۆیەک ئەنجام نەدراوە
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STORIES MANAGEMENT & DELETION */}
        {activeTab === 'stories' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs text-neutral-400">
                کۆی ستۆرییەکان: {stories.length}
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>بەڕێوەبردنی ستۆرییەکان</span>
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
              {stories.length > 0 ? (
                stories.map((story) => (
                  <div
                    key={story.id}
                    className="p-3 bg-[#1b1b20] border border-neutral-800 rounded-2xl flex items-center justify-between gap-3"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={story.mediaUrl}
                        alt="Story media"
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-purple-500/50 shrink-0"
                      />
                      <div className="flex flex-col text-right flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">
                            {story.userName}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            • {story.timestamp}
                          </span>
                        </div>
                        {story.caption ? (
                          <p className="text-[11px] text-neutral-300 truncate mt-0.5">
                            {story.caption}
                          </p>
                        ) : (
                          <span className="text-[10px] text-neutral-500">
                            وێنەی بێ دەق
                          </span>
                        )}
                      </div>
                    </div>

                    {canDeleteStories && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم ستۆرییە؟')) {
                            onDeleteStory(story.id);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>سڕینەوە</span>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-500 text-xs">
                  هیچ ستۆرییەک نییە لە ئێستادا
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST ANNOUNCEMENT */}
        {activeTab === 'broadcast' && (
          <form onSubmit={handleSendBroadcast} className="flex flex-col gap-3 py-1">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs text-neutral-400">ئاگاداری بەپەلە</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>ئاگاداری بۆ هەمووان</span>
                <span>📢</span>
              </span>
            </div>

            <p className="text-xs text-neutral-400 text-right leading-relaxed">
              ئەم پەیامە لەلایەن <strong>المدير العام (Sabah Sndi)</strong> بۆ هەموو مۆبایل و پەردەکان دەنێردرێت دەستبەجێ:
            </p>

            <textarea
              placeholder="دەقی ئاگاداری فەرمی بنووسە... (سڵاو لە هەمووان، نوێکردنەوەی سیستەم ئەنجامدرا)"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full h-28 bg-[#232328] border border-neutral-700 rounded-2xl p-3 text-xs focus:border-blue-500 focus:outline-none resize-none text-white"
              dir="rtl"
            />

            {broadcastSuccess && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-center text-xs text-emerald-300 font-semibold">
                ئاگاداری بە سەرکەوتوویی بۆ هەمووان پەخشکرا! 📢☀️
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('main')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-xs font-semibold cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-xs font-bold text-white shadow-lg shadow-violet-600/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Megaphone className="w-4 h-4" />
                <span>ناردنی ئاگاداری</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 6: CLEAR CHATS CONFIRMATION */}
        {activeTab === 'clearConfirm' && (
          <div className="flex flex-col gap-3 py-3 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-800/80 mx-auto flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-white">سڕینەوەی سەرجەم نامەکان؟</h3>
            <p className="text-xs text-zinc-400 px-3">
              ئایا وەک بەڕێوەبەری گشتی دڵنیایت لە پاککردنەوەی تەواوی مێژووی نامەکان؟ ئەم کردارە ناگەڕێتەوە.
            </p>
            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setActiveTab('main')}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-xs font-semibold text-white cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearChats();
                  setActiveTab('main');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-bold text-white shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                بەڵێ، هەمووی بسڕەوە
              </button>
            </div>
          </div>
        )}

        {/* MODAL: Granular Admin Permissions for Assistant Admins (Only Sabah can grant) */}
        {selectedUserForPerms && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="w-full max-w-[390px] bg-[#1a1a1f] border border-neutral-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3" dir="rtl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>دەسەڵاتێن ئەدمینی (صلاحيات الأدمن)</span>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      بۆ: <strong className="text-amber-300">{selectedUserForPerms.name}</strong> (@{selectedUserForPerms.username})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForPerms(null)}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explanatory note */}
              <div className="p-2.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl text-[11px] text-neutral-300 text-right leading-relaxed" dir="rtl">
                وەک بەڕێوەبەرێ گشتی (Sabah)، دەتوانیت بە دروستی دیاری بکەیت ئەم بەکارهێنەرە تەنیا کام دەسەڵاتانەی هەبێت. ئەگەر هیچ هەڵنەبژێریت، ناتوانێت دەستکاری بکات:
              </div>

              {/* Checkboxes for 6 permissions */}
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar" dir="rtl">
                {/* 1. canViewChats */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">بینینی چات و نامەکان</span>
                      <span className="text-[10px] text-zinc-400">رؤية المحادثات ومراقبة الرسائل</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canViewChats)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canViewChats: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>

                {/* 2. canDeleteMessages */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">سڕینەوەی نامەکان</span>
                      <span className="text-[10px] text-zinc-400">حذف الرسائل والمحادثات</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canDeleteMessages)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canDeleteMessages: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>

                {/* 3. canDeleteStories */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">سڕینەوەی ستۆرییەکان</span>
                      <span className="text-[10px] text-zinc-400">حذف ستوريات المستخدمين</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canDeleteStories)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canDeleteStories: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>

                {/* 4. canBanUsers */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Ban className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">سزادان و باندکردن (Ban)</span>
                      <span className="text-[10px] text-zinc-400">حظر وفك الحظر عن المستخدمين</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canBanUsers)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canBanUsers: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>

                {/* 5. canBroadcast */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">ناردنی ئاگاداری گشتی</span>
                      <span className="text-[10px] text-zinc-400">إرسال إشعارات عامة لجميع المستخدمين</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canBroadcast)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canBroadcast: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>

                {/* 6. canVerifyUsers */}
                <label className="flex items-center justify-between p-2.5 bg-[#202026] hover:bg-[#26262e] border border-zinc-800 rounded-2xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <BlueVerifiedBadge size="sm" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-white">پێدانی باجی شین (تۆمارکردن)</span>
                      <span className="text-[10px] text-zinc-400">منح وتوثيق الحسابات بالعلامة الزرقاء</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(tempPermissions.canVerifyUsers)}
                    onChange={(e) =>
                      setTempPermissions((prev) => ({ ...prev, canVerifyUsers: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                {selectedUserForPerms.isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdatePermissions) {
                        onUpdatePermissions(selectedUserForPerms.id, false, {});
                      }
                      setSelectedUserForPerms(null);
                    }}
                    className="px-3 py-2.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-200 rounded-2xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>سەحبکردنی ئەدمینیێ</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePermissions) {
                      onUpdatePermissions(selectedUserForPerms.id, true, tempPermissions);
                    }
                    setSelectedUserForPerms(null);
                  }}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-xs font-bold text-white shadow-lg shadow-violet-600/25 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>پاشەکەوتکرنا دەسەڵاتان</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Coin Grant Modal */}
        {coinTargetUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#18181f] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white" dir="rtl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">بەخشینی کۆین (Super Admin)</h4>
                    <p className="text-[11px] text-zinc-400">بەکارهێنەر: {coinTargetUser.name} (@{coinTargetUser.username})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCoinTargetUser(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="text-zinc-400">باڵانسی ئێستای:</span>
                <span className="font-extrabold text-amber-300">
                  {(coinTargetUser.coins ?? 100).toLocaleString()} کۆین
                </span>
              </div>

              {/* Amount Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">بڕی دیاریکراو:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCoinGrantAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        coinGrantAmount === amt
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">یان بڕێکی تر بنووسە:</label>
                <input
                  type="number"
                  value={coinGrantAmount}
                  onChange={(e) => setCoinGrantAmount(Number(e.target.value))}
                  min={1}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleGrantCoinsToUser}
                  disabled={isGrantingCoins || coinGrantAmount <= 0}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-2xl text-xs cursor-pointer transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Coins className="w-4 h-4" />
                  <span>{isGrantingCoins ? 'خەریکە دەبەخشرێت...' : `بەخشینی ${coinGrantAmount} کۆین`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoinTargetUser(null)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Reject Verification Reason */}
        {rejectPrompt && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none">
            <div className="w-full max-w-[380px] bg-[#1a1a20] border border-rose-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-white text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <button
                  type="button"
                  onClick={() => setRejectPrompt(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                  <span>ڕەتکرنا پەژراندنا هەژمارێ</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
              </div>

              <p className="text-xs text-zinc-300">
                بۆچی داخوازیا <strong>{rejectPrompt.name}</strong> ڕەتدکەی؟ (ئەڤ تێبینیە دێ بۆ وی چیت):
              </p>

              {/* Quick Reason presets */}
              <div className="flex flex-col gap-1.5">
                {[
                  'پێدڤیە ناسناما فەرمی یان پاسپۆرت بار بکەی',
                  'زانیاریێن تۆمارکری ناتەواون و ناگونجن',
                  'بەستەرێ هەژمارێ یان وەسف نەیێ دروستە',
                  'ئەڤ هەژمارە ناگەهیتە مەرجێن فەرمی یێن کورد چات',
                ].map((reasonText) => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setRejectReason(reasonText)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-right text-[11px] text-zinc-300 hover:text-white cursor-pointer transition-all"
                  >
                    {reasonText}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="تێبینیا خۆ بنڤیسە..."
                rows={2}
                className="bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none font-medium"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleReviewVerification(rejectPrompt.id, 'reject', rejectReason.trim() || undefined)
                  }
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-rose-600/30"
                >
                  پشتڕاستکرنا ڕەتکرنێ ✕
                </button>
                <button
                  type="button"
                  onClick={() => setRejectPrompt(null)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  زڤڕین
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Full Document Image Preview */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setExpandedImage(null)}
          >
            <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                className="absolute top-2 left-2 p-2 bg-black/80 hover:bg-zinc-800 text-white rounded-full z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={expandedImage}
                alt="Document proof preview"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-zinc-700 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
