import React, { useState } from 'react';
import { KurdChatLogo } from './KurdChatLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { ShieldCheck, UserPlus, LogIn, Loader2, Crown } from 'lucide-react';
import { KurdistanShield, KurdistanAdminVerifyBadge } from './KurdistanBadge';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  dialect: Dialect;
  onDialectChange: (dialect: Dialect) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  dialect,
  onDialectChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[dialect];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!username.trim() || !password.trim()) {
        setError(
          dialect === 'english'
            ? 'Please enter username and password'
            : dialect === 'badini'
            ? 'تکایە ناڤێ بکارهێنەری و وشا نهێنی بنڤیسە'
            : 'تکایە ناوی بەکارهێنەر و وشەی نهێنی بنووسە'
        );
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(
            data.error ||
              (dialect === 'english'
                ? 'Login failed'
                : dialect === 'badini'
                ? 'چوونەژوورڤە سەرنەکەفت'
                : 'چوونەژوورەوە سەرکەوتوو نەبوو')
          );
          setIsLoading(false);
          return;
        }

        onLogin(data.user);
      } catch (err) {
        console.error('Login error:', err);
        setError(
          dialect === 'english'
            ? 'Server connection error'
            : dialect === 'badini'
            ? 'خەلەتەک د پەیوەندیێ دا دروست بوو'
            : 'هەڵە لە پەیوەندی کردن بە سێرڤەرەوە'
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Register real user
      if (!fullName.trim() || !username.trim() || !password.trim()) {
        setError(
          dialect === 'english'
            ? 'Please fill in all fields'
            : dialect === 'badini'
            ? 'تکایە هەمی جهان تژی بکە'
            : 'تکایە هەموو خانەکان پڕبکەرەوە'
        );
        return;
      }

      if (password.length < 3) {
        setError(
          dialect === 'english'
            ? 'Password must be at least 3 characters'
            : dialect === 'badini'
            ? 'پێدڤیە وشا نهێنی کێمتر نەبیت ژ ٣ پیتان'
            : 'وشەی نهێنی پێویستە لانی کەم ٣ پیت بێت'
        );
        return;
      }

      setIsLoading(true);
      try {
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            username: cleanUsername,
            password: password.trim(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
            bio: bio.trim() || 'ئەندامی نوێ لە کورد چات ☀️',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || (dialect === 'english' ? 'Registration failed' : 'تۆمارکردن سەرکەوتوو نەبوو'));
          setIsLoading(false);
          return;
        }

        onLogin(data.user);
      } catch (err) {
        console.error('Register error:', err);
        setError(dialect === 'english' ? 'Server connection error' : 'هەڵە لە پەیوەندی کردن بە سێرڤەرەوە');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAdminQuickFill = () => {
    setUsername('Sabah');
    setPassword('Sabah22s');
    setMode('login');
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher pill in top corner */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-full px-2.5 py-1 text-xs text-neutral-300 backdrop-blur-md">
        <button
          onClick={() => onDialectChange('sorani')}
          className={`px-2 py-0.5 rounded-full transition-all ${
            dialect === 'sorani' ? 'bg-purple-600 text-white font-medium' : 'hover:text-white'
          }`}
        >
          سۆرانی
        </button>
        <button
          onClick={() => onDialectChange('badini')}
          className={`px-2 py-0.5 rounded-full transition-all ${
            dialect === 'badini' ? 'bg-purple-600 text-white font-medium' : 'hover:text-white'
          }`}
        >
          بادینی
        </button>
        <button
          onClick={() => onDialectChange('english')}
          className={`px-2 py-0.5 rounded-full transition-all ${
            dialect === 'english' ? 'bg-purple-600 text-white font-medium' : 'hover:text-white'
          }`}
        >
          EN
        </button>
      </div>

      {/* PWA Install Button in top right */}
      <div className="absolute top-5 right-5 z-20">
        <PWAInstallButton />
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-[360px] flex flex-col items-center text-center z-10">
        {/* Kurd Chat Icon matching video */}
        <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
          <KurdChatLogo size="lg" withGlow />
        </div>

        {/* Title & Badge */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Kurd Chat
          </h1>
          <KurdistanAdminVerifyBadge size="sm" />
        </div>
        <p className="text-xs text-neutral-400 mb-6 font-normal">
          {mode === 'login'
            ? 'تۆڕی ڕاستەقینەی پەیوەندی بۆ هەموو کوردان ☀️'
            : 'خۆت تۆمار بکە لەگەڵ بەکارهێنەرانی ڕاستەقینە ☀️'}
        </p>

        {error && (
          <div className="w-full mb-4 px-4 py-2.5 bg-red-950/70 border border-red-800/80 rounded-2xl text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {mode === 'register' && (
            <div className="w-full text-right">
              <input
                type="text"
                placeholder={t.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#1c1c1e] text-white placeholder-neutral-500 px-4 py-3.5 rounded-2xl border border-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                dir={dialect === 'english' ? 'ltr' : 'rtl'}
              />
            </div>
          )}

          <div className="w-full">
            <input
              type="text"
              placeholder={t.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-[#1c1c1e] text-white placeholder-neutral-500 px-4 py-3.5 rounded-2xl border border-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm font-sans"
              dir="ltr"
            />
          </div>

          <div className="w-full">
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#1c1c1e] text-white placeholder-neutral-500 px-4 py-3.5 rounded-2xl border border-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm font-sans"
              dir="ltr"
            />
          </div>

          {mode === 'register' && (
            <div className="w-full text-right">
              <input
                type="text"
                placeholder="دەربارەی من / Bio (ئارەزوومەندانە)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#1c1c1e] text-white placeholder-neutral-500 px-4 py-3 rounded-2xl border border-neutral-800 focus:border-blue-500 focus:outline-none text-xs"
                dir={dialect === 'english' ? 'ltr' : 'rtl'}
              />
            </div>
          )}

          {/* Action Button: Blue vibrant button matching video */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#0084ff] hover:bg-[#0073e6] active:bg-[#0062c4] disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer text-sm tracking-wide flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                {t.logIn}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {t.createNewAccount}
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="mt-5 text-sm text-[#0084ff] hover:text-blue-400 font-medium transition-colors cursor-pointer"
        >
          {mode === 'login' ? t.createNewAccount : t.alreadyHaveAccount}
        </button>

        {/* Admin Quick Login Option for Sabah Sndi */}
        <div className="mt-8 pt-5 border-t border-neutral-900 w-full flex flex-col items-center">
          <button
            type="button"
            onClick={handleAdminQuickFill}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800/80 rounded-2xl text-xs text-neutral-300 hover:text-white transition-all cursor-pointer group"
          >
            <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>چوونەژوورەوەی ئەدمین (Sabah Sndi)</span>
            <KurdistanShield size="sm" />
          </button>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>پەیامەکان پارێزراون • Kurd Chat Real Online Network</span>
        </div>
      </div>
    </div>
  );
};
