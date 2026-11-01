import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Share2, Smartphone, X, CheckCircle, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'banner' | 'button' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareApp = async () => {
    const shareData = {
      title: 'Kurd Chat | کورد چات',
      text: 'وەرە ناو کورد چات، ئەپڵیکەیشنی گفتوگۆی کوردی بە نامەی دەنگی و ستۆری ☀️💬',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {}
    }
  };

  // If already running inside installed standalone PWA, offer the Share link
  if (isInstalled) {
    return (
      <button
        onClick={handleShareApp}
        title="هاوبەشکردنی لینک"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/50 text-xs text-purple-200 transition-all cursor-pointer ${className}`}
      >
        <Share2 className="w-3.5 h-3.5 text-purple-400" />
        <span>{copiedLink ? 'لینک کۆپیکرا ✅' : 'هاوبەشکردنی ئەپ'}</span>
      </button>
    );
  }

  // Android / Chromium direct install
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95 animate-pulse ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>داگرتنی ئەپ (Install)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span>داگرتن لەسەر ئایفۆن</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white text-right flex flex-col gap-4" dir="rtl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  داگرتنی ئەپ بۆ iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <p className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                  <span>لە وێبگەڕی Safari، کلیک لە دوگمەی <strong>Share (هاوبەشکردن 📤)</strong> بکە.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                  <span>بڕۆ خوارەوە و کلیک لەسەر <strong>Add to Home Screen (زیادکردن بۆ پەڕەی سەرەکی ➕)</strong> بکە.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                  <span>ئێستا Kurd Chat وەک بەرنامەیەکی فەرمی لەسەر شاشەی مۆبایلەکەت ئامادەیە!</span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-2 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl"
              >
                تێگەیشتم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: Share / Install instructions button
  return (
    <button
      onClick={handleShareApp}
      title="هاوبەشکردنی ئەپڵیکەیشن"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-all cursor-pointer ${className}`}
    >
      <Share2 className="w-3.5 h-3.5 text-purple-400" />
      <span>{copiedLink ? 'لینک کۆپیکرا ✅' : 'هاوبەشکردنی ئەپ'}</span>
    </button>
  );
};
