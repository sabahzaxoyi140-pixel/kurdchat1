import React, { useEffect, useState } from 'react';
import { CallState, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  PhoneCall,
  Shield,
  Radio,
} from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/audio';

interface CallScreenProps {
  call: CallState;
  dialect: Dialect;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleVideo: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  call,
  dialect,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
}) => {
  const t = translations[dialect];
  const [seconds, setSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected'>('calling');

  useEffect(() => {
    startRingtone();
    const ringingTimer = setTimeout(() => {
      setCallStatus('ringing');
    }, 1500);

    const connectTimer = setTimeout(() => {
      stopRingtone();
      setCallStatus('connected');
    }, 3800);

    return () => {
      clearTimeout(ringingTimer);
      clearTimeout(connectTimer);
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090d]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none text-zinc-100" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="z-10 flex flex-col items-center gap-2 text-center mt-4">
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs text-zinc-300 shadow-sm">
          <PhoneCall className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span className="font-semibold tracking-tight">
            {call.type === 'video' ? t.videoCall : t.audioCall}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
          {call.contact.name}
        </h2>
        <p className="text-sm text-zinc-400">
          {callStatus === 'calling' && t.calling}
          {callStatus === 'ringing' && t.ringing}
          {callStatus === 'connected' && (
            <span className="text-emerald-400 font-mono tracking-wider font-bold">
              {formatDuration(seconds)}
            </span>
          )}
        </p>
      </div>

      {/* Center Avatar with animated soundwave rings */}
      <div className="z-10 flex flex-col items-center my-auto">
        <div className="relative">
          {callStatus === 'calling' || callStatus === 'ringing' ? (
            <>
              <div className="absolute -inset-3 rounded-full bg-violet-600/20 animate-ping duration-1000" />
              <div className="absolute -inset-6 rounded-full bg-indigo-600/15 animate-pulse" />
            </>
          ) : (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse" />
          )}

          {call.type === 'video' && !call.isVideoOff ? (
            <div className="w-48 h-64 rounded-3xl overflow-hidden border-2 border-violet-500/70 shadow-2xl relative bg-zinc-950">
              <img
                src={call.contact.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={call.contact.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-zinc-300 font-mono">
                HD 1080p
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={call.contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.contact.id}`}
                alt={call.contact.name}
                className="w-36 h-36 rounded-full object-cover ring-4 ring-zinc-700/80 shadow-2xl"
              />
              {callStatus === 'connected' && (
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#09090d] flex items-center justify-center">
                  <Radio className="w-2.5 h-2.5 text-zinc-950" />
                </span>
              )}
            </div>
          )}
        </div>

        {callStatus === 'connected' && (
          <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/90 px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>پەیوەندی پارێزراوە (End-to-End Encrypted)</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="z-10 flex flex-col items-center gap-5 mb-8 w-full max-w-sm">
        <div className="flex items-center justify-center gap-4 w-full">
          {/* Mute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
              call.isMuted
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-zinc-900/90 text-zinc-200 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Speaker Button */}
          <button
            type="button"
            onClick={onToggleSpeaker}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
              call.isSpeaker
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-zinc-900/90 text-zinc-200 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {call.isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Video Toggle Button */}
          <button
            type="button"
            onClick={onToggleVideo}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
              call.isVideoOff
                ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                : 'bg-zinc-900/90 text-zinc-200 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {call.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        </div>

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="w-16 h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all cursor-pointer"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
