import React, { useState, useRef } from 'react';
import { Story, User, Dialect } from '../types/chat';
import { translations } from '../utils/i18n';
import { UserBadges } from './KurdistanBadge';
import {
  Sparkles,
  Camera,
  Type,
  Plus,
  Play,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Upload,
} from 'lucide-react';

interface StoriesFeedViewProps {
  currentUser: User;
  stories: Story[];
  dialect: Dialect;
  onOpenStory: (index: number) => void;
  onAddStory: (story: Omit<Story, 'id' | 'timestamp'>) => void;
  onDeleteStory?: (storyId: string) => void;
}

const TEMPLATE_PRESETS = [
  {
    id: 'kurd_flag',
    name: 'ئاڵایێ کوردستانێ ☀️',
    gradient: 'from-red-700 via-purple-900 to-emerald-800',
    textColor: '#ffffff',
  },
  {
    id: 'sunset_zaxo',
    name: 'ئێڤاریا زاخۆ و دهۆک 🌄',
    gradient: 'from-amber-600 via-pink-800 to-purple-950',
    textColor: '#ffffff',
  },
  {
    id: 'royal_purple',
    name: 'کورد چات مۆر 🌌',
    gradient: 'from-purple-900 via-indigo-950 to-black',
    textColor: '#ffffff',
  },
  {
    id: 'nature_badinan',
    name: 'سروشتێ بادینان 🌲',
    gradient: 'from-emerald-800 via-teal-950 to-black',
    textColor: '#ffffff',
  },
  {
    id: 'midnight',
    name: 'تاری و شیک 🖤',
    gradient: 'from-neutral-900 via-neutral-950 to-black',
    textColor: '#ffffff',
  },
  {
    id: 'golden_sun',
    name: 'ڕۆژا ئاڵتونی 👑',
    gradient: 'from-amber-600 via-yellow-900 to-black',
    textColor: '#ffffff',
  },
];

