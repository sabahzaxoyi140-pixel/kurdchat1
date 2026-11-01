import React, { useState, useEffect } from 'react';
import { Story, User } from '../types/chat';
import { X, Heart, Send, Plus, ChevronLeft, ChevronRight, Sparkles, Trash2, Upload } from 'lucide-react';
import { KurdChatLogo } from './KurdChatLogo';
import { BlueVerifiedBadge } from './KurdistanBadge';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  currentUser: User;
  onClose: () => void;
  onAddStory: (newStory: Omit<Story, 'id' | 'timestamp'>) => void;
  onDeleteStory?: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  currentUser,
  onClose,
  onAddStory,
  onDeleteStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    stories.length > 0
      ? Math.max(0, Math.min(initialIndex === -1 ? 0 : initialIndex, stories.length - 1))
      : 0
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAddStory, setShowAddStory] = useState(initialIndex === -1 || stories.length === 0);
  const [newCaption, setNewCaption] = useState('');
  const [selectedBg, setSelectedBg] = useState('gradient-1');
  const currentStory = stories[currentIndex];
  const [liked, setLiked] = useState(() => currentStory?.likedBy?.includes(currentUser.id) || false);
  const [customStoryImage, setCustomStoryImage] = useState<string | null>(null);

  useEffect(() => {
    setProgress(0);
    setLiked(Boolean(currentStory?.likedBy?.includes(currentUser.id)));
  }, [currentIndex, currentStory, currentUser.id]);

  const handleToggleLike = async () => {
    if (!currentStory) return;
    const nextLiked = !liked;
    setLiked(nextLiked);

    try {
      await fetch('/api/stories/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: currentStory.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
        }),
      });
    } catch (err) {
      console.error('Error toggling story like:', err);
    }
  };

  // Handle auto-advancing progress safely
  useEffect(() => {
    if (showAddStory || isPaused || !stories.length) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, showAddStory, stories.length]);

  // Handle story transition or closing outside of state reducers
  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((curr) => curr + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [progress, currentIndex, stories.length, onClose]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleStoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCustomStoryImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim() && !customStoryImage) return;

    const bgMap: { [key: string]: string } = {
      'gradient-1': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      'gradient-2': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      'gradient-3': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    };

    onAddStory({
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      mediaUrl: customStoryImage || bgMap[selectedBg] || bgMap['gradient-1'],
      mediaType: 'image',
      caption: newCaption.trim(),
      viewed: false,
    });

    setShowAddStory(false);
    setNewCaption('');
    setCustomStoryImage(null);
    onClose();
  };

  if (showAddStory || !currentStory) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none" dir="rtl">
        <div className="w-full max-w-sm bg-[#121217] border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>دانانا ستۆریێ نوی (بڵاوکردنەوەی ستۆری)</span>
            </h3>
            <button
              onClick={() => {
                if (stories.length > 0 && initialIndex !== -1) {
                  setShowAddStory(false);
                } else {
                  onClose();
                }
              }}
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateStory} className="flex flex-col gap-3.5">
            <textarea
              placeholder="دەقی ستۆری بنووسە... (ڕۆژێکی خۆش، پیرۆزبایی، یان وێنە)"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full h-24 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 text-xs focus:border-violet-500 focus:outline-none resize-none text-white placeholder-zinc-500 leading-relaxed font-sans"
              dir="rtl"
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-300 text-xs font-semibold cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStoryImageUpload}
                  />
                  <Upload className="w-3.5 h-3.5" />
                  <span>هەڵبژاردنی وێنە لە مۆبایل</span>
                </label>
                <span className="text-[11px] text-zinc-400">یان پاشبنەما (Background):</span>
              </div>

              {customStoryImage ? (
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-violet-500 shadow-md">
                  <img src={customStoryImage} alt="Uploaded" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCustomStoryImage(null)}
                    className="absolute top-2 right-2 bg-black/75 hover:bg-black rounded-full p-1.5 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gradient-1', label: 'پاریس و ئیڤڵ', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80' },
                    { id: 'gradient-2', label: 'سروشتێ دهۆک', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80' },
                    { id: 'gradient-3', label: 'چیاکانی زاخۆ', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBg(bg.id)}
                      className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                        selectedBg === bg.id ? 'border-violet-500 scale-102 ring-2 ring-violet-500/30' : 'border-zinc-800 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <img src={bg.img} alt={bg.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[10px] font-bold text-white text-center px-1">
                        {bg.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!newCaption.trim() && !customStoryImage}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white shadow-lg shadow-violet-600/30 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>بڵاوکردنەوەی ستۆری</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full h-full max-w-[420px] max-h-[860px] bg-neutral-950 flex flex-col justify-between overflow-hidden shadow-2xl rounded-none sm:rounded-3xl border border-neutral-800/40">
        {/* Background Image / Media */}
        <div className="absolute inset-0 z-0">
          {currentStory.mediaType === 'image' && currentStory.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                currentStory.bgGradient || 'from-purple-900 via-indigo-950 to-black'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/70" />
        </div>

        {/* Top Progress Bars */}
        <div className="relative z-10 px-4 pt-3 flex gap-1">
          {stories.map((s, idx) => (
            <div
              key={s.id}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="relative z-10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {currentStory.userName === 'Kurd Chat' ? (
              <KurdChatLogo size="sm" withGlow />
            ) : currentStory.userAvatar ? (
              <img
                src={currentStory.userAvatar}
                alt={currentStory.userName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {currentStory.userName[0]}
              </div>
            )}
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{currentStory.userName}</span>
                <BlueVerifiedBadge size="xs" />
                {currentStory.userId === currentUser.id && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/80 border border-violet-400/50 text-[10px] font-bold text-white">
                    ستۆریێ تە (Your story)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-white/70 font-sans">
                {currentStory.timestamp}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {currentStory.userId === currentUser.id && onDeleteStory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم ستۆرییە؟')) {
                    onDeleteStory(currentStory.id);
                    onClose();
                  }
                }}
                title="سڕینەوەی ستۆری"
                className="p-1.5 rounded-full bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 backdrop-blur-md transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddStory(true);
              }}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ستۆری نوێ</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation tap areas */}
        <div className="relative z-10 flex-1 flex">
          <div
            className="w-1/2 h-full cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-8 h-8 text-white/50" />
          </div>
          <div
            className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handleNext}
          >
            <ChevronRight className="w-8 h-8 text-white/50" />
          </div>
        </div>

        {/* Bottom Caption & Interactive Reply Bar */}
        <div className="relative z-10 p-4 pb-6 flex flex-col gap-3">
          {currentStory.caption && (
            <div
              className={`backdrop-blur-md p-4 rounded-2xl border text-center transition-all ${
                currentStory.mediaType === 'text'
                  ? 'bg-black/60 border-white/20 my-auto py-8'
                  : 'bg-black/50 border-white/10 text-right'
              }`}
              dir="rtl"
            >
              <p
                className={`font-bold leading-relaxed text-white drop-shadow-md ${
                  currentStory.mediaType === 'text'
                    ? 'text-lg sm:text-xl'
                    : 'text-sm font-medium'
                }`}
              >
                {currentStory.caption}
              </p>
            </div>
          )}

          {currentStory.userId === currentUser.id ? (
            <div className="flex items-center justify-between gap-2 bg-black/60 backdrop-blur-md p-2.5 rounded-2xl border border-white/15" dir="rtl">
              <div className="flex items-center gap-2 text-white">
                <span className="p-2 rounded-xl bg-rose-600/20 text-rose-400">
                  <Heart className="w-4 h-4 fill-current" />
                </span>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">
                    {currentStory.likesCount && currentStory.likesCount > 0
                      ? `${currentStory.likesCount} کەس لایک کریە`
                      : 'هێشتا چ کەسی لایک نەکریە'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ئەم ستۆرییە لەلایەن تۆوە بڵاوکراوەتەوە
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStory(true)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>دانانا دانەکا دی</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2" dir="rtl">
              <input
                type="text"
                placeholder="وەڵامدانەوەی ستۆری..."
                className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/70 focus:outline-none focus:ring-1 focus:ring-white"
              />
              <button
                type="button"
                onClick={handleToggleLike}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  liked
                    ? 'bg-rose-600 text-white scale-105 shadow-md shadow-rose-600/30'
                    : 'bg-white/15 text-white hover:bg-white/30'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
                />
                {currentStory.likesCount && currentStory.likesCount > 0 ? (
                  <span className="text-xs font-bold font-sans">{currentStory.likesCount}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="p-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white backdrop-blur-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
