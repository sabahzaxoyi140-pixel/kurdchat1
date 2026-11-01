import React, { useState, useEffect } from 'react';
import { User, Dialect, CoinTransaction } from '../types/chat';
import {
  X,
  Coins,
  Gift,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Plus,
  Clock,
  Send,
  AlertCircle,
  TrendingUp,
  Copy,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface CoinWalletModalProps {
  currentUser: User;
  allUsers: User[];
  dialect: Dialect;
  onClose: () => void;
  onUpdateCurrentUserCoins: (newCoins: number) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  kurName: string;
  account: string;
  type: 'wallet' | 'bank' | 'card' | 'crypto';
  badge: string;
  description: string;
  color: string;
}

const OFFICIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'superqi',
    name: 'SuperQi',
    kurName: 'سۆپەر کی (SuperQi)',
    account: '7502236113',
    type: 'wallet',
    badge: 'SuperQi',
    description: 'حەواڵەی ڕاستەوخۆ بۆ هەژماری سۆپەر کی',
    color: 'from-rose-600/20 to-red-600/10 border-rose-500/30 text-rose-300',
  },
  {
    id: 'fib',
    name: 'First Iraqi Bank (FIB)',
    kurName: 'فێرست عێراق بانک (FIB)',
    account: '7502236113',
    type: 'bank',
    badge: 'FIB Bank',
    description: 'حەواڵەی بانکی لەڕێگەی ئەپڵیکەیشنی FIB',
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-300',
  },
  {
    id: 'nasspay',
    name: 'NassPay',
    kurName: 'ناس پای (NassPay)',
    account: '7502236113',
    type: 'card',
    badge: 'NassPay',
    description: 'حەواڵە لەڕێگەی کارتی ناس پای',
    color: 'from-blue-600/20 to-indigo-600/10 border-blue-500/30 text-blue-300',
  },
  {
    id: 'fastpay',
    name: 'FastPay',
    kurName: 'فاست پای (FastPay)',
    account: '7502236113',
    type: 'wallet',
    badge: 'FastPay',
    description: 'حەواڵەی خێرا لەڕێگەی جزدانی فاست پای',
    color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-300',
  },
  {
    id: 'usdt',
    name: 'USDT (TRC-20)',
    kurName: 'کریپتۆ USDT TRC20',
    account: 'TAVaLZGavKH5ZaSiRY3mc65Eji6DPsXrRR',
    type: 'crypto',
    badge: 'TRC-20 Tron',
    description: 'تۆڕی Tron (TRC-20) جزدانی دۆلاری دیجیتاڵی',
    color: 'from-teal-600/20 to-emerald-600/10 border-teal-500/30 text-teal-300',
  },
];

export interface RechargePackage {
  amount: number;
  priceUsd: string;
  priceIqd: string;
  label: string;
  desc: string;
  popular?: boolean;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { amount: 100, priceUsd: '$0.99', priceIqd: '١,٥٠٠ دینار', label: '١٠٠ کۆین', desc: 'دیاری خێرا' },
  { amount: 500, priceUsd: '$4.99', priceIqd: '٧,٠٠٠ دینار', label: '٥٠٠ کۆین', desc: 'پاکێجی شایستە', popular: true },
  { amount: 1200, priceUsd: '$9.99', priceIqd: '١٥,٠٠٠ دینار', label: '١,٢٠٠ کۆین', desc: 'دیزاینی تایبەت' },
  { amount: 5000, priceUsd: '$39.99', priceIqd: '٦٠,٠٠٠ دینار', label: '٥,٠٠٠ کۆین', desc: 'VIP باڵانس' },
  { amount: 10000, priceUsd: '$79.99', priceIqd: '١٢٠,٠٠٠ دینار', label: '١٠,٠٠٠ کۆین', desc: 'ماستەر باڵانس' },
];

