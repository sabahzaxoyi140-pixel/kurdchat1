import React, { useState, useRef } from 'react';
import { User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { KurdistanVerifiedBadgeIcon, KurdistanSunEmoji, KurdistanAdminVerifyBadge, UserBadges, BlueVerifiedBadge } from './KurdistanBadge';
import { downloadProjectZipOffline } from '../utils/downloadZip';
import { AccountVerificationModal } from './AccountVerificationModal';
import {
  X,
  Globe,
  Volume2,
  LogOut,
  Check,
  Sparkles,
  User as UserIcon,
  ShieldCheck,
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Link as LinkIcon,
  Coins,
  Download,
  FileText,
  Archive,
  BadgeCheck,
} from 'lucide-react';

interface SettingsModalProps {
  currentUser: User;
  dialect: Dialect;
  soundEnabled: boolean;
  onUpdateUser: (updated: Partial<User>) => void;
  onDialectChange: (d: Dialect) => void;
  onToggleSound: () => void;
  onOpenAdmin?: () => void;
  onOpenWallet?: () => void;
  onLogout: () => void;
  onClose?: () => void;
  isInline?: boolean;
}

// Curated Kurdish Landmarks & Premium Avatars
const AVATAR_PRESETS = [
  {
    id: 'eiffel',
    name: 'پاریس لە شەودا (سەباح سندی)',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
    tag: '🗼 Paris',
  },
  {
    id: 'mountains',
    name: 'چیاکانی کوردستان',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    tag: '🏔️ چیا',
  },
  {
    id: 'erbil',
    name: 'قەڵای هەولێر',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80',
    tag: '🏰 هەولێر',
  },
  {
    id: 'nature',
    name: 'سروشتی زاخۆ و دهۆک',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    tag: '🌲 سروشت',
  },
  {
    id: 'avatar_male_1',
    name: 'ئەڤەتاری کوڕ ١',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    tag: '👨 کوڕ',
  },
  {
    id: 'avatar_female_1',
    name: 'ئەڤەتاری کچ ١',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    tag: '👩 کچ',
  },
  {
    id: 'avatar_male_2',
    name: 'ئەڤەتاری مۆدێرن',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    tag: '💼 مۆدێرن',
  },
  {
    id: 'avatar_female_2',
    name: 'ئەڤەتاری کچ ٢',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    tag: '🌸 دیزاین',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  dialect,
  soundEnabled,
  onUpdateUser,
  onDialectChange,
  onToggleSound,
  onOpenAdmin,
  onOpenWallet,
  onLogout,
  onClose,
  isInline = false,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[dialect];

  // Upload photo from device / camera
  const [downloadZipStatus, setDownloadZipStatus] = useState<string | null>(null);

  const handleDownloadZip = () => {
    setDownloadZipStatus('داگرتن دەستی پێکرد...');
    const ok = downloadProjectZipOffline();
    if (ok) {
      setDownloadZipStatus('داگیرا! ✓');
      setTimeout(() => setDownloadZipStatus(null), 3000);
    } else {
      window.location.href = '/kurd-chat-project.zip';
      setDownloadZipStatus(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim().startsWith('http')) {
      setAvatar(customUrl.trim());
      setCustomUrl('');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: name.trim(),
      bio: bio.trim(),
      avatar: avatar || currentUser.avatar,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      if (onClose) onClose();
    }, 1200);
  };

  const content = (
    <div className={`w-full ${isInline ? 'h-full max-w-md mx-auto p-4' : 'max-w-[400px] bg-[#18181c] border border-neutral-800 rounded-[32px] p-5 shadow-2xl max-h-[92vh]'} flex flex-col gap-4 text-white overflow-y-auto no-scrollbar`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-purple-400" />
          <span>{t.settings}</span>
        </h3>
        {!isInline && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Profile Card & Avatar Editor */}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          {/* Avatar Preview & Direct Upload Area */}
          <div className="flex flex-col items-center gap-3 p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800/80 text-center relative overflow-hidden">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatar ? (
                <img
                  src={avatar}
                  alt={currentUser.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-600/60 shadow-xl group-hover:opacity-85 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 font-extrabold text-3xl flex items-center justify-center text-white ring-4 ring-blue-500/60 shadow-xl">
                  {currentUser.name[0]}
                </div>
              )}

              {/* Floating Camera Button */}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-7 h-7 text-white drop-shadow-md" />
              </div>

              <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-md border-2 border-[#18181c]">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{name || currentUser.name}</span>
                <UserBadges user={currentUser} size="xs" />
              </div>
              <span className="text-xs text-neutral-400 font-mono">@{currentUser.username}</span>
            </div>

            {/* Avatar Selection Tabs */}
            <div className="w-full pt-3 border-t border-neutral-800/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span className="text-purple-400">گۆڕینی وێنەی پڕۆفایل / تعديل الأفاتار</span>
                <span>📸</span>
              </div>

              {/* Pill tabs: Upload, Presets, URL */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1 px-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 flex items-center justify-center gap-1 font-semibold transition-all cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>وێنە لە مۆبایل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('presets')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer font-semibold ${
                    avatarTab === 'presets'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ئەڤەتاری ئامادە
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer font-semibold ${
                    avatarTab === 'url'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  بەستەر / Link
                </button>
              </div>

              {/* Preset Avatars Carousel */}
              {avatarTab === 'presets' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1">
                    {AVATAR_PRESETS.map((p) => {
                      const isSelected = avatar === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAvatar(p.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/50 scale-105'
                              : 'border-neutral-800 hover:border-neutral-600'
                          }`}
                          title={p.name}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-white py-0.5 text-center truncate px-0.5">
                            {p.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* URL Input */}
              {avatarTab === 'url' && (
                <div className="flex items-center gap-1.5" dir="ltr">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                  >
                    دانان
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-[11px] text-neutral-400 font-medium">ناو / الاسم:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-[#232328] border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              dir="rtl"
            />
          </div>

          {/* Bio Field */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-[11px] text-neutral-400 font-medium">بایۆ / دەربارەی من:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="دەربارەی خۆت بنووسە..."
              rows={2}
              className="bg-[#232328] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none font-medium"
              dir="rtl"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0084ff] hover:bg-[#0073e6] active:scale-98 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            {savedNotice ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>پاشەکەوت کرا! (تم الحفظ)</span>
              </>
            ) : (
              <>
                <span>پاشەکەوتکردنی وێنە و زانیارییەکان 💾</span>
              </>
            )}
          </button>
        </form>

        {/* Coin Balance Card */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-zinc-900/60 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20">
              <Coins className="w-5 h-5 text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-amber-300">
                {dialect === 'english' ? 'Coin Balance' : dialect === 'badini' ? 'باڵانسی کۆینان' : 'باڵانسی کۆین'}
              </span>
              <span className="text-base font-extrabold text-white tracking-tight">
                {(currentUser.coins ?? 100).toLocaleString()}{' '}
                <span className="text-xs text-amber-400 font-medium">کۆین</span>
              </span>
            </div>
          </div>
          {onOpenWallet && (
            <button
              type="button"
              onClick={() => {
                if (onClose && !isInline) onClose();
                onOpenWallet();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dialect === 'english' ? 'Wallet' : dialect === 'badini' ? 'جزدان' : 'جزدان'}</span>
            </button>
          )}
        </div>

        {/* Account Verification (Pejirandina Hesabê) Card */}
        <div className="p-3.5 bg-gradient-to-r from-blue-950/35 via-indigo-950/20 to-zinc-900/60 rounded-2xl border border-blue-500/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {dialect === 'english'
                    ? 'Account Verification'
                    : dialect === 'badini'
                    ? 'پەژراندنا هەژمارێ (Pejirandina Hesabê)'
                    : 'پشتڕاستکردنەوەی هەژمار'}
                </span>
                {currentUser.isVerified ? (
                  <BlueVerifiedBadge size="xs" />
                ) : (
                  <span className="text-[10px] text-blue-400">🔵</span>
                )}
              </div>
              <span className="text-[10px] text-blue-300 font-medium">
                {currentUser.isVerified
                  ? dialect === 'english'
                    ? 'Official Verified Account ✓'
                    : 'هەژمارا تە یا پەژراندی یە ب باجێ شین 🔵✓'
                  : dialect === 'english'
                  ? 'Get official Blue Badge'
                  : 'وەرگرتنا باجێ شین یێ فەرمی و مۆرێ'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVerificationOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 ${
              currentUser.isVerified
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {currentUser.isVerified ? (
              <>
                <BlueVerifiedBadge size="xs" />
                <span>دیتنا باجی</span>
              </>
            ) : (
              <>
                <span>پەژراندن 🔵</span>
              </>
            )}
          </button>
        </div>

        {/* Preferences Section */}
        <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-3">
          {/* Language Selection */}
          <div className="flex items-center justify-between text-xs" dir="rtl">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>زمان / اللغات:</span>
            </span>
            <div className="flex items-center gap-1 bg-[#232328] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onDialectChange('sorani')}
                className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                  dialect === 'sorani' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                سۆرانی
              </button>
              <button
                type="button"
                onClick={() => onDialectChange('badini')}
                className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                  dialect === 'badini' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                بادینی
              </button>
              <button
                type="button"
                onClick={() => onDialectChange('english')}
                className={`px-2 py-0.5 rounded-lg text-xs transition-all ${
                  dialect === 'english' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between text-xs" dir="rtl">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>دەنگی پەیامەکان:</span>
            </span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                soundEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {soundEnabled ? 'چالاکە 🔊' : 'بێدەنگ 🔇'}
            </button>
          </div>

          {/* Admin Panel button if admin */}
          {(currentUser.isAdmin || currentUser.username === 'sabah_sndi') && onOpenAdmin && (
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                onOpenAdmin();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-red-950/80 via-purple-950/80 to-emerald-950/80 hover:border-amber-400 border border-amber-500/50 rounded-2xl text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <KurdistanAdminVerifyBadge size="sm" />
              <span>کردنەوەی Admin Panel</span>
            </button>
          )}

          {/* Download Full Source Code Document & ZIP */}
          <div className="p-3 rounded-2xl bg-[#161620] border border-amber-500/30 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>فایلی سەرجەم کۆدەکانی پڕۆژە (Source Code)</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">ZIP • PDF • HTML</span>
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="py-2 px-1.5 rounded-xl bg-violet-600/25 hover:bg-violet-600/40 border border-violet-500/40 text-violet-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer shadow-xs active:scale-95"
              >
                <Archive className="w-4 h-4 text-violet-400" />
                <span>{downloadZipStatus || 'داگرتنی ZIP'}</span>
              </button>
              <a
                href="/KurdChat_Domino_Source_Code.pdf"
                download="KurdChat_Domino_Source_Code.pdf"
                className="py-2 px-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>داگرتنی PDF</span>
              </a>
              <a
                href="/source-code.html"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer shadow-xs active:scale-95"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>چاپکردن (HTML)</span>
              </a>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-400 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>چوونەدەرەوە (Log out)</span>
          </button>
        </div>
      </div>
  );

  return (
    <>
      {isInline ? (
        content
      ) : (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
          {content}
        </div>
      )}

      {isVerificationOpen && (
        <AccountVerificationModal
          currentUser={currentUser}
          dialect={dialect}
          onClose={() => setIsVerificationOpen(false)}
          onUserUpdated={onUpdateUser}
        />
      )}
    </>
  );
};
