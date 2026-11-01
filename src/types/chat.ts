export type Dialect = 'sorani' | 'badini' | 'english';

export interface AdminPermissions {
  canViewChats?: boolean;
  canDeleteMessages?: boolean;
  canDeleteStories?: boolean;
  canBanUsers?: boolean;
  canBroadcast?: boolean;
  canVerifyUsers?: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  adminPermissions?: AdminPermissions;
  isBanned?: boolean;
  isVerified?: boolean;
  coins?: number;
}

export type MessageType = 'text' | 'voice' | 'image' | 'call' | 'coin_gift';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // usernames or userIds
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  audioDuration?: number; // in seconds
  timestamp: string; // e.g., '12:11 م'
  status: 'sent' | 'delivered' | 'read';
  callStatus?: 'missed' | 'completed' | 'cancelled';
  callDuration?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
  coinAmount?: number;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  type: 'reward' | 'gift_sent' | 'gift_received' | 'recharge' | 'admin_grant';
  amount: number;
  description: string;
  counterpartyName?: string;
  counterpartyAvatar?: string;
  timestamp: string;
  createdAt: number;
}

export interface FollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Chat {
  id: string;
  contact: User;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
  isPinned?: boolean;
  isLocked?: boolean;
  isAccepted?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'gradient' | 'text';
  caption?: string;
  timestamp: string;
  viewed?: boolean;
  bgGradient?: string;
  textColor?: string;
  likesCount?: number;
  likedBy?: string[];
}

export type NotificationType = 'message' | 'follow_request' | 'follow_accept' | 'story_like' | 'broadcast' | 'coin_gift' | 'verification_approved' | 'verification_rejected' | 'verification_request';

export type VerificationCategory =
  | 'public_figure'
  | 'content_creator'
  | 'journalist'
  | 'business'
  | 'gamer'
  | 'artist'
  | 'community'
  | 'other';

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar: string;
  fullName: string;
  category: VerificationCategory | string;
  categoryLabel?: string;
  documentType: 'id_card' | 'passport' | 'social_link' | 'other';
  documentNote?: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  createdAt: number;
  reviewedAt?: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  type: NotificationType;
  title: string;
  content: string;
  targetId?: string;
  read: boolean;
  createdAt: number;
  timestamp: string;
}

export interface CallState {
  active: boolean;
  type: 'audio' | 'video';
  contact: User;
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isVideoOff: boolean;
}

