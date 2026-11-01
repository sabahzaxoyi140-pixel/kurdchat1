/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Chat, Story, CallState, Dialect, Message, FollowRequest, AdminPermissions, AppNotification } from './types/chat';
import { DEFAULT_ADMIN_USER } from './data/mockData';
import { AuthScreen } from './components/AuthScreen';
import { ChatList } from './components/ChatList';
import { ChatConversation } from './components/ChatConversation';
import { StoryViewer } from './components/StoryViewer';
import { CallScreen } from './components/CallScreen';
import { NewChatModal } from './components/NewChatModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CoinWalletModal } from './components/CoinWalletModal';
import { NotificationToast } from './components/NotificationToast';
import { VoiceChatModal } from './components/VoiceChatModal';
import { DominoLiveView } from './components/DominoLiveView';
import { BottomNavBar, ActiveTab } from './components/BottomNavBar';
import { FriendsExploreView } from './components/FriendsExploreView';
import { StoriesFeedView } from './components/StoriesFeedView';
import { playReceiveSound } from './utils/audio';
import { Smartphone, Monitor, Bell, X, MessageSquare, Plus } from 'lucide-react';
import { KurdistanSunEmoji } from './components/KurdistanBadge';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('kurd_chat_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeChatPartners, setActiveChatPartners] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kurd_chat_partners');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<ActiveTab>('home');
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [dialect, setDialect] = useState<Dialect>('badini');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'mobile' | 'responsive'>('mobile');

  // Broadcast announcement banner
  const [adminAnnouncement, setAdminAnnouncement] = useState<{
    text: string;
    adminName: string;
    timestamp: string;
  } | null>(null);

  // Modals & Overlays
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isVoiceChatMinimized, setIsVoiceChatMinimized] = useState(false);
  const [voiceChatContact, setVoiceChatContact] = useState<User | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  // Persist current user & chat partners
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kurd_chat_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kurd_chat_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kurd_chat_partners', JSON.stringify(activeChatPartners));
  }, [activeChatPartners]);

  // Initial Fetch from backend
  const fetchInitialData = useCallback(async () => {
    try {
      const [usersRes, messagesRes, storiesRes, statsRes, requestsRes, notifsRes] = await Promise.all([
        fetch('/api/users').catch(() => null),
        fetch('/api/messages').catch(() => null),
        fetch('/api/stories').catch(() => null),
        fetch('/api/admin/stats').catch(() => null),
        fetch('/api/friends/requests').catch(() => null),
        currentUser ? fetch(`/api/notifications?userId=${currentUser.id}`).catch(() => null) : null,
      ]);

      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.users)) setUsers(uData.users);
      }

      if (messagesRes && messagesRes.ok) {
        const mData = await messagesRes.json();
        if (Array.isArray(mData.messages)) setMessages(mData.messages);
      }

      if (storiesRes && storiesRes.ok) {
        const sData = await storiesRes.json();
        if (Array.isArray(sData.stories)) setStories(sData.stories);
      }

      if (statsRes && statsRes.ok) {
        const statData = await statsRes.json();
        if (statData.bannedUsers) setBannedUsers(statData.bannedUsers);
      }

      if (requestsRes && requestsRes.ok) {
        const rData = await requestsRes.json();
        if (Array.isArray(rData.requests)) setFollowRequests(rData.requests);
      }

      if (notifsRes && notifsRes.ok) {
        const nData = await notifsRes.json();
        if (Array.isArray(nData.notifications)) setNotifications(nData.notifications);
      }
    } catch (err) {
      console.error('Error fetching initial backend data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // SSE Stream for live real-time network sync
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            const msg: Message = data.payload;
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));

            if (currentUser && msg.senderId !== currentUser.id && soundEnabled) {
              playReceiveSound();
            }
          } else if (data.type === 'NEW_STORY') {
            const story: Story = data.payload;
            setStories((prev) => (prev.some((s) => s.id === story.id) ? prev : [story, ...prev]));
          } else if (data.type === 'USER_REGISTERED') {
            const newUser: User = data.payload;
            setUsers((prev) => (prev.some((u) => u.id === newUser.id) ? prev : [...prev, newUser]));
          } else if (data.type === 'USER_UPDATED') {
            const updatedUser: User = data.payload;
            setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            setCurrentUser((prev) => (prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev));
          } else if (data.type === 'ADMIN_BROADCAST') {
            setAdminAnnouncement(data.payload);
          } else if (data.type === 'CLEAR_CHATS') {
            setMessages([]);
          } else if (data.type === 'ADMIN_NAME_UPDATED') {
            setUsers((prev) =>
              prev.map((u) => (u.username === 'sabah_sndi' ? { ...u, name: data.payload.name } : u))
            );
          } else if (data.type === 'USER_BANNED_STATE') {
            const { username, isBanned } = data.payload;
            setBannedUsers((prev) =>
              isBanned ? [...prev.filter((u) => u !== username), username] : prev.filter((u) => u !== username)
            );
          } else if (data.type === 'USER_DELETED') {
            const { userId } = data.payload;
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setMessages((prev) => prev.filter((m) => m.senderId !== userId));
            setStories((prev) => prev.filter((s) => s.userId !== userId));
          } else if (data.type === 'MESSAGE_DELETED') {
            const { messageId } = data.payload;
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } else if (data.type === 'CONVERSATION_DELETED') {
            const { chatId } = data.payload;
            setMessages((prev) => prev.filter((m) => (m as { chatId?: string }).chatId !== chatId));
          } else if (data.type === 'STORY_DELETED') {
            const { storyId } = data.payload;
            setStories((prev) => prev.filter((s) => s.id !== storyId));
          } else if (data.type === 'FOLLOW_REQUEST_SENT') {
            const req: FollowRequest = data.payload;
            setFollowRequests((prev) =>
              prev.some((r) => r.id === req.id)
                ? prev.map((r) => (r.id === req.id ? req : r))
                : [...prev, req]
            );
          } else if (data.type === 'FOLLOW_REQUEST_UPDATED') {
            const req: FollowRequest = data.payload;
            setFollowRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
          } else if (data.type === 'FOLLOW_REQUEST_REMOVED') {
            const { fromUserId, toUserId } = data.payload;
            setFollowRequests((prev) =>
              prev.filter(
                (r) => !(r.fromUserId === fromUserId && r.toUserId === toUserId)
              )
            );
          } else if (data.type === 'NEW_NOTIFICATION') {
            const notif: AppNotification = data.payload;
            if (currentUser && notif.userId === currentUser.id) {
              setNotifications((prev) => (prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]));
              setActiveToast(notif);
              if (soundEnabled) playReceiveSound();
            }
          } else if (data.type === 'NOTIFICATIONS_READ') {
            const { userId, notificationId } = data.payload;
            if (currentUser && userId === currentUser.id) {
              setNotifications((prev) =>
                prev.map((n) => (!notificationId || n.id === notificationId ? { ...n, read: true } : n))
              );
            }
          } else if (data.type === 'NOTIFICATIONS_CLEARED') {
            const { userId } = data.payload;
            if (currentUser && userId === currentUser.id) {
              setNotifications([]);
            }
          } else if (data.type === 'STORY_LIKE_UPDATED') {
            const { storyId, likesCount, likedBy } = data.payload;
            setStories((prev) =>
              prev.map((s) => (s.id === storyId ? { ...s, likesCount, likedBy } : s))
            );
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch (err) {
      console.error('EventSource connection error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUser, soundEnabled]);

  // Compute chats dynamically between currentUser and contacts
  const chats = useMemo<Chat[]>(() => {
    if (!currentUser) return [];

    // All contacts: either users in activeChatPartners or users who have exchanged messages with currentUser
    const partnerIds = new Set<string>(activeChatPartners);

    for (const msg of messages) {
      if (msg.senderId === currentUser.id) {
        // Parse chat partner from chatId or partner ID
        const parts = (msg as { chatId?: string }).chatId?.split('__') || [];
        const otherId = parts.find((p) => p !== currentUser.id);
        if (otherId) partnerIds.add(otherId);
      } else {
        partnerIds.add(msg.senderId);
      }
    }

    // Also include Sabah Sndi admin if not me so user can immediately talk to the founder
    const sabahUser = users.find((u) => u.username === 'sabah_sndi');
    if (sabahUser && sabahUser.id !== currentUser.id) {
      partnerIds.add(sabahUser.id);
    }

    const result: Chat[] = [];

    partnerIds.forEach((contactId) => {
      if (contactId === currentUser.id) return;
      const contact = users.find((u) => u.id === contactId) || {
        id: contactId,
        name: contactId.startsWith('usr_') ? 'بەکارهێنەر' : contactId,
        username: contactId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`,
        isOnline: true,
      };

      const chatId = [currentUser.id, contact.id].sort().join('__');
      const chatMessages = messages.filter(
        (m) =>
          (m as { chatId?: string }).chatId === chatId ||
          (m.senderId === contact.id && (m as { chatId?: string }).chatId?.includes(currentUser.id)) ||
          (m.senderId === currentUser.id && (m as { chatId?: string }).chatId?.includes(contact.id))
      );

      const lastMsg = chatMessages[chatMessages.length - 1] || {
        id: 'init_' + contact.id,
        senderId: contact.id,
        text: 'گفتوگۆ دەستپێبکە ☀️',
        type: 'text',
        timestamp: 'ئێستا',
        status: 'read',
      };

      const isMutualFriend = followRequests.some(
        (r) =>
          r.status === 'accepted' &&
          ((r.fromUserId === currentUser.id && r.toUserId === contact.id) ||
            (r.toUserId === currentUser.id && r.fromUserId === contact.id))
      );

      // If not mutual accepted friend and neither is Sabah Sndi admin, chat is locked request!
      const isLocked =
        !isMutualFriend &&
        contact.username !== 'sabah_sndi' &&
        currentUser.username !== 'sabah_sndi';

      result.push({
        id: chatId,
        contact,
        lastMessage: lastMsg,
        unreadCount: 0,
        messages: chatMessages,
        isLocked,
        isAccepted: !isLocked,
      });
    });

    return result;
  }, [currentUser, users, messages, activeChatPartners, followRequests]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setSelectedChatId(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedChatId(null);
    setIsSettingsOpen(false);
    setIsAdminOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleSendMessage = async (
    chatId: string,
    messageData: Omit<Message, 'id' | 'timestamp' | 'status'>
  ) => {
    if (!currentUser) return;

    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    const timestamp = `${displayHours}:${mins} ${period}`;

    const tempId = 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newMsg: Message = {
      ...messageData,
      id: tempId,
      timestamp,
      status: 'read',
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          senderId: currentUser.id,
          text: messageData.text,
          type: messageData.type,
          mediaUrl: messageData.mediaUrl,
          audioDuration: messageData.audioDuration,
          timestamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
        }
      }
    } catch (err) {
      console.error('Failed to persist message:', err);
    }
  };

  const handleStartCall = (contact: User, type: 'audio' | 'video') => {
    setCallState({
      active: true,
      type,
      contact,
      status: 'calling',
      durationSeconds: 0,
      isMuted: false,
      isSpeaker: false,
      isVideoOff: false,
    });
  };

  const handleEndCall = () => {
    if (callState && selectedChatId && currentUser) {
      handleSendMessage(selectedChatId, {
        senderId: currentUser.id,
        text: 'پەیوەندی هەڵوەشێندرایەوە',
        type: 'call',
        callStatus: 'missed',
      });
    }
    setCallState(null);
  };

  const handleAddStory = async (newStoryData: Omit<Story, 'id' | 'timestamp'>) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          mediaUrl: newStoryData.mediaUrl,
          mediaType: newStoryData.mediaType,
          caption: newStoryData.caption,
          bgGradient: newStoryData.bgGradient,
          textColor: newStoryData.textColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.story) {
          setStories((prev) => [data.story, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to create story:', err);
    }
  };

  const handleSendFollowRequest = async (toUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: currentUser.id, toUserId }),
      });
      const data = await res.json();
      if (data.request) {
        setFollowRequests((prev) =>
          prev.some((r) => r.id === data.request.id)
            ? prev.map((r) => (r.id === data.request.id ? data.request : r))
            : [...prev, data.request]
        );
      }
    } catch (err) {
      console.error('Failed to send follow request:', err);
    }
  };

  const handleRespondFollowRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (data.request) {
        setFollowRequests((prev) =>
          prev.map((r) => (r.id === requestId ? data.request : r))
        );
      }
    } catch (err) {
      console.error('Failed to respond to follow request:', err);
    }
  };

  const handleAcceptChatRequest = async (contactId: string) => {
    if (!currentUser) return;
    const existingReq = followRequests.find(
      (r) =>
        (r.fromUserId === contactId && r.toUserId === currentUser.id) ||
        (r.fromUserId === currentUser.id && r.toUserId === contactId)
    );

    if (existingReq) {
      await handleRespondFollowRequest(existingReq.id, 'accept');
    } else {
      try {
        const res = await fetch('/api/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromUserId: contactId, toUserId: currentUser.id }),
        });
        const data = await res.json();
        if (data.request) {
          await handleRespondFollowRequest(data.request.id, 'accept');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRejectChatRequest = async (contactId: string) => {
    if (!currentUser) return;
    const existingReq = followRequests.find(
      (r) =>
        (r.fromUserId === contactId && r.toUserId === currentUser.id) ||
        (r.fromUserId === currentUser.id && r.toUserId === contactId)
    );
    if (existingReq) {
      await handleRespondFollowRequest(existingReq.id, 'reject');
    }
    setActiveChatPartners((prev) => prev.filter((id) => id !== contactId));
    if (selectedChatId) setSelectedChatId(null);
  };

  const handleSelectUserForNewChat = (user: User) => {
    setIsNewChatOpen(false);
    if (!currentUser) return;

    const chatId = [currentUser.id, user.id].sort().join('__');
    setActiveChatPartners((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setSelectedChatId(chatId);
  };

  const handleUpdateAdminName = async (newName: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: newName });
    }
    try {
      await fetch('/api/admin/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
    } catch (err) {
      console.error('Failed to update admin name:', err);
    }
  };

  const handleBroadcastMessage = async (broadcastText: string) => {
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: broadcastText,
          adminName: currentUser?.name || 'Sabah Sndi',
        }),
      });
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    }
  };

  const handleClearChats = async () => {
    setMessages([]);
    try {
      await fetch('/api/admin/clear', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear chats:', err);
    }
  };

  const handleToggleBanUser = async (username: string) => {
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        const data = await res.json();
        setBannedUsers(data.bannedUsers || []);
      }
    } catch (err) {
      console.error('Failed to toggle ban user:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMessages((prev) => prev.filter((m) => m.senderId !== userId));
      setStories((prev) => prev.filter((s) => s.userId !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleDeleteConversation = async (chatId: string) => {
    try {
      await fetch(`/api/admin/conversations/${chatId}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => (m as { chatId?: string }).chatId !== chatId));
      if (selectedChatId === chatId) setSelectedChatId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await fetch(`/api/admin/stories/${storyId}`, { method: 'DELETE' });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  const handleEditUser = async (
    userId: string,
    data: { name?: string; bio?: string; avatar?: string; isVerified?: boolean; isAdmin?: boolean }
  ) => {
    try {
      const res = await fetch('/api/admin/users/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });
      if (res.ok) {
        const result = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...result.user } : u))
        );
      }
    } catch (err) {
      console.error('Failed to edit user:', err);
    }
  };

  const handleUpdatePermissions = async (
    targetUserId: string,
    isAdmin: boolean,
    permissions: AdminPermissions
  ) => {
    try {
      const res = await fetch('/api/admin/users/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser?.id,
          targetUserId,
          isAdmin,
          permissions,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, ...result.user } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update permissions:', err);
    }
  };

  const handleMarkNotificationsAsRead = async (notificationId?: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (!notificationId || n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, notificationId }),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleClearNotifications = async () => {
    if (!currentUser) return;
    setNotifications([]);
    try {
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleSelectNotificationAction = (notification: AppNotification) => {
    setIsNotificationsOpen(false);
    if (notification.type === 'message' && notification.actorId) {
      const targetUser = users.find((u) => u.id === notification.actorId);
      if (targetUser) {
        handleSelectUserForNewChat(targetUser);
      }
    } else if (notification.type === 'follow_request') {
      setActiveNavTab('friends');
    } else if (notification.type === 'follow_accept') {
      if (notification.actorId) {
        const targetUser = users.find((u) => u.id === notification.actorId);
        if (targetUser) {
          handleSelectUserForNewChat(targetUser);
        }
      }
    } else if (notification.type === 'story_like') {
      setActiveNavTab('stories');
    } else if (notification.type === 'coin_gift') {
      setIsWalletOpen(true);
    } else if (
      notification.type === 'verification_request' &&
      (currentUser?.isAdmin || currentUser?.username === 'sabah')
    ) {
      setIsAdminOpen(true);
    } else if (
      notification.type === 'verification_approved' ||
      notification.type === 'verification_rejected'
    ) {
      setIsSettingsOpen(true);
    }
  };

  const handleCloseToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const handleSendTestNotification = (type: 'follow_request' | 'story_like' | 'message' | 'coin_gift') => {
    if (!currentUser) return;
    const otherUser = users.find((u) => u.id !== currentUser.id) || {
      id: 'demo_user',
      name: 'ڕێبین زاخۆیی',
      username: 'rebin_zaxoyi',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    };

    let title = '';
    let content = '';

    if (type === 'follow_request') {
      title = 'داخوازی فۆلۆو';
      content = `${otherUser.name} داخوازی فۆلۆوی بۆت نارد`;
    } else if (type === 'story_like') {
      title = 'لایکی ستۆری';
      content = `${otherUser.name} لایکی ستۆرییەکەت کرد`;
    } else if (type === 'message') {
      title = otherUser.name;
      content = 'سڵاو کاک سەباح، چۆنی باشی؟ پەیامەکەت گەیشت.';
    } else if (type === 'coin_gift') {
      title = 'دیاریی کۆین';
      content = `${otherUser.name} دیاریی 100 کۆینی بۆت نارد`;
    }

    const testNotif: AppNotification = {
      id: 'notif_test_' + Date.now(),
      userId: currentUser.id,
      actorId: otherUser.id,
      actorName: otherUser.name,
      actorAvatar: otherUser.avatar,
      type,
      title,
      content,
      read: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
    };

    setNotifications((prev) => [testNotif, ...prev]);
    setActiveToast(testNotif);
    if (soundEnabled) playReceiveSound();
  };

  // If not logged in, show AuthScreen (100% Real online account authentication!)
  if (!currentUser) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        dialect={dialect}
        onDialectChange={setDialect}
      />
    );
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center relative font-sans overflow-hidden">
      {/* Real Live Admin Broadcast Banner */}
      {adminAnnouncement && (
        <div className="absolute top-2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-red-950/90 via-purple-950/90 to-blue-950/90 border border-amber-400/50 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-400">
                <Bell className="w-4 h-4 animate-bounce" />
              </span>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-bold text-amber-300">
                    ئاگاداری فەرمی ({adminAnnouncement.adminName})
                  </span>
                  <KurdistanSunEmoji />
                </div>
                <p className="text-xs text-neutral-200 mt-0.5 leading-snug">
                  {adminAnnouncement.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdminAnnouncement(null)}
              className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar for Desktop Viewport Toggle */}
      <div className="w-full max-w-4xl px-4 py-2 hidden sm:flex items-center justify-between text-xs text-neutral-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">Kurd Chat</span>
          <span>•</span>
          <span className="text-neutral-400">سەکۆی ڕاستەقینەی گفتوگۆی کوردی</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-[10px] text-emerald-400 font-mono">
            {users.length} بەکارهێنەر لەسەر هێڵ
          </span>
        </div>

        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-2.5 py-1">
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-purple-600 text-white font-medium'
                : 'hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>مۆبایل</span>
          </button>
          <button
            onClick={() => setViewMode('responsive')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'responsive'
                ? 'bg-purple-600 text-white font-medium'
                : 'hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>فراوان</span>
          </button>
        </div>
      </div>

      {/* Main App Container */}
      <div
        className={`w-full h-screen sm:h-[844px] bg-black shadow-2xl overflow-hidden transition-all duration-300 relative ${
          viewMode === 'mobile'
            ? 'max-w-[420px] sm:rounded-[44px] sm:border-[8px] sm:border-[#1e1e24]'
            : 'max-w-5xl sm:rounded-3xl sm:border border-neutral-800'
        }`}
      >
        {/* Mobile Camera Notch */}
        {viewMode === 'mobile' && (
          <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#141417] rounded-full z-40 items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-black/90 mr-2" />
            <div className="w-10 h-1 bg-neutral-800 rounded-full" />
          </div>
        )}

        {/* Dual Pane or Mobile Single Screen */}
        <div className="w-full h-full flex relative overflow-hidden">
          {/* Main Navigation & Tab Screen (Home, Friends, Stories, Settings) */}
          <div
            className={`h-full flex flex-col ${
              viewMode === 'responsive'
                ? 'w-full sm:w-[380px] shrink-0 border-r border-neutral-900'
                : selectedChatId
                ? 'hidden sm:hidden'
                : 'w-full'
            }`}
          >
            {/* Active Tab View */}
            <div className="flex-1 overflow-hidden relative">
              {activeNavTab === 'home' && (
                <ChatList
                  currentUser={currentUser}
                  chats={chats}
                  stories={stories}
                  selectedChatId={selectedChatId}
                  dialect={dialect}
                  unreadNotificationsCount={notifications.filter((n) => !n.read).length}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenWallet={() => setIsWalletOpen(true)}
                  onOpenDomino={() => setActiveNavTab('domino')}
                  onOpenVoiceChat={() => {
                    setVoiceChatContact(null);
                    setIsVoiceChatOpen(true);
                    setIsVoiceChatMinimized(false);
                  }}
                  onSelectChat={handleSelectChat}
                  onOpenStory={(idx) => setActiveStoryIndex(idx)}
                  onOpenNewChat={() => setIsNewChatOpen(true)}
                  onOpenSettings={() => setActiveNavTab('settings')}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  onLogout={handleLogout}
                />
              )}

              {activeNavTab === 'friends' && (
                <FriendsExploreView
                  currentUser={currentUser}
                  users={users}
                  followRequests={followRequests}
                  dialect={dialect}
                  onSendFollowRequest={handleSendFollowRequest}
                  onRespondFollowRequest={handleRespondFollowRequest}
                  onStartChat={handleSelectUserForNewChat}
                />
              )}

              {activeNavTab === 'domino' && (
                <DominoLiveView
                  currentUser={currentUser}
                  allUsers={users}
                  dialect={dialect}
                  soundEnabled={soundEnabled}
                  onUpdateCurrentUserCoins={(newCoins) => {
                    setCurrentUser((prev) => (prev ? { ...prev, coins: newCoins } : null));
                  }}
                  onOpenWallet={() => setIsWalletOpen(true)}
                />
              )}

              {activeNavTab === 'stories' && (
                <StoriesFeedView
                  currentUser={currentUser}
                  stories={stories}
                  dialect={dialect}
                  onOpenStory={(idx) => setActiveStoryIndex(idx)}
                  onAddStory={handleAddStory}
                  onDeleteStory={handleDeleteStory}
                />
              )}

              {activeNavTab === 'settings' && (
                <SettingsModal
                  isInline={true}
                  currentUser={currentUser}
                  dialect={dialect}
                  soundEnabled={soundEnabled}
                  onUpdateUser={async (updated) => {
                    setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
                    setUsers((prev) =>
                      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updated } : u))
                    );
                    try {
                      await fetch('/api/users/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id, ...updated }),
                      });
                    } catch (err) {
                      console.error('Failed to sync profile update:', err);
                    }
                  }}
                  onDialectChange={setDialect}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  onOpenWallet={() => setIsWalletOpen(true)}
                  onLogout={handleLogout}
                />
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <BottomNavBar
              activeTab={activeNavTab}
              dialect={dialect}
              onTabChange={(tab) => {
                setActiveNavTab(tab);
                if (viewMode === 'mobile') {
                  setSelectedChatId(null);
                }
              }}
              pendingRequestsCount={
                followRequests.filter(
                  (r) => r.toUserId === currentUser?.id && r.status === 'pending'
                ).length
              }
            />
          </div>

          {/* Conversation Screen */}
          <div
            className={`h-full flex-1 ${
              viewMode === 'responsive'
                ? 'hidden sm:flex flex-col'
                : selectedChatId
                ? 'w-full flex flex-col'
                : 'hidden'
            }`}
          >
            {selectedChat ? (
              <ChatConversation
                chat={selectedChat}
                currentUser={currentUser}
                dialect={dialect}
                soundEnabled={soundEnabled}
                onBack={() => setSelectedChatId(null)}
                onSendMessage={handleSendMessage}
                onStartCall={handleStartCall}
                onStartVoiceChat={(contact) => {
                  setVoiceChatContact(contact);
                  setIsVoiceChatOpen(true);
                  setIsVoiceChatMinimized(false);
                }}
                onStartDomino={(_contact) => {
                  setActiveNavTab('domino');
                  setSelectedChatId(null);
                }}
                onAcceptRequest={() => handleAcceptChatRequest(selectedChat.contact.id)}
                onRejectRequest={() => handleRejectChatRequest(selectedChat.contact.id)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 bg-[#09090b]" dir="rtl">
                <div className="w-16 h-16 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-inner">
                  <MessageSquare className="w-8 h-8 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 tracking-tight">Kurd Chat</h3>
                <p className="text-xs text-zinc-400 max-w-xs mb-5 leading-relaxed">
                  چاتەکێ هەلبژێرە بۆ دەستپێکرنا باخڤینێ، دەنگێ ڕاستەقینە، یان پەیوەندیا تەلەفۆنێ
                </p>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-violet-600/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>دەستپێکرنا باخڤینا نوی</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={activeStoryIndex}
          currentUser={currentUser}
          onClose={() => setActiveStoryIndex(null)}
          onAddStory={handleAddStory}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* Call Screen Overlay */}
      {callState && (
        <CallScreen
          call={callState}
          dialect={dialect}
          onEndCall={handleEndCall}
          onToggleMute={() =>
            setCallState((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
          }
          onToggleSpeaker={() =>
            setCallState((prev) =>
              prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null
            )
          }
          onToggleVideo={() =>
            setCallState((prev) =>
              prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null
            )
          }
        />
      )}

      {/* New Chat Modal with real registered users */}
      {isNewChatOpen && (
        <NewChatModal
          currentUser={currentUser}
          users={users}
          dialect={dialect}
          onClose={() => setIsNewChatOpen(false)}
          onSelectUser={handleSelectUserForNewChat}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentUser={currentUser}
          dialect={dialect}
          soundEnabled={soundEnabled}
          onUpdateUser={async (updated) => {
            setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
            setUsers((prev) =>
              prev.map((u) => (u.id === currentUser.id ? { ...u, ...updated } : u))
            );
            try {
              await fetch('/api/users/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, ...updated }),
              });
            } catch (err) {
              console.error('Failed to sync profile update:', err);
            }
          }}
          onDialectChange={setDialect}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
          onLogout={handleLogout}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Admin Panel Modal matching screenshot */}
      {isAdminOpen && currentUser && (
        <AdminPanelModal
          currentUser={currentUser}
          allUsers={users}
          chats={chats}
          stories={stories}
          onClose={() => setIsAdminOpen(false)}
          onUpdateAdminName={handleUpdateAdminName}
          onBroadcastMessage={handleBroadcastMessage}
          onClearChats={handleClearChats}
          onLogout={handleLogout}
          bannedUsers={bannedUsers}
          onToggleBanUser={handleToggleBanUser}
          onDeleteUser={handleDeleteUser}
          onDeleteMessage={handleDeleteMessage}
          onDeleteConversation={handleDeleteConversation}
          onDeleteStory={handleDeleteStory}
          onEditUser={handleEditUser}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}
      {/* Notifications Modal */}
      {isNotificationsOpen && currentUser && (
        <NotificationsModal
          notifications={notifications}
          dialect={dialect}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAsRead={handleMarkNotificationsAsRead}
          onClearNotifications={handleClearNotifications}
          onSelectNotificationAction={handleSelectNotificationAction}
          onSendTestNotification={handleSendTestNotification}
        />
      )}

      {/* Real-Time Floating Notification Toast Banner */}
      <NotificationToast
        notification={activeToast}
        dialect={dialect}
        onClose={handleCloseToast}
        onOpenNotification={handleSelectNotificationAction}
      />

      {/* Voice Chat Live Room Modal / Floating PiP */}
      {currentUser && (
        <VoiceChatModal
          currentUser={currentUser}
          contact={voiceChatContact}
          allUsers={users}
          dialect={dialect}
          isOpen={isVoiceChatOpen}
          isMinimized={isVoiceChatMinimized}
          onClose={() => {
            setIsVoiceChatOpen(false);
            setIsVoiceChatMinimized(false);
          }}
          onToggleMinimize={() => setIsVoiceChatMinimized(!isVoiceChatMinimized)}
          onUpdateCurrentUserCoins={(newCoins: number) => {
            setCurrentUser((prev) => (prev ? { ...prev, coins: newCoins } : null));
            setUsers((prev) =>
              prev.map((u) => (u.id === currentUser.id ? { ...u, coins: newCoins } : u))
            );
          }}
          onOpenWallet={() => setIsWalletOpen(true)}
        />
      )}

      {/* Coin Balance & Wallet Modal */}
      {isWalletOpen && currentUser && (
        <CoinWalletModal
          currentUser={currentUser}
          allUsers={users}
          dialect={dialect}
          onClose={() => setIsWalletOpen(false)}
          onUpdateCurrentUserCoins={(newCoins: number) => {
            setCurrentUser((prev) => (prev ? { ...prev, coins: newCoins } : null));
            setUsers((prev) =>
              prev.map((u) => (u.id === currentUser.id ? { ...u, coins: newCoins } : u))
            );
          }}
        />
      )}
    </div>
  );
}