export const StoriesFeedView: React.FC<StoriesFeedViewProps> = ({
  currentUser,
  stories,
  dialect,
  onOpenStory,
  onAddStory,
  onDeleteStory,
}) => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorMode, setCreatorMode] = useState<'mobile_photo' | 'text_template'>('mobile_photo');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_PRESETS[0]);
  const [storyText, setStoryText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[dialect];

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) setUploadedImage(res);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (creatorMode === 'mobile_photo') {
      if (!uploadedImage) return;
      onAddStory({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        mediaUrl: uploadedImage,
        mediaType: 'image',
        caption: caption.trim() || undefined,
        viewed: false,
      });
    } else {
      if (!storyText.trim()) return;
      onAddStory({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        mediaType: 'text',
        caption: storyText.trim(),
        bgGradient: selectedTemplate.gradient,
        textColor: selectedTemplate.textColor,
        viewed: false,
      });
    }

    // Reset and close
    setIsCreatorOpen(false);
    setUploadedImage(null);
    setStoryText('');
    setCaption('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b] text-zinc-100 select-none overflow-hidden" dir="rtl">
      {/* Top Header */}
      <div className="px-4 pt-4 pb-2.5 flex items-center justify-between border-b border-zinc-900/80 bg-[#09090b]/80 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{t.storiesTab || 'ستۆری'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-800 text-violet-300 font-mono">
              {stories.length}
            </span>
          </h1>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            ستۆریێت هەڤالان و بەلاڤکرنا ستۆریا نوی
          </p>
        </div>

        {/* New Story Quick Button */}
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>ستۆریێ نوی</span>
        </button>
      </div>

      {/* Stories Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Creator Banner Card */}
        <div
          onClick={() => setIsCreatorOpen(true)}
          className="p-4 rounded-3xl bg-gradient-to-r from-[#1e152d] via-[#161426] to-[#121217] border border-purple-800/40 hover:border-purple-600/70 transition-all cursor-pointer flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-black">
                +
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-white">
                ستۆریەکا نوی بەلاڤ بکە
              </span>
              <span className="text-xs text-neutral-400">
                وێنە ژ مۆبایلێ یان نڤیسین ل سەر باکگراوندی
              </span>
            </div>
          </div>

          <span className="p-2 rounded-2xl bg-purple-600/30 text-purple-300">
            <Camera className="w-5 h-5" />
          </span>
        </div>

        {/* Stories Listing */}
        {stories.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 flex flex-col items-center gap-2">
            <Sparkles className="w-10 h-10 text-neutral-600" />
            <span className="text-xs">چ ستۆری نوکە بەلاڤ نەبووینە</span>
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="mt-2 text-xs text-purple-400 font-bold hover:underline"
            >
              ئێکەم کەس بە ستۆریەکێ بەلاڤ بکە 📸
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stories.map((story, idx) => {
              const isOwner = story.userId === currentUser.id;
              const isSuperAdmin = currentUser.username === 'sabah_sndi';

              return (
                <div
                  key={story.id}
                  className="group relative rounded-2xl overflow-hidden bg-[#16161b] border border-neutral-800 hover:border-purple-500/60 transition-all aspect-[9/14] flex flex-col justify-between p-3 cursor-pointer shadow-lg"
                  onClick={() => onOpenStory(idx)}
                >
                  {/* Background Media */}
                  {story.mediaType === 'image' && story.mediaUrl ? (
                    <img
                      src={story.mediaUrl}
                      alt={story.userName}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        story.bgGradient || 'from-purple-900 via-indigo-950 to-black'
                      }`}
                    />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />

                  {/* Top: Author */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={story.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.userName}`}
                        alt={story.userName}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500"
                      />
                      <span className="text-xs font-bold text-white drop-shadow truncate max-w-[80px]">
                        {story.userName}
                      </span>
                    </div>

                    {(isOwner || isSuperAdmin) && onDeleteStory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStory(story.id);
                        }}
                        title="ژێبرن"
                        className="p-1 rounded-lg bg-black/60 hover:bg-red-950/80 text-neutral-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Center Text (for text templates) */}
                  {story.caption && (
                    <div className="relative z-10 my-auto px-1 text-center">
                      <p
                        className={`font-bold drop-shadow leading-relaxed ${
                          story.mediaType === 'text'
                            ? 'text-sm text-white line-clamp-4'
                            : 'text-xs text-white/95 line-clamp-2'
                        }`}
                      >
                        {story.caption}
                      </p>
                    </div>
                  )}

                  {/* Bottom: Timestamp */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] text-neutral-300 drop-shadow">
                    <span className="font-mono">{story.timestamp || 'ئێستا'}</span>
                    <span className="p-1 rounded-full bg-black/40 backdrop-blur-sm">
                      <Play className="w-3 h-3 text-white" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Story Creator Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#15151a] border border-neutral-800 rounded-3xl p-5 flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>بەلاڤکرنا ستۆریا نوی</span>
              </h3>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 bg-[#1c1c22] p-1 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setCreatorMode('mobile_photo')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  creatorMode === 'mobile_photo'
                    ? 'bg-purple-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t.fromGallery || 'ژ مۆبایلێ'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatorMode('text_template')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  creatorMode === 'text_template'
                    ? 'bg-purple-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{t.templateStory || 'ستۆریێ نڤیسینێ'}</span>
              </button>
            </div>

            <form onSubmit={handlePublish} className="flex flex-col gap-3">
              {creatorMode === 'mobile_photo' ? (
                /* Mode 1: Mobile Photo */
                <div className="flex flex-col gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileSelect}
                  />

                  {uploadedImage ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[9/10] border border-neutral-700">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 left-2 px-3 py-1 bg-black/75 hover:bg-black rounded-xl text-xs text-white border border-neutral-700 cursor-pointer"
                      >
                        گۆڕین 🔄
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-purple-500 bg-neutral-900/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Upload className="w-8 h-8 text-purple-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">
                        وێنەیەکێ ژ گەلەری یان کامیرەی هەلبژێره
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        PNG, JPG ژ مۆبایلا تە
                      </span>
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder="کەپشن / نڤیسین بۆ وێنەی (ئیختیاری)..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-[#1c1c22] rounded-xl px-3.5 py-2.5 text-xs text-white border border-neutral-800 focus:outline-none focus:border-purple-500 text-right"
                    dir="rtl"
                  />
                </div>
              ) : (
                /* Mode 2: Text on Templates */
                <div className="flex flex-col gap-3">
                  {/* Template Picker */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-neutral-400">باکگراوندەکێ هەلبژێرە:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {TEMPLATE_PRESETS.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tmpl)}
                          className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer bg-gradient-to-br ${tmpl.gradient} ${
                            selectedTemplate.id === tmpl.id
                              ? 'border-amber-400 ring-2 ring-amber-400/50 scale-102 text-white'
                              : 'border-transparent text-white/80'
                          }`}
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Card Preview */}
                  <div
                    className={`rounded-2xl p-5 aspect-[9/10] bg-gradient-to-br ${selectedTemplate.gradient} border border-neutral-700 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden`}
                  >
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <img
                        src={currentUser.avatar || ''}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-white/50"
                      />
                      <span className="text-[11px] font-bold text-white drop-shadow">
                        {currentUser.name}
                      </span>
                    </div>

                    <p className="text-base font-bold text-white drop-shadow-md px-2 leading-relaxed whitespace-pre-wrap">
                      {storyText.trim() || 'نڤیسینا تە ل ڤێرێ دێ دیار بیت...'}
                    </p>
                  </div>

                  {/* Badini Text Input */}
                  <textarea
                    rows={3}
                    placeholder="دەقێ ستۆریێ بنڤیسە..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="w-full bg-[#1c1c22] rounded-xl p-3 text-xs text-white border border-neutral-800 focus:outline-none focus:border-purple-500 text-right resize-none"
                    dir="rtl"
                  />

                  {/* Quick Kurdish Emojis */}
                  <div className="flex items-center gap-2 justify-center">
                    {['☀️', '🦁', '👑', '✌️', '❤️', '🌺', '🏔️'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setStoryText((prev) => prev + ' ' + emoji)}
                        className="w-7 h-7 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-sm cursor-pointer transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  creatorMode === 'mobile_photo'
                    ? !uploadedImage
                    : !storyText.trim()
                }
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 mt-1"
              >
                <Check className="w-4 h-4" />
                <span>{t.publishStory || 'بەلاڤکرن'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
