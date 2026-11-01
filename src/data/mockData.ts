import { Chat, Story, User } from '../types/chat';

// Real Admin Account for Sabah Sndi (Founder & Super Admin)
export const DEFAULT_ADMIN_USER: User = {
  id: 'user_sabah_superadmin',
  name: 'Sabah Sndi',
  username: 'sabah',
  avatar: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
  bio: 'بەڕێوەبەرێ گشتی و خودانێ کورد چات 👑 | زاخۆ - دهۆک',
  isOnline: true,
  isAdmin: true,
  isSuperAdmin: true,
  isVerified: true,
};

// No fake accounts! All registered users come live from the server database
export const DEMO_USERS: User[] = [];

// No fake stories! Only real stories published by registered users
export const INITIAL_STORIES: Story[] = [];

// No fake conversations! Only real conversations between real people
export const INITIAL_CHATS: Chat[] = [];

export const KURDISH_STICKERS = [
  { id: 's1', text: 'سڵاو کاکە 🌸', label: 'سڵاو' },
  { id: 's2', text: 'چۆنی برام؟ ☕', label: 'چۆنی' },
  { id: 's3', text: 'دەستت خۆش بێت 👏', label: 'دەستخۆش' },
  { id: 's4', text: 'بژی کوردستان ☀️', label: 'کوردستان' },
  { id: 's5', text: 'قوربانت بم ❤️', label: 'قوربان' },
  { id: 's6', text: 'سەرچاوان 👀', label: 'سەرچاو' },
  { id: 's7', text: 'گەلەک سپاس 🙏', label: 'سوپاس' },
  { id: 's8', text: 'چاوەکانی تۆن 🌹', label: 'چاوەکان' },
  { id: 's9', text: 'بەخوا شازە! 🔥', label: 'شازە' },
  { id: 's10', text: 'هەر بژین 🦁', label: 'شێر' },
];