export const CoinWalletModal: React.FC<CoinWalletModalProps> = ({
  currentUser,
  allUsers,
  dialect,
  onClose,
  onUpdateCurrentUserCoins,
}) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'send' | 'history'>('balance');
  const [coins, setCoins] = useState<number>(currentUser.coins ?? 100);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailySuccessMsg, setDailySuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Recharge Modal Form State
  const [selectedPackForRecharge, setSelectedPackForRecharge] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('superqi');
  const [transferRefNumber, setTransferRefNumber] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');

  // Send Gift form state
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    allUsers.find((u) => u.id !== currentUser.id)?.id || ''
  );
  const [sendAmount, setSendAmount] = useState<number>(50);
  const [sendNote, setSendNote] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Fetch wallet data
  useEffect(() => {
    let isMounted = true;
    const fetchWallet = async () => {
      try {
        const res = await fetch(`/api/wallet?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCoins(data.coins ?? 100);
            onUpdateCurrentUserCoins(data.coins ?? 100);
            if (Array.isArray(data.transactions)) {
              setTransactions(data.transactions);
              const todayStr = new Date().toDateString();
              const hasClaimedToday = data.transactions.some(
                (t: CoinTransaction) =>
                  t.type === 'reward' && new Date(t.createdAt).toDateString() === todayStr
              );
              setDailyClaimed(hasClaimedToday);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch wallet info:', err);
      }
    };

    fetchWallet();
    return () => {
      isMounted = false;
    };
  }, [currentUser.id, onUpdateCurrentUserCoins]);

  // Handle Daily Reward Claim
  const handleClaimDaily = async () => {
    if (dailyClaimed || isLoading) return;
    setIsLoading(true);
    setDailySuccessMsg('');
    try {
      const res = await fetch('/api/wallet/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.coins);
        onUpdateCurrentUserCoins(data.coins);
        setDailyClaimed(true);
        setDailySuccessMsg('+35 کۆین بە سەرکەوتوویی زیادکرا بۆ باڵانسەکەت!');
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
      } else {
        setDailySuccessMsg(data.error || 'هەڵە لە وەرگرتنی خەڵات');
      }
    } catch (err) {
      console.error(err);
      setDailySuccessMsg('هەڵە لە پەیوەندی کردن بە سێرڤەر');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Recharge Confirmation
  const handleConfirmRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackForRecharge) return;
    setIsLoading(true);
    setRechargeSuccess('');

    try {
      const selectedMethodObj = OFFICIAL_PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod);
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          packageAmount: selectedPackForRecharge,
          paymentMethod: selectedMethodObj?.name || selectedPaymentMethod,
          txRef: transferRefNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.coins);
        onUpdateCurrentUserCoins(data.coins);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setRechargeSuccess(`پڕکردنەوەی +${selectedPackForRecharge.toLocaleString()} کۆین بە سەرکەوتوویی ئەنجامدرا!`);
        setTimeout(() => {
          setSelectedPackForRecharge(null);
          setTransferRefNumber('');
          setRechargeSuccess('');
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Transfer / Send Gift
  const handleTransferCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!selectedRecipientId) {
      setTransferError('تکایە بەکارهێنەرێک هەڵبژێرە');
      return;
    }
    if (sendAmount <= 0) {
      setTransferError('بڕی کۆین دەبێت لە ٠ زیاتر بێت');
      return;
    }
    if (coins < sendAmount) {
      setTransferError('باڵانسی تۆ بەس نییە بۆ ناردنی ئەم بڕە!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientId: selectedRecipientId,
          amount: sendAmount,
          note: sendNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCoins(data.senderCoins);
        onUpdateCurrentUserCoins(data.senderCoins);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setTransferSuccess(`دیاریی ${sendAmount.toLocaleString()} کۆین بە سەرکەوتوویی نێردرا!`);
        setSendNote('');
      } else {
        setTransferError(data.error || 'هەڵە لە ناردنی کۆین');
      }
    } catch (err) {
      console.error(err);
      setTransferError('هەڵە لە پەیوەندی بە سێرڤەرەوە');
    } finally {
      setIsLoading(false);
    }
  };

  const recipientOptions = allUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none" dir="rtl">
      <div className="w-full max-w-[480px] bg-[#121217] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col relative text-zinc-100 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{dialect === 'english' ? 'Coin Balance' : dialect === 'badini' ? 'باڵانسی کۆین' : 'باڵانسی کۆینەکان'}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 font-sans">
                  {coins.toLocaleString()}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {dialect === 'english' ? 'Wallet & Payment Methods' : dialect === 'badini' ? 'جزدان و ڕێکێن پارەدانێ' : 'جزدان و ڕێگاکانی پارەدان'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Balance Banner */}
        <div className="my-3 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-[#121217] border border-amber-500/30 flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-amber-300 font-semibold">کۆی باڵانسی بەردەست</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-extrabold text-white font-sans tracking-tight">
                  {coins.toLocaleString()}
                </span>
                <span className="text-xs text-amber-400 font-bold">کۆین (Coins)</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-end gap-1">
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800">
              <TrendingUp className="w-3 h-3" />
              <span>چالاک</span>
            </span>
          </div>

          {/* Ambient Glow */}
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 mb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'balance'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>پارەدان و پڕکردنەوە</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'send'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>ناردنی دیاری</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>مێژوو ({transactions.length})</span>
          </button>
        </div>

        {/* TAB 1: TOP-UP & OFFICIAL PAYMENT METHODS */}
        {activeTab === 'balance' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 max-h-[58vh]">
            {/* Daily Reward Card */}
            <div className="p-3.5 rounded-2xl bg-[#17171e] border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">خەڵاتی ڕۆژانەی بێبەرامبەر</span>
                  <span className="text-[11px] text-zinc-400">+35 کۆین وەربگرە هەموو ٢٤ کاتژمێر جارێک</span>
                </div>
              </div>

              <button
                type="button"
                disabled={dailyClaimed || isLoading}
                onClick={handleClaimDaily}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dailyClaimed
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 active:scale-95'
                }`}
              >
                {dailyClaimed ? 'وەرگیراوە' : 'وەرگرتن'}
              </button>
            </div>

            {dailySuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-center text-xs text-emerald-300 font-semibold">
                {dailySuccessMsg}
              </div>
            )}

            {/* Official Payment Methods Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ڕێگاکانی پارەدان و حەواڵە (Payment Accounts)</span>
                </span>
                <span className="text-[10px] text-zinc-400">کلیک بکە بۆ کۆپیکردن</span>
              </div>

              <div className="space-y-2">
                {OFFICIAL_PAYMENT_METHODS.map((method) => {
                  const isCopied = copiedId === method.id;
                  const isCrypto = method.type === 'crypto';

                  return (
                    <div
                      key={method.id}
                      className={`p-3 rounded-2xl bg-[#15151c] border transition-all flex items-center justify-between gap-3 ${
                        isCopied ? 'border-emerald-500/70 bg-emerald-950/20' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          {method.type === 'bank' && <Building2 className="w-5 h-5 text-emerald-400" />}
                          {method.type === 'wallet' && <Smartphone className="w-5 h-5 text-amber-400" />}
                          {method.type === 'card' && <CreditCard className="w-5 h-5 text-blue-400" />}
                          {method.type === 'crypto' && <Wallet className="w-5 h-5 text-teal-400" />}
                        </div>

                        <div className="flex flex-col text-right min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{method.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                              {method.badge}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-mono font-bold tracking-wider mt-0.5 select-all ${
                              isCrypto ? 'text-[10px] text-teal-300 break-all' : 'text-amber-300 text-sm'
                            }`}
                          >
                            {method.account}
                          </span>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(method.id, method.account)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>کۆپی کرا</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>کۆپی</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Top-up Packages */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>پاکێجەکانی پڕکردنەوەی کۆین (Select Package)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">دەستپێک لە $0.99 ەوە</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {RECHARGE_PACKAGES.map((pack) => (
                  <button
                    key={pack.amount}
                    type="button"
                    onClick={() => setSelectedPackForRecharge(pack.amount)}
                    className="p-3 rounded-2xl bg-[#17171e] hover:bg-[#1f1f28] border border-zinc-800 hover:border-amber-500/50 transition-all text-right flex flex-col justify-between cursor-pointer group active:scale-98 relative overflow-hidden shadow-xs"
                  >
                    {pack.popular && (
                      <span className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded-br-xl shadow-xs">
                        شایستە
                      </span>
                    )}

                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-black text-white font-sans group-hover:text-amber-300">
                        +{pack.amount.toLocaleString()}
                      </span>
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>

                    <div className="flex flex-col mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400">سعر:</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">{pack.priceUsd}</span>
                        <span className="text-[9px] text-zinc-400">({pack.priceIqd})</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5">{pack.desc}</span>
                    </div>

                    <span className="mt-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 py-1 px-2 rounded-xl text-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                      پڕکردنەوە ({pack.priceUsd})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEND COINS / GIFT */}
        {activeTab === 'send' && (
          <form onSubmit={handleTransferCoins} className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 max-h-[58vh]">
            {transferError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-center text-xs text-rose-300 font-semibold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{transferSuccess}</span>
              </div>
            )}

            {/* Recipient Selector */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-zinc-300">هەڵبژاردنی بەکارهێنەر:</label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                className="w-full bg-[#17171e] border border-zinc-800 rounded-2xl p-2.5 text-xs text-white focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                {recipientOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Pills */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-zinc-300">دیاریکردنی بڕی کۆین:</label>
              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSendAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      sendAmount === amt
                        ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                        : 'bg-[#17171e] border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1 text-right">
              <input
                type="number"
                min={1}
                max={coins}
                value={sendAmount}
                onChange={(e) => setSendAmount(Number(e.target.value))}
                className="w-full bg-[#17171e] border border-zinc-800 rounded-2xl p-2.5 text-xs text-white focus:border-violet-500 focus:outline-none font-mono"
                placeholder="یان بڕێکی تر بنووسە..."
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-zinc-300">پەیام یان هۆکار (ئارەزوومەندانە):</label>
              <input
                type="text"
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
                placeholder="سڵاو، ئەمەش دیارییەکە بۆت..."
                className="w-full bg-[#17171e] border border-zinc-800 rounded-2xl p-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || coins < sendAmount || sendAmount <= 0}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-98 text-xs font-bold text-white rounded-2xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'ناردن...' : `ناردنی ${sendAmount} کۆین بە دیاری`}</span>
            </button>
          </form>
        )}

        {/* TAB 3: TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-[58vh]">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-zinc-600" />
                <span className="text-xs">هیچ مامەڵەیەکی کۆین ئەنجامنەدراوە</span>
              </div>
            ) : (
              transactions.map((t) => {
                const isPositive = t.amount > 0;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#17171e] border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isPositive
                            ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-400'
                            : 'bg-rose-950/70 border-rose-800/60 text-rose-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold text-white">{t.description}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">{t.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold text-sm">
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPositive ? `+${t.amount}` : t.amount}
                      </span>
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Recharge Confirmation Modal Overlay */}
        {selectedPackForRecharge !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#181820] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-white" dir="rtl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">پڕکردنەوەی کۆین</h4>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                      <span className="text-zinc-300 font-bold">بڕی: +{selectedPackForRecharge.toLocaleString()} کۆین</span>
                      {(() => {
                        const pack = RECHARGE_PACKAGES.find((p) => p.amount === selectedPackForRecharge);
                        if (!pack) return null;
                        return (
                          <span className="text-emerald-400 font-bold font-mono">
                            • سعر: {pack.priceUsd} ({pack.priceIqd})
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPackForRecharge(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {rechargeSuccess ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center text-xs text-emerald-300 font-bold flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span>{rechargeSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleConfirmRecharge} className="flex flex-col gap-3">
                  {/* Select Payment Method */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">ڕێگای پارەدان هەڵبژێرە:</label>
                    <div className="space-y-1.5">
                      {OFFICIAL_PAYMENT_METHODS.map((m) => {
                        const isSelected = selectedPaymentMethod === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedPaymentMethod(m.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/60 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{m.name}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">({m.account})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account display to copy */}
                  {(() => {
                    const activeM = OFFICIAL_PAYMENT_METHODS.find((m) => m.id === selectedPaymentMethod);
                    if (!activeM) return null;
                    const isCopied = copiedId === activeM.id;
                    return (
                      <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-400">ژمارەی هەژمار بۆ حەواڵە:</span>
                          <span className="text-xs font-mono font-bold text-amber-300">{activeM.account}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeM.id, activeM.account)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'کۆپی کرا' : 'کۆپیکردن'}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Reference / Phone number input */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">ژمارەی تەئکیدکردنەوە یان تێبینی:</label>
                    <input
                      type="text"
                      value={transferRefNumber}
                      onChange={(e) => setTransferRefNumber(e.target.value)}
                      placeholder="ژمارەی مۆبایل یان Ref حەواڵە..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-zinc-800">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'خەریکی تەواوکردنە...' : 'تەئکیدکردنەوەی پڕکردنەوە'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPackForRecharge(null)}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      داخستن
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
