import React, { useState, useEffect, useRef } from 'react';
import { User, Dialect, VerificationRequest, VerificationCategory } from '../types/chat';
import { translations } from '../utils/i18n';
import { BlueVerifiedBadge, KurdistanSunEmoji, KurdistanShield, KurdistanVerifiedBadgeIcon } from './KurdistanBadge';
import { playSendSound } from '../utils/audio';
import {
  X,
  BadgeCheck,
  ShieldCheck,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  User as UserIcon,
  Sparkles,
  Award,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface AccountVerificationModalProps {
  currentUser: User;
  dialect: Dialect;
  onClose: () => void;
  onUserUpdated?: (updated: Partial<User>) => void;
}

const CATEGORIES: { id: VerificationCategory; labelBadini: string; labelSorani: string; labelEn: string; icon: string }[] = [
  { id: 'public_figure', labelBadini: 'کەسایەتیێ گشتی / ناڤدار', labelSorani: 'کەسایەتی گشتی / ناسراو', labelEn: 'Public Figure / Celebrity', icon: '⭐' },
  { id: 'content_creator', labelBadini: 'دروستکەرێ ناڤەڕۆکێ / یوتیوبەر', labelSorani: 'دروستکەری ناوەڕۆک / بلۆگەر', labelEn: 'Content Creator / Blogger', icon: '🎥' },
  { id: 'journalist', labelBadini: 'ڕۆژنامەڤان / ڕاگەیاندنکار', labelSorani: 'ڕۆژنامەنووس / ڕاگەیاندنکار', labelEn: 'Journalist / Media', icon: '📰' },
  { id: 'business', labelBadini: 'کۆمپانیا / بازرگانی / براند', labelSorani: 'کۆمپانیا / بازرگانی / براند', labelEn: 'Business / Brand', icon: '🏢' },
  { id: 'gamer', labelBadini: 'یاریزانێ دۆمینێ / گەیمەر', labelSorani: 'یاریزانی دۆمینە / گەیمەر', labelEn: 'Domino Player / Gamer', icon: '🎮' },
  { id: 'artist', labelBadini: 'هونەرمەند / سترانبێژ', labelSorani: 'هونەرمەند / گۆرانیبێژ', labelEn: 'Artist / Musician', icon: '🎨' },
  { id: 'community', labelBadini: 'ڕێکخراو / چالاکڤان', labelSorani: 'ڕێکخراو / چالاکوان', labelEn: 'Organization / Activist', icon: '🤝' },
  { id: 'other', labelBadini: 'کەسایەتیێ دی', labelSorani: 'کەسایەتی دیکە', labelEn: 'Other', icon: '✨' },
];

export const AccountVerificationModal: React.FC<AccountVerificationModalProps> = ({
  currentUser,
  dialect,
  onClose,
  onUserUpdated,
}) => {
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [selectedCategory, setSelectedCategory] = useState<VerificationCategory>('content_creator');
  const [documentType, setDocumentType] = useState<'id_card' | 'passport' | 'social_link' | 'other'>('id_card');
  const [documentNote, setDocumentNote] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const docInputRef = useRef<HTMLInputElement>(null);
  const t = translations[dialect];

  // Fetch status on open
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch(`/api/verification/status?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
        if (data.isVerified && !currentUser.isVerified && onUserUpdated) {
          onUserUpdated({ isVerified: true });
        }
      }
    } catch (e) {
      console.error('Error fetching verification status:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentUser.id]);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setDocumentUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage(
        dialect === 'english'
          ? 'Please enter your full real name'
          : dialect === 'badini'
          ? 'تکایە ناڤێ تە یێ دروست و یاسایی بنڤیسە'
          : 'تکایە ناوی تەواو و یاسایی خۆت بنووسە'
      );
      return;
    }

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryLabel =
      dialect === 'english'
        ? catObj?.labelEn
        : dialect === 'badini'
        ? catObj?.labelBadini
        : catObj?.labelSorani;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          fullName: fullName.trim(),
          category: selectedCategory,
          categoryLabel,
          documentType,
          documentNote: documentNote.trim(),
          documentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'هەڵە لە تۆمارکردنی داواکاری');
        setIsSubmitting(false);
        return;
      }

      setRequest(data.request);
      setSubmitSuccess(true);
      setShowApplyForm(false);
      try {
        playSendSound();
      } catch {}
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage(dialect === 'english' ? 'Server connection error' : 'هەڵە لە پەیوەندی کردن بە سێرڤەرەوە');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = currentUser.isVerified;
  const isPending = request?.status === 'pending' && !isVerified;
  const isRejected = request?.status === 'rejected' && !isVerified;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div
        className="w-full max-w-[440px] bg-[#141418] border border-blue-500/30 rounded-[32px] p-5 shadow-2xl flex flex-col relative text-white max-h-[92vh] overflow-y-auto no-scrollbar"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <BlueVerifiedBadge size="md" />
            <div className="flex flex-col text-right">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>پەژراندنا هەژمارێ (Pejirandina Hesabê)</span>
                <KurdistanSunEmoji size={16} />
              </h3>
              <span className="text-[10px] text-blue-400 font-medium">
                Official Account Verification • Kurd Chat
              </span>
            </div>
          </div>

          <div className="w-9" />
        </div>

        {/* Success Alert Banner */}
        {submitSuccess && (
          <div className="p-3 mb-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>داخوازیا تە هاتە تۆمارکرن! بەڕێوەبەرێ گشتی Sabah Sndi دێ زوو چاڤدێری کەت.</span>
          </div>
        )}

        {/* CASE 1: USER IS ALREADY VERIFIED (OFFICIAL CERTIFICATE VIEW) */}
        {isVerified ? (
          <div className="flex flex-col gap-4 text-center">
            {/* Glowing Verified Certificate Badge */}
            <div className="relative p-6 bg-gradient-to-b from-blue-950/40 via-zinc-900 to-[#121216] border-2 border-blue-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Background watermark */}
              <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                <KurdistanShield size="lg" />
              </div>

              <div className="relative mb-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 font-extrabold text-2xl flex items-center justify-center text-white ring-4 ring-blue-500">
                    {currentUser.name[0]}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 rounded-full border-2 border-[#141418] shadow-md">
                  <BlueVerifiedBadge size="sm" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="text-base font-extrabold text-white">{currentUser.name}</h4>
                <BlueVerifiedBadge size="sm" />
                {currentUser.username === 'sabah' && <KurdistanSunEmoji size={18} />}
              </div>
              <span className="text-xs text-blue-400 font-mono mb-3">@{currentUser.username}</span>

              {/* Verified Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/25 border border-blue-400/50 text-blue-300 font-extrabold text-xs mb-3 shadow-inner">
                <BlueVerifiedBadge size="xs" />
                <span>هەژمارا تە یا فەرمی و پەژراندی یە (Verified)</span>
                <KurdistanSunEmoji size={14} />
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mb-4">
                ئەڤ هەژمارە ب فەرمی هاتیە پشتڕاستکرن و مۆرکرن ژ لایێ بەڕێوەبەرایەتیا کورد چات. خودانێ نیشانا شین یێ باوەرپێکرییە.
              </p>

              {/* Authentic Feature Badges */}
              <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-zinc-800 text-[10px]">
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-zinc-300">پاراستنا ناسنامێ</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-zinc-300">متمانەیا بلند</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-zinc-300">پێشەنگی د دیتنێ دا</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              داخستن
            </button>
          </div>
        ) : isPending ? (
          /* CASE 2: REQUEST IS UNDER REVIEW */
          <div className="flex flex-col gap-4 text-center">
            <div className="p-6 bg-gradient-to-b from-amber-950/25 via-zinc-900 to-[#121216] border border-amber-500/40 rounded-3xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <h4 className="text-base font-extrabold text-amber-300 mb-1">
                داخوازیا تە یا ل بن چاڤدێریێ دایە ⏳
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                داخوازیا پەژراندنا هەژمارا تە گەهشتە بەڕێوەبەرێ باڵا <strong>(Sabah Sndi)</strong> و نوکە یا ل ژێر پێداچوونێ دا. د کێمترین دەم دا دێ ئەنجام بۆ تە هێتە ڕاگەهاندن.
              </p>

              {/* Request Info card */}
              <div className="w-full p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col gap-2 text-right text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">ناڤێ فەرمی:</span>
                  <span className="font-bold text-white">{request?.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">بەش / جۆر:</span>
                  <span className="font-bold text-blue-400">{request?.categoryLabel || request?.category}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">بارودۆخ:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>ل بن چاڤدێریێ</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-zinc-500">دەمێ هنارتنێ:</span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {request?.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'ئەڤڕۆ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchStatus}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>نویژەنکرنا بارودۆخی</span>
              </button>
              <button
                onClick={() => setShowApplyForm(true)}
                className="py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                دەستکاریکرن
              </button>
            </div>
          </div>
        ) : isRejected && !showApplyForm ? (
          /* CASE 3: REJECTED WITH OPTION TO RE-APPLY */
          <div className="flex flex-col gap-4 text-center">
            <div className="p-5 bg-gradient-to-b from-rose-950/30 via-zinc-900 to-[#121216] border border-rose-500/40 rounded-3xl flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2">
                <AlertCircle className="w-7 h-7" />
              </div>

              <h4 className="text-sm font-extrabold text-rose-300 mb-1">
                داخوازیا تە نەهاتە پەسەندکرن
              </h4>
              {request?.adminNote && (
                <div className="w-full p-2.5 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-200 text-xs my-2 text-right">
                  <span className="font-bold text-rose-300 block mb-0.5">تێبینیا بەڕێوەبەرایەتیێ:</span>
                  <span>{request.adminNote}</span>
                </div>
              )}
              <p className="text-xs text-zinc-400 leading-relaxed">
                تۆ دشێی زانیاریێن خۆ ڕاستڤەکەی و بەڵگەیێن دروست دابنێی و دووبارە داخوازێ پێشکێش بکەی.
              </p>
            </div>

            <button
              onClick={() => setShowApplyForm(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>دووبارە داخواز بکە (Re-apply)</span>
            </button>
          </div>
        ) : (
          /* CASE 4: SUBMIT VERIFICATION FORM (PEJIRANDINA HESABÊ) */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Intro banner */}
            <div className="p-3 bg-gradient-to-r from-blue-950/40 via-zinc-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>باجێ شین یێ فەرمی (Pejirandina Hesabê)</span>
                  <KurdistanSunEmoji size={14} />
                </span>
                <span className="text-[10px] text-zinc-400 leading-tight">
                  پەژراندنا کەسایەتی، براند، یوتیوبەر، و ناڤدارێن کوردستانێ د کورد چات دا
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold text-right">
                {errorMessage}
              </div>
            )}

            {/* Field 1: Real Full Name */}
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>ناڤێ تە یێ دروست و فەرمی (وەک د ناسنامێ دا):</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="بۆ نموونە: سەباح حسێن سندی..."
                required
                className="bg-[#1c1c22] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Field 2: Category */}
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>بەش / جۆری هەژمارێ (Category):</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-0.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const label =
                    dialect === 'english'
                      ? cat.labelEn
                      : dialect === 'badini'
                      ? cat.labelBadini
                      : cat.labelSorani;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2 rounded-xl text-right text-xs transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-white font-bold ring-1 ring-blue-500/40'
                          : 'bg-[#1c1c22] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Document Type */}
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>جۆرێ بەڵگەنامێ (Document Type):</span>
              </label>
              <div className="flex gap-1.5 bg-[#18181e] p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setDocumentType('id_card')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    documentType === 'id_card' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  کارتێ نیشتمانی / ناسنامە
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('passport')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    documentType === 'passport' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  پاسپۆرت
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('social_link')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    documentType === 'social_link' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  بەستەرێ فەرمی
                </button>
              </div>
            </div>

            {/* Field 4: Description or Official Link */}
            <div className="flex flex-col gap-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300">
                بەستەر یان وەسفێ هەژمارێ (Link / Description):
              </label>
              <input
                type="text"
                value={documentNote}
                onChange={(e) => setDocumentNote(e.target.value)}
                placeholder="لینکی ئینستاگرام، تیکتۆک، فەیسبووک یان یوتیوب..."
                className="bg-[#1c1c22] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Field 5: Upload ID/Document from device (Optional) */}
            <div className="flex flex-col gap-1 text-right">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                <span>وێنە یان بەڵگەنامە (ئیختیاری):</span>
                {documentUrl && <span className="text-emerald-400 text-[10px]">وێنە هاتە بارکرن ✓</span>}
              </div>

              <input
                type="file"
                ref={docInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleDocumentUpload}
              />

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#1c1c22] hover:bg-[#25252d] border border-dashed border-zinc-700 hover:border-blue-500 text-zinc-300 hover:text-white text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>{documentUrl ? 'گۆڕینی وێنەی بەڵگەنامێ' : 'بارکرنا وێنەی ژ مۆبایلێ'}</span>
              </button>

              {documentUrl && (
                <div className="relative mt-1 max-h-24 rounded-xl overflow-hidden border border-zinc-700">
                  <img src={documentUrl} alt="Document Proof" className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => setDocumentUrl('')}
                    className="absolute top-1 left-1 p-1 bg-black/80 rounded-full text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <BlueVerifiedBadge size="xs" />
              <span>
                {isSubmitting
                  ? 'خەریکە دهێتە هنارتن...'
                  : 'هنارتنا داخوازیا پەژراندنا هەژمارێ (Send Request)'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
