import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DBAdminPermissions {
  canViewChats?: boolean;
  canDeleteMessages?: boolean;
  canDeleteStories?: boolean;
  canBanUsers?: boolean;
  canBroadcast?: boolean;
  canVerifyUsers?: boolean;
}

interface DBUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  avatar: string;
  bio?: string;
  isOnline?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  adminPermissions?: DBAdminPermissions;
  isVerified?: boolean;
  coins?: number;
  createdAt: number;
}

interface DBMessage {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: string;
  mediaUrl?: string;
  audioDuration?: number;
  timestamp: string;
  status: string;
  coinAmount?: number;
  createdAt: number;
}

interface DBStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  mediaType: string;
  caption?: string;
  bgGradient?: string;
  textColor?: string;
  timestamp: string;
  likesCount?: number;
  likedBy?: string[];
  createdAt: number;
}

export interface DBFollowRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface DBCoinTransaction {
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

export interface DBVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  username: string;
  userAvatar: string;
  fullName: string;
  category: string;
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

export interface DBNotification {
  id: string;
  userId: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  type: 'message' | 'follow_request' | 'follow_accept' | 'story_like' | 'broadcast' | 'coin_gift' | 'verification_approved' | 'verification_rejected' | 'verification_request';
  title: string;
  content: string;
  targetId?: string;
  read: boolean;
  createdAt: number;
  timestamp: string;
}

interface DatabaseSchema {
  users: DBUser[];
  messages: DBMessage[];
  stories: DBStory[];
  followRequests: DBFollowRequest[];
  verificationRequests: DBVerificationRequest[];
  notifications: DBNotification[];
  coinTransactions: DBCoinTransaction[];
  bannedUsers: string[];
  adminName: string;
}

// Initial Real Database with Sabah as Verified Super Admin (ONLY ONE SUPER ADMIN)
function getInitialData(): DatabaseSchema {
  return {
    users: [
      {
        id: 'user_sabah_superadmin',
        name: 'Sabah Sndi',
        username: 'sabah',
        password: 'Sabah22s',
        avatar: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
        bio: 'بەڕێوەبەرێ گشتی و خودانێ کورد چات 👑 | زاخۆ - دهۆک',
        isOnline: true,
        isAdmin: true,
        isSuperAdmin: true,
        coins: 5000,
        adminPermissions: {
          canViewChats: true,
          canDeleteMessages: true,
          canDeleteStories: true,
          canBanUsers: true,
          canBroadcast: true,
          canVerifyUsers: true,
        },
        isVerified: true,
        createdAt: Date.now(),
      },
    ],
    messages: [],
    stories: [],
    followRequests: [],
    verificationRequests: [],
    notifications: [],
    coinTransactions: [],
    bannedUsers: [],
    adminName: 'Sabah Sndi',
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (!Array.isArray(data.users)) data.users = [];
      if (!Array.isArray(data.messages)) data.messages = [];
      if (!Array.isArray(data.stories)) data.stories = [];
      if (!Array.isArray(data.followRequests)) data.followRequests = [];
      if (!Array.isArray(data.verificationRequests)) data.verificationRequests = [];
      if (!Array.isArray(data.notifications)) data.notifications = [];
      if (!Array.isArray(data.coinTransactions)) data.coinTransactions = [];
      if (!Array.isArray(data.bannedUsers)) data.bannedUsers = [];
      if (!data.adminName) data.adminName = 'Sabah Sndi';

      // Ensure Sabah superadmin exists with credentials: username: 'sabah', password: 'Sabah22s'
      const existingSabah = data.users.find(
        (u: DBUser) =>
          u.username.toLowerCase() === 'sabah' || u.username.toLowerCase() === 'sabah_sndi'
      );
      if (existingSabah) {
        existingSabah.username = 'sabah';
        existingSabah.password = 'Sabah22s';
        existingSabah.isAdmin = true;
        existingSabah.isSuperAdmin = true;
        existingSabah.isVerified = true;
        if (typeof existingSabah.coins !== 'number') existingSabah.coins = 5000;
        existingSabah.adminPermissions = {
          canViewChats: true,
          canDeleteMessages: true,
          canDeleteStories: true,
          canBanUsers: true,
          canBroadcast: true,
          canVerifyUsers: true,
        };
      } else {
        data.users.unshift(getInitialData().users[0]);
      }

      // Ensure NO other user is accidentally marked as super admin & initialize coins
      for (const u of data.users) {
        if (u.username.toLowerCase() !== 'sabah') {
          u.isSuperAdmin = false;
        }
        if (typeof u.coins !== 'number') {
          u.coins = u.username.toLowerCase() === 'sabah' ? 5000 : 100;
        }
      }

      return data;
    }
  } catch (err) {
    console.error('Error loading db.json, using defaults:', err);
  }
  const init = getInitialData();
  saveDatabase(init);
  return init;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

let db = loadDatabase();

// SSE Clients for instant real-time live sync across all devices
const sseClients: Set<Response> = new Set();

function broadcastEvent(type: string, payload: unknown) {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function createNotification(notif: Omit<DBNotification, 'id' | 'createdAt'>): DBNotification {
  const newNotif: DBNotification = {
    ...notif,
    id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6),
    createdAt: Date.now(),
  };
  if (!Array.isArray(db.notifications)) db.notifications = [];
  db.notifications.unshift(newNotif);
  if (db.notifications.length > 300) {
    db.notifications = db.notifications.slice(0, 300);
  }
  saveDatabase(db);
  broadcastEvent('NEW_NOTIFICATION', newNotif);
  return newNotif;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Support JSON payloads up to 25MB for real voice recordings & photos
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // SSE endpoint for live real-time network
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Initial sync
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientsCount: sseClients.size })}\n\n`);

    // Keep connection alive with periodic heartbeat
    const interval = setInterval(() => {
      res.write(':ping\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      onlineUsers: sseClients.size,
      totalUsers: db.users.length,
      timestamp: Date.now(),
    });
  });

  // Direct ZIP download endpoints for Android Chrome & mobile browsers
  const handleZipDownload = (_req: Request, res: Response) => {
    const zipPath = path.join(__dirname, 'public', 'kurd-chat-project.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).send('ZIP file is being prepared. Please try again in a moment.');
      return;
    }
    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', 'attachment; filename="kurd-chat-project.zip"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=60');
    const readStream = fs.createReadStream(zipPath);
    readStream.pipe(res);
  };

  app.get('/kurd-chat-project.zip', handleZipDownload);
  app.get('/KurdChat_Domino_Source_Code.zip', handleZipDownload);
  app.get('/api/download/project.zip', handleZipDownload);
  app.get('/api/download/domino.zip', handleZipDownload);

  // Serve dedicated offline downloader page at /download
  app.get('/download', (_req: Request, res: Response) => {
    const htmlPath = path.join(__dirname, 'public', 'download-offline.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.redirect('/download-offline.html');
    }
  });

  // Real User Registration (Online for all users)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, username, password, avatar, bio } = req.body;
    if (!name || !username || !password) {
      res.status(400).json({ error: 'Name, username, and password are required' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

    // Check if username already exists
    if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      res.status(400).json({ error: 'ناوی بەکارهێنەر پێشتر گیراوە / Username already taken' });
      return;
    }

    const newUser: DBUser = {
      id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      username: cleanUsername,
      password: password.trim(),
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      bio: bio?.trim() || 'ئەندامی فەرمی لە کورد چات ☀️',
      isOnline: true,
      isAdmin: false, // Strictly false: only Super Admin Sabah can grant admin!
      isSuperAdmin: false,
      isVerified: false,
      createdAt: Date.now(),
    };

    db.users.push(newUser);
    saveDatabase(db);

    // Broadcast new user to all connected devices in real time!
    const safeUser = { ...newUser };
    delete safeUser.password;
    broadcastEvent('USER_REGISTERED', safeUser);

    res.json({ success: true, user: safeUser });
  });

  // Real User Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const isSabah = cleanUsername === 'sabah' || cleanUsername === 'sabah_sndi';

    const user = db.users.find((u) => {
      const uName = u.username.toLowerCase();
      if (isSabah && (uName === 'sabah' || uName === 'sabah_sndi')) {
        return password === 'Sabah22s' || u.password === password;
      }
      return uName === cleanUsername && u.password === password;
    });

    if (!user) {
      res.status(401).json({ error: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە / Invalid username or password' });
      return;
    }

    // Check if banned
    if (db.bannedUsers.includes(user.username)) {
      res.status(403).json({ error: 'هەژمارەکەت ڕاگیراوە لەلایەن بەڕێوەبەرەوە (Banned)' });
      return;
    }

    const safeUser = { ...user, isOnline: true };
    delete safeUser.password;
    res.json({ success: true, user: safeUser });
  });

  // Get all registered real users (Public directory visible to everyone)
  app.get('/api/users', (_req: Request, res: Response) => {
    const safeUsers = db.users.map((u) => {
      const safe = { ...u };
      delete safe.password;
      return safe;
    });
    res.json({ users: safeUsers });
  });

  // Update user profile
  app.post('/api/users/profile', (req: Request, res: Response) => {
    const { userId, name, bio, avatar, isVerified } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);

    saveDatabase(db);

    const safeUser = { ...user };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({ success: true, user: safeUser });
  });

  // Get messages for chat
  app.get('/api/messages', (req: Request, res: Response) => {
    const chatId = req.query.chatId as string;
    if (chatId) {
      const chatMessages = db.messages.filter((m) => m.chatId === chatId);
      res.json({ messages: chatMessages });
    } else {
      res.json({ messages: db.messages });
    }
  });

  // Send real message
  app.post('/api/messages', (req: Request, res: Response) => {
    const { chatId, senderId, text, type, mediaUrl, audioDuration, timestamp } = req.body;
    if (!chatId || !senderId) {
      res.status(400).json({ error: 'chatId and senderId required' });
      return;
    }

    const newMsg: DBMessage = {
      id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
      chatId,
      senderId,
      text: text || '',
      type: type || 'text',
      mediaUrl,
      audioDuration,
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      createdAt: Date.now(),
    };

    db.messages.push(newMsg);
    saveDatabase(db);

    // Broadcast instantly to all online devices!
    broadcastEvent('NEW_MESSAGE', newMsg);

    // Dispatch notification to recipient
    try {
      const parts = chatId.split('__');
      const recipientId = parts.find((p: string) => p !== senderId);
      if (recipientId) {
        const sender = db.users.find((u) => u.id === senderId);
        const senderName = sender?.name || 'بەکارهێنەر';
        let snippet = text || '';
        if (type === 'voice') snippet = 'نامەی دەنگی نارد';
        else if (type === 'image') snippet = 'وێنەیەکی نارد';
        else if (type === 'call') snippet = 'پەیوەندی تەلەفۆنی ئەنجامدا';

        createNotification({
          userId: recipientId,
          actorId: senderId,
          actorName: senderName,
          actorAvatar: sender?.avatar || '',
          type: 'message',
          title: senderName,
          content: snippet || 'نامەیەکی نوێ نارد',
          targetId: chatId,
          read: false,
          timestamp: newMsg.timestamp,
        });
      }
    } catch (err) {
      console.error('Error creating message notification:', err);
    }

    res.json({ success: true, message: newMsg });
  });

  // Get active stories
  app.get('/api/stories', (_req: Request, res: Response) => {
    res.json({ stories: db.stories });
  });

  // Like a story
  app.post('/api/stories/like', (req: Request, res: Response) => {
    const { storyId, userId, userName, userAvatar } = req.body;
    if (!storyId || !userId) {
      res.status(400).json({ error: 'storyId and userId are required' });
      return;
    }

    const story = db.stories.find((s) => s.id === storyId);
    if (!story) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }

    if (!Array.isArray(story.likedBy)) story.likedBy = [];
    const alreadyLiked = story.likedBy.includes(userId);

    if (alreadyLiked) {
      story.likedBy = story.likedBy.filter((id) => id !== userId);
    } else {
      story.likedBy.push(userId);
    }
    story.likesCount = story.likedBy.length;
    saveDatabase(db);

    broadcastEvent('STORY_LIKE_UPDATED', {
      storyId,
      likesCount: story.likesCount,
      likedBy: story.likedBy,
    });

    // Notify story owner if liked by someone else
    if (!alreadyLiked && story.userId !== userId) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      createNotification({
        userId: story.userId,
        actorId: userId,
        actorName: userName || 'بەکارهێنەر',
        actorAvatar: userAvatar || '',
        type: 'story_like',
        title: 'لایکی ستۆری',
        content: `${userName || 'بەکارهێنەر'} لایکی ستۆرییەکەت کرد`,
        targetId: storyId,
        read: false,
        timestamp: timeStr,
      });
    }

    res.json({ success: true, likesCount: story.likesCount, likedBy: story.likedBy });
  });

  // Add real story (supports photos from phone and custom text templates)
  app.post('/api/stories', (req: Request, res: Response) => {
    const { userId, userName, userAvatar, mediaUrl, mediaType, caption, bgGradient, textColor } = req.body;
    if (!userId || (!mediaUrl && !caption)) {
      res.status(400).json({ error: 'userId and either mediaUrl or caption are required' });
      return;
    }

    const newStory: DBStory = {
      id: 'story_' + Date.now(),
      userId,
      userName: userName || 'بەکارهێنەر',
      userAvatar: userAvatar || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || (mediaUrl ? 'image' : 'text'),
      caption: caption || '',
      bgGradient: bgGradient || 'from-purple-900 via-indigo-950 to-black',
      textColor: textColor || '#ffffff',
      timestamp: 'ئێستا',
      likesCount: 0,
      likedBy: [],
      createdAt: Date.now(),
    };

    db.stories.unshift(newStory);
    saveDatabase(db);

    broadcastEvent('NEW_STORY', newStory);

    res.json({ success: true, story: newStory });
  });

  // Delete story
  app.delete('/api/stories/:storyId', (req: Request, res: Response) => {
    const { storyId } = req.params;
    db.stories = db.stories.filter((s) => s.id !== storyId);
    saveDatabase(db);
    broadcastEvent('STORY_DELETED', { storyId });
    res.json({ success: true, storyId });
  });

  // Notifications API
  app.get('/api/notifications', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.json({ notifications: db.notifications || [] });
      return;
    }

    const userNotifs = (db.notifications || []).filter((n) => n.userId === userId);
    res.json({ notifications: userNotifs });
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    const { userId, notificationId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    if (!Array.isArray(db.notifications)) db.notifications = [];

    if (notificationId) {
      const n = db.notifications.find((notif) => notif.id === notificationId && notif.userId === userId);
      if (n) n.read = true;
    } else {
      db.notifications.forEach((notif) => {
        if (notif.userId === userId) notif.read = true;
      });
    }

    saveDatabase(db);
    broadcastEvent('NOTIFICATIONS_READ', { userId, notificationId });
    res.json({ success: true });
  });

  app.post('/api/notifications/clear', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications = db.notifications.filter((n) => n.userId !== userId);
    saveDatabase(db);

    broadcastEvent('NOTIFICATIONS_CLEARED', { userId });
    res.json({ success: true });
  });

  // Coin Balance & Wallet API
  app.get('/api/wallet', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    const user = db.users.find((u) => u.id === userId);
    const coins = typeof user?.coins === 'number' ? user.coins : 100;
    const transactions = (db.coinTransactions || [])
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json({ coins, transactions });
  });

  // Claim Daily Free Coins
  app.post('/api/wallet/claim-daily', (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const todayStr = new Date().toDateString();
    const lastClaim = (db.coinTransactions || []).find(
      (t) => t.userId === userId && t.type === 'reward' && new Date(t.createdAt).toDateString() === todayStr
    );
    if (lastClaim) {
      res.status(400).json({ error: 'خەڵاتی ئەمڕۆت وەرگرتووە! سبەی وەرەوە.' });
      return;
    }

    const rewardAmount = 35;
    user.coins = (typeof user.coins === 'number' ? user.coins : 100) + rewardAmount;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tx: DBCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: 'reward',
      amount: rewardAmount,
      description: 'خەڵاتی ڕۆژانەی بەکارهێنەر (Daily Coin Reward)',
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    if (!Array.isArray(db.coinTransactions)) db.coinTransactions = [];
    db.coinTransactions.unshift(tx);
    saveDatabase(db);

    const safeUser = { ...user };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({ success: true, coins: user.coins, transaction: tx });
  });

  // Transfer / Gift Coins to another user
  app.post('/api/wallet/transfer', (req: Request, res: Response) => {
    const { fromUserId, toUserId, amount, note } = req.body;
    const transferAmount = parseInt(amount, 10);
    if (!transferAmount || transferAmount <= 0) {
      res.status(400).json({ error: 'تکایە بڕێکی دروست بنووسە' });
      return;
    }

    const sender = db.users.find((u) => u.id === fromUserId);
    const recipient = db.users.find((u) => u.id === toUserId);
    if (!sender || !recipient) {
      res.status(404).json({ error: 'بەکارهێنەر نەدۆزرایەوە' });
      return;
    }

    const senderCoins = typeof sender.coins === 'number' ? sender.coins : 100;
    if (senderCoins < transferAmount) {
      res.status(400).json({ error: 'باڵانسی تۆ بەس نییە بۆ ئەم دیارییە!' });
      return;
    }

    sender.coins = senderCoins - transferAmount;
    recipient.coins = (typeof recipient.coins === 'number' ? recipient.coins : 100) + transferAmount;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = Date.now();

    const senderTx: DBCoinTransaction = {
      id: `tx_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId: fromUserId,
      type: 'gift_sent',
      amount: -transferAmount,
      description: note ? `ناردنی دیاری: ${note}` : `ناردنی دیاری کۆین بۆ @${recipient.username}`,
      counterpartyName: recipient.name,
      counterpartyAvatar: recipient.avatar,
      timestamp: timeStr,
      createdAt: now,
    };

    const recipientTx: DBCoinTransaction = {
      id: `tx_${now}_${Math.random().toString(36).substring(2, 7)}_r`,
      userId: toUserId,
      type: 'gift_received',
      amount: transferAmount,
      description: note ? `وەرگرتنی دیاری: ${note}` : `وەرگرتنی دیاری کۆین لە @${sender.username}`,
      counterpartyName: sender.name,
      counterpartyAvatar: sender.avatar,
      timestamp: timeStr,
      createdAt: now,
    };

    if (!Array.isArray(db.coinTransactions)) db.coinTransactions = [];
    db.coinTransactions.unshift(senderTx, recipientTx);
    saveDatabase(db);

    // Create Notification
    createNotification({
      userId: toUserId,
      actorId: fromUserId,
      actorName: sender.name,
      actorAvatar: sender.avatar,
      type: 'coin_gift',
      title: 'دیاری کۆین وەرگیرا',
      content: `${sender.name} بڕی ${transferAmount} کۆینی وەک دیاری بۆتۆ نارد!`,
      targetId: fromUserId,
      read: false,
      timestamp: timeStr,
    });

    const safeSender = { ...sender };
    delete safeSender.password;
    const safeRecipient = { ...recipient };
    delete safeRecipient.password;

    broadcastEvent('USER_UPDATED', safeSender);
    broadcastEvent('USER_UPDATED', safeRecipient);

    res.json({ success: true, senderCoins: sender.coins, transaction: senderTx });
  });

  // Get Official Payment Methods for Coin Recharge
  app.get('/api/wallet/payment-methods', (_req: Request, res: Response) => {
    res.json({
      methods: [
        {
          id: 'superqi',
          name: 'SuperQi',
          kurName: 'سۆپەر کی (SuperQi)',
          account: '7502236113',
          type: 'mobile_wallet',
          badge: 'SuperQi',
          note: 'ژمارەی ئەژمار: 7502236113',
        },
        {
          id: 'fib',
          name: 'First Iraqi Bank',
          kurName: 'فێرست عێراق بانک (FIB)',
          account: '7502236113',
          type: 'bank',
          badge: 'FIB Bank',
          note: 'ژمارەی هەژمار: 7502236113',
        },
        {
          id: 'nasspay',
          name: 'NassPay',
          kurName: 'ناس پای (NassPay)',
          account: '7502236113',
          type: 'card',
          badge: 'NassPay',
          note: 'ژمارەی کارتی ناس پای: 7502236113',
        },
        {
          id: 'fastpay',
          name: 'FastPay',
          kurName: 'فاست پای (FastPay)',
          account: '7502236113',
          type: 'mobile_wallet',
          badge: 'FastPay',
          note: 'ژمارەی هەژمار: 7502236113',
        },
        {
          id: 'usdt',
          name: 'USDT (TRC20)',
          kurName: 'کریپتۆ USDT (TRC-20)',
          account: 'TAVaLZGavKH5ZaSiRY3mc65Eji6DPsXrRR',
          type: 'crypto',
          badge: 'TRC-20',
          note: 'ناونیشانی جزدانی ترۆن TRC20: TAVaLZGavKH5ZaSiRY3mc65Eji6DPsXrRR',
        },
      ],
    });
  });

  // Instant Recharge Coins
  app.post('/api/wallet/recharge', (req: Request, res: Response) => {
    const { userId, packageAmount, paymentMethod, txRef } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const amount = parseInt(packageAmount, 10);
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    user.coins = (typeof user.coins === 'number' ? user.coins : 100) + amount;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const methodDesc = paymentMethod ? ` ب ڕێکا ${paymentMethod}` : '';
    const refDesc = txRef ? ` (Ref: ${txRef})` : '';

    const tx: DBCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: 'recharge',
      amount,
      description: `پڕکردنەوەی باڵانس (+${amount} کۆین)${methodDesc}${refDesc}`,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    if (!Array.isArray(db.coinTransactions)) db.coinTransactions = [];
    db.coinTransactions.unshift(tx);
    saveDatabase(db);

    const safeUser = { ...user };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    // Notify Super Admin Sabah about the recharge
    const sabahUser = db.users.find((u) => u.username.toLowerCase() === 'sabah');
    if (sabahUser && sabahUser.id !== userId) {
      createNotification({
        userId: sabahUser.id,
        actorId: userId,
        actorName: user.name,
        actorAvatar: user.avatar,
        type: 'coin_gift',
        title: 'پڕکردنەوەی کۆین',
        content: `${user.name} باڵانسی +${amount} کۆینی پڕکردەوە${methodDesc}`,
        targetId: tx.id,
        read: false,
        timestamp: timeStr,
      });
    }

    res.json({ success: true, coins: user.coins, transaction: tx });
  });

  // Admin Grant Coins to User
  app.post('/api/admin/users/coins', (req: Request, res: Response) => {
    const { targetUserId, amount, reason } = req.body;
    const targetUser = db.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const coinDelta = parseInt(amount, 10);
    targetUser.coins = Math.max(0, (typeof targetUser.coins === 'number' ? targetUser.coins : 100) + coinDelta);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tx: DBCoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: targetUserId,
      type: 'admin_grant',
      amount: coinDelta,
      description: reason || `بەخشینی باڵانس لەلایەن بەڕێوەبەری گشتی`,
      counterpartyName: db.adminName,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    if (!Array.isArray(db.coinTransactions)) db.coinTransactions = [];
    db.coinTransactions.unshift(tx);
    saveDatabase(db);

    const safeUser = { ...targetUser };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({ success: true, user: safeUser, transaction: tx });
  });

  // Domino Game Result & Pot settlement API
  app.post('/api/domino/game-result', (req: Request, res: Response) => {
    const { userId, wager, won, winReason, opponentName, pointsAwarded } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const wagerAmt = parseInt(wager, 10) || 0;
    let coinsChange = 0;

    if (won && wagerAmt > 0) {
      coinsChange = wagerAmt;
      user.coins = (typeof user.coins === 'number' ? user.coins : 100) + coinsChange;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tx: DBCoinTransaction = {
        id: `tx_${Date.now()}_domino`,
        userId,
        type: 'reward',
        amount: coinsChange,
        description: `بردنەوەی دۆمینە LIVE (+${coinsChange} کۆین) دژی ${opponentName || 'هەڤڕک'}`,
        counterpartyName: opponentName || 'Domino Table',
        timestamp: timeStr,
        createdAt: Date.now(),
      };

      if (!Array.isArray(db.coinTransactions)) db.coinTransactions = [];
      db.coinTransactions.unshift(tx);
    }

    saveDatabase(db);

    const safeUser = { ...user };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({
      success: true,
      coins: user.coins,
      coinsWon: coinsChange,
    });
  });

  // Domino Friend Match Challenge Invitation
  app.post('/api/domino/invite', (req: Request, res: Response) => {
    const { fromUserId, toUserId, wager } = req.body;
    const sender = db.users.find((u) => u.id === fromUserId);
    const recipient = db.users.find((u) => u.id === toUserId);

    if (!sender || !recipient) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wagerText = wager > 0 ? ` ل سەر ${wager} کۆینان` : '';

    createNotification({
      userId: toUserId,
      actorId: fromUserId,
      actorName: sender.name,
      actorAvatar: sender.avatar,
      type: 'coin_gift',
      title: 'تەحەدیا دۆمینە LIVE 🎲',
      content: `${sender.name} تەحەدیا تە کریە بۆ یاریا دۆمینێ${wagerText}! وەرە یاریێ بکەین.`,
      targetId: 'domino',
      read: false,
      timestamp: timeStr,
    });

    res.json({ success: true, message: 'تەحەدی هاتە هنارتن' });
  });

  // Download endpoints for Source Code ZIP, PDF, and HTML
  app.get(
    [
      '/kurd-chat-project.zip',
      '/KurdChat_Domino_Source_Code.zip',
      '/api/download/source-code.zip',
      '/api/download/project.zip',
      '/api/download/kurd-chat-project.zip',
    ],
    (_req: Request, res: Response) => {
      const zipPath = path.join(__dirname, 'public', 'kurd-chat-project.zip');
      if (fs.existsSync(zipPath)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="kurd-chat-project.zip"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.download(zipPath, 'kurd-chat-project.zip');
      } else {
        res.status(404).json({ error: 'ZIP archive not found' });
      }
    }
  );

  app.get('/api/download/source-code.pdf', (_req: Request, res: Response) => {
    const pdfPath = path.join(__dirname, 'public', 'KurdChat_Domino_Source_Code.pdf');
    if (fs.existsSync(pdfPath)) {
      res.download(pdfPath, 'KurdChat_Domino_Source_Code.pdf');
    } else {
      res.status(404).json({ error: 'PDF document not found' });
    }
  });

  app.get('/api/download/source-code.html', (_req: Request, res: Response) => {
    const htmlPath = path.join(__dirname, 'public', 'source-code.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).json({ error: 'HTML document not found' });
    }
  });

  // Follow & Request System API
  // Get follow requests for user
  app.get('/api/friends/requests', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.json({ requests: db.followRequests });
      return;
    }

    const userRequests = db.followRequests.filter(
      (r) => r.toUserId === userId || r.fromUserId === userId
    );
    res.json({ requests: userRequests });
  });

  // Send a follow request
  app.post('/api/friends/request', (req: Request, res: Response) => {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      res.status(400).json({ error: 'fromUserId and toUserId required' });
      return;
    }

    if (fromUserId === toUserId) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    const fromUser = db.users.find((u) => u.id === fromUserId);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if existing request
    const existingIndex = db.followRequests.findIndex(
      (r) =>
        (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
        (r.fromUserId === toUserId && r.toUserId === fromUserId)
    );

    if (existingIndex !== -1) {
      const existing = db.followRequests[existingIndex];
      if (existing.status === 'accepted') {
        res.json({ success: true, request: existing, message: 'Already friends' });
        return;
      }
      if (existing.status === 'pending') {
        res.json({ success: true, request: existing, message: 'Request already pending' });
        return;
      }
      existing.status = 'pending';
      existing.fromUserId = fromUserId;
      existing.toUserId = toUserId;
      existing.createdAt = Date.now();
      saveDatabase(db);
      broadcastEvent('FOLLOW_REQUEST_SENT', existing);

      createNotification({
        userId: toUserId,
        actorId: fromUserId,
        actorName: fromUser?.name || 'بەکارهێنەر',
        actorAvatar: fromUser?.avatar || '',
        type: 'follow_request',
        title: 'داخوازی فۆلۆو',
        content: `${fromUser?.name || 'بەکارهێنەر'} داخوازی فۆلۆوی بۆت نارد`,
        targetId: fromUserId,
        read: false,
        timestamp: timeStr,
      });

      res.json({ success: true, request: existing });
      return;
    }

    const newReq: DBFollowRequest = {
      id: 'freq_' + Date.now() + Math.random().toString(36).substring(2, 5),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: Date.now(),
    };

    db.followRequests.push(newReq);
    saveDatabase(db);

    broadcastEvent('FOLLOW_REQUEST_SENT', newReq);

    createNotification({
      userId: toUserId,
      actorId: fromUserId,
      actorName: fromUser?.name || 'بەکارهێنەر',
      actorAvatar: fromUser?.avatar || '',
      type: 'follow_request',
      title: 'داخوازی فۆلۆو',
      content: `${fromUser?.name || 'بەکارهێنەر'} داخوازی فۆلۆوی بۆت نارد`,
      targetId: fromUserId,
      read: false,
      timestamp: timeStr,
    });

    res.json({ success: true, request: newReq });
  });

  // Respond to follow request (Accept or Reject)
  app.post('/api/friends/respond', (req: Request, res: Response) => {
    const { requestId, action } = req.body;
    if (!requestId || !action) {
      res.status(400).json({ error: 'requestId and action required' });
      return;
    }

    const reqItem = db.followRequests.find((r) => r.id === requestId);
    if (!reqItem) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    reqItem.status = action === 'accept' ? 'accepted' : 'rejected';
    saveDatabase(db);

    broadcastEvent('FOLLOW_REQUEST_UPDATED', reqItem);

    if (action === 'accept') {
      const toUser = db.users.find((u) => u.id === reqItem.toUserId);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      createNotification({
        userId: reqItem.fromUserId,
        actorId: reqItem.toUserId,
        actorName: toUser?.name || 'بەکارهێنەر',
        actorAvatar: toUser?.avatar || '',
        type: 'follow_accept',
        title: 'داخوازی پەسەندکرا',
        content: `${toUser?.name || 'بەکارهێنەر'} داخوازی فۆلۆوەکەی تە پەسەندکر`,
        targetId: reqItem.toUserId,
        read: false,
        timestamp: timeStr,
      });
    }

    res.json({ success: true, request: reqItem });
  });

  // Unfollow user
  app.post('/api/friends/unfollow', (req: Request, res: Response) => {
    const { fromUserId, toUserId } = req.body;
    db.followRequests = db.followRequests.filter(
      (r) =>
        !(
          (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
          (r.fromUserId === toUserId && r.toUserId === fromUserId)
        )
    );
    broadcastEvent('FOLLOW_REQUEST_REMOVED', { fromUserId, toUserId });
    res.json({ success: true });
  });

  // ==================== ACCOUNT VERIFICATION (PEJIRANDINA HESABÊ) APIS ====================
  // Check verification status of a user
  app.get('/api/verification/status', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const request = (db.verificationRequests || []).find((r) => r.userId === userId) || null;
    res.json({
      isVerified: Boolean(user.isVerified),
      request,
    });
  });

  // Submit Account Verification Application (Pejirandina Hesabê)
  app.post('/api/verification/request', (req: Request, res: Response) => {
    const { userId, fullName, category, categoryLabel, documentType, documentNote, documentUrl } = req.body;
    if (!userId || !fullName) {
      res.status(400).json({ error: 'تکایە ناڤێ تە یێ دروست و فەرمی بنڤیسە' });
      return;
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'هەژمارا تە پێشتر یا هاتیە پەژراندن ب باجێ شین 🔵✓' });
      return;
    }

    if (!Array.isArray(db.verificationRequests)) db.verificationRequests = [];

    const existingIndex = db.verificationRequests.findIndex((r) => r.userId === userId);
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let reqItem: DBVerificationRequest;
    if (existingIndex !== -1) {
      reqItem = db.verificationRequests[existingIndex];
      reqItem.userName = user.name;
      reqItem.username = user.username;
      reqItem.userAvatar = user.avatar;
      reqItem.fullName = fullName.trim();
      reqItem.category = category || 'public_figure';
      reqItem.categoryLabel = categoryLabel || 'کەسایەتی گشتی';
      reqItem.documentType = documentType || 'id_card';
      reqItem.documentNote = documentNote || '';
      reqItem.documentUrl = documentUrl || '';
      reqItem.status = 'pending';
      reqItem.createdAt = now;
      delete reqItem.adminNote;
      delete reqItem.reviewedBy;
      delete reqItem.reviewedAt;
    } else {
      reqItem = {
        id: 'vreq_' + now + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        userName: user.name,
        username: user.username,
        userAvatar: user.avatar,
        fullName: fullName.trim(),
        category: category || 'public_figure',
        categoryLabel: categoryLabel || 'کەسایەتی گشتی',
        documentType: documentType || 'id_card',
        documentNote: documentNote || '',
        documentUrl: documentUrl || '',
        status: 'pending',
        createdAt: now,
      };
      db.verificationRequests.unshift(reqItem);
    }

    saveDatabase(db);
    broadcastEvent('VERIFICATION_REQUEST_CREATED', reqItem);

    // Notify Super Admin Sabah about incoming Account Verification Request
    const sabahUser = db.users.find((u) => u.username.toLowerCase() === 'sabah');
    if (sabahUser && sabahUser.id !== userId) {
      createNotification({
        userId: sabahUser.id,
        actorId: user.id,
        actorName: user.name,
        actorAvatar: user.avatar,
        type: 'verification_request',
        title: 'داخوازیا پەژراندنا هەژمارێ 🔵',
        content: `${user.name} (@${user.username}) داخوازیا پەژراندنا هەژمارێ (Pejirandina Hesabê) تۆمارکر.`,
        targetId: reqItem.id,
        read: false,
        timestamp: timeStr,
      });
    }

    res.json({ success: true, request: reqItem });
  });

  // Admin Get All Verification Requests
  app.get('/api/admin/verification/requests', (_req: Request, res: Response) => {
    res.json({ requests: db.verificationRequests || [] });
  });

  // Admin Review Account Verification (Approve / Reject / Revoke)
  app.post('/api/admin/verification/review', (req: Request, res: Response) => {
    const { adminUserId, requestId, action, adminNote } = req.body;
    if (!requestId || !action) {
      res.status(400).json({ error: 'requestId and action required' });
      return;
    }

    const admin = db.users.find(
      (u) =>
        u.id === adminUserId ||
        u.username.toLowerCase() === 'sabah' ||
        u.username.toLowerCase() === 'sabah_sndi'
    );

    const isAuthorized =
      admin?.isSuperAdmin ||
      admin?.username.toLowerCase() === 'sabah' ||
      admin?.adminPermissions?.canVerifyUsers;

    if (!isAuthorized) {
      res.status(403).json({ error: 'دەسەڵاتا پەژراندنا هەژماران تنێ بۆ ئەدمینێن باڵایە' });
      return;
    }

    if (!Array.isArray(db.verificationRequests)) db.verificationRequests = [];
    const reqItem = db.verificationRequests.find((r) => r.id === requestId);
    if (!reqItem) {
      res.status(404).json({ error: 'داخوازی نەهاتە دیتن' });
      return;
    }

    const targetUser = db.users.find((u) => u.id === reqItem.userId);
    if (!targetUser) {
      res.status(404).json({ error: 'بکارهێنەر نەهاتە دیتن' });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const now = Date.now();

    if (action === 'approve') {
      targetUser.isVerified = true;
      reqItem.status = 'approved';
      reqItem.reviewedBy = admin?.name || db.adminName;
      reqItem.reviewedAt = now;
      reqItem.adminNote = adminNote || 'هاتە چەسپاندن و پەژراندن ب باجێ شین یێ فەرمی';

      // Send congratulatory notification to verified user
      createNotification({
        userId: targetUser.id,
        actorId: admin?.id || 'admin',
        actorName: admin?.name || 'Sabah Sndi',
        actorAvatar: admin?.avatar || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
        type: 'verification_approved',
        title: 'پیرۆزە! هەژمارا تە هاتە پەژراندن 🔵✨',
        content: 'پیرۆزە! داخوازیا تە یا پەژراندنا هەژمارێ (Pejirandina Hesabê) هاتە پەسەندکرن و باجێ شین یێ فەرمی بۆ تە هاتە بەخشین.',
        targetId: reqItem.id,
        read: false,
        timestamp: timeStr,
      });
    } else if (action === 'reject') {
      targetUser.isVerified = false;
      reqItem.status = 'rejected';
      reqItem.reviewedBy = admin?.name || db.adminName;
      reqItem.reviewedAt = now;
      reqItem.adminNote = adminNote || 'داخوازی دگەل مەرجێن پەژراندنێ یێن کورد چات ناگونجیت.';

      createNotification({
        userId: targetUser.id,
        actorId: admin?.id || 'admin',
        actorName: admin?.name || 'Sabah Sndi',
        actorAvatar: admin?.avatar || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
        type: 'verification_rejected',
        title: 'ئاگاداری دەربارەی پەژراندنا هەژمارێ',
        content: `داخوازیا تە یا پەژراندنا هەژمارێ نەهاتە پەسەندکرن: ${reqItem.adminNote}`,
        targetId: reqItem.id,
        read: false,
        timestamp: timeStr,
      });
    } else if (action === 'revoke') {
      targetUser.isVerified = false;
      reqItem.status = 'rejected';
      reqItem.reviewedBy = admin?.name || db.adminName;
      reqItem.reviewedAt = now;
      reqItem.adminNote = adminNote || 'باجێ فەرمی هاتە لادان ژ لایێ بەڕێوەبەرایەتیێ';
    }

    saveDatabase(db);

    const safeTargetUser = { ...targetUser };
    delete safeTargetUser.password;

    broadcastEvent('USER_UPDATED', safeTargetUser);
    broadcastEvent('VERIFICATION_REQUEST_UPDATED', reqItem);

    res.json({ success: true, request: reqItem, user: safeTargetUser });
  });

  // Admin Broadcast Announcement
  app.post('/api/admin/broadcast', (req: Request, res: Response) => {
    const { text, adminName } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text required' });
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const announcement = {
      id: 'ann_' + Date.now(),
      text,
      adminName: adminName || db.adminName,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    broadcastEvent('ADMIN_BROADCAST', announcement);

    // Notify every user
    db.users.forEach((u) => {
      createNotification({
        userId: u.id,
        actorId: 'admin_broadcast',
        actorName: adminName || db.adminName,
        actorAvatar: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80',
        type: 'broadcast',
        title: 'ئاگاداری بەڕێوەبەرایەتی',
        content: text,
        read: false,
        timestamp: timeStr,
      });
    });

    res.json({ success: true, announcement });
  });

  // Admin Clear Chats
  app.post('/api/admin/clear', (_req: Request, res: Response) => {
    db.messages = [];
    saveDatabase(db);
    broadcastEvent('CLEAR_CHATS', {});
    res.json({ success: true });
  });

  // Admin Ban / Unban User
  app.post('/api/admin/ban', (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
      res.status(400).json({ error: 'Username required' });
      return;
    }

    if (db.bannedUsers.includes(username)) {
      db.bannedUsers = db.bannedUsers.filter((u) => u !== username);
    } else {
      db.bannedUsers.push(username);
    }
    saveDatabase(db);

    broadcastEvent('USER_BANNED_STATE', { username, isBanned: db.bannedUsers.includes(username) });
    res.json({ success: true, bannedUsers: db.bannedUsers });
  });

  // Admin Delete User Account completely
  app.delete('/api/admin/users/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.username === 'sabah' || user.username === 'sabah_sndi' || user.isSuperAdmin) {
      res.status(400).json({ error: 'Cannot delete Super Admin Sabah' });
      return;
    }

    db.users = db.users.filter((u) => u.id !== userId);
    // Also remove their stories
    db.stories = db.stories.filter((s) => s.userId !== userId);
    // Also clean their messages
    db.messages = db.messages.filter((m) => m.senderId !== userId);
    saveDatabase(db);

    broadcastEvent('USER_DELETED', { userId, username: user.username });
    res.json({ success: true, message: 'User deleted successfully' });
  });

  // Super Admin grant/revoke assistant admin permissions
  app.post('/api/admin/users/permissions', (req: Request, res: Response) => {
    const { requesterId, targetUserId, isAdmin, permissions } = req.body;
    const requester = db.users.find(
      (u) =>
        u.id === requesterId ||
        u.username.toLowerCase() === 'sabah' ||
        u.username.toLowerCase() === 'sabah_sndi'
    );

    if (!requester || (!requester.isSuperAdmin && requester.username.toLowerCase() !== 'sabah')) {
      res.status(403).json({ error: 'تنێ بەڕێوەبەرێ گشتی (Sabah) دشێت ئەدمینیێ ببەخشیت' });
      return;
    }

    const targetUser = db.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: 'بکارهێنەر نەهاتە دیتن' });
      return;
    }

    if (targetUser.username.toLowerCase() === 'sabah') {
      res.status(400).json({ error: 'دەسەڵاتێن بەڕێوەبەرێ گشتی ناهێنە گۆڕین' });
      return;
    }

    targetUser.isAdmin = Boolean(isAdmin);
    if (targetUser.isAdmin) {
      targetUser.adminPermissions = {
        canViewChats: Boolean(permissions?.canViewChats),
        canDeleteMessages: Boolean(permissions?.canDeleteMessages),
        canDeleteStories: Boolean(permissions?.canDeleteStories),
        canBanUsers: Boolean(permissions?.canBanUsers),
        canBroadcast: Boolean(permissions?.canBroadcast),
        canVerifyUsers: Boolean(permissions?.canVerifyUsers),
      };
    } else {
      delete targetUser.adminPermissions;
    }

    saveDatabase(db);

    const safeUser = { ...targetUser };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({ success: true, user: safeUser });
  });

  // Admin Edit User Details
  app.post('/api/admin/users/edit', (req: Request, res: Response) => {
    const { userId, name, bio, isVerified, isAdmin, password } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (isAdmin !== undefined) user.isAdmin = Boolean(isAdmin);
    if (password) user.password = password.trim();

    saveDatabase(db);

    const safeUser = { ...user };
    delete safeUser.password;
    broadcastEvent('USER_UPDATED', safeUser);

    res.json({ success: true, user: safeUser });
  });

  // Admin Get All Conversations (full transparency for the General Manager)
  app.get('/api/admin/conversations', (_req: Request, res: Response) => {
    // Group messages by chatId
    const groups: { [chatId: string]: DBMessage[] } = {};
    for (const msg of db.messages) {
      if (!groups[msg.chatId]) groups[msg.chatId] = [];
      groups[msg.chatId].push(msg);
    }

    const conversations = Object.keys(groups).map((chatId) => {
      const msgs = groups[chatId];
      // Gather participant ids
      const participantIds = Array.from(new Set(msgs.map((m) => m.senderId)));
      const participants = participantIds.map((id) => {
        const u = db.users.find((usr) => usr.id === id);
        return u ? { id: u.id, name: u.name, username: u.username, avatar: u.avatar } : { id, name: id, username: id };
      });

      return {
        chatId,
        participants,
        messageCount: msgs.length,
        lastMessage: msgs[msgs.length - 1],
        messages: msgs,
      };
    });

    res.json({ conversations });
  });

  // Admin Delete Specific Message
  app.delete('/api/admin/messages/:messageId', (req: Request, res: Response) => {
    const { messageId } = req.params;
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const chatId = msg.chatId;
    db.messages = db.messages.filter((m) => m.id !== messageId);
    saveDatabase(db);

    broadcastEvent('MESSAGE_DELETED', { messageId, chatId });
    res.json({ success: true, messageId, chatId });
  });

  // Admin Delete Entire Conversation
  app.delete('/api/admin/conversations/:chatId', (req: Request, res: Response) => {
    const { chatId } = req.params;
    db.messages = db.messages.filter((m) => m.chatId !== chatId);
    saveDatabase(db);

    broadcastEvent('CONVERSATION_DELETED', { chatId });
    res.json({ success: true, chatId });
  });

  // Admin Delete Any Story
  app.delete('/api/admin/stories/:storyId', (req: Request, res: Response) => {
    const { storyId } = req.params;
    db.stories = db.stories.filter((s) => s.id !== storyId);
    saveDatabase(db);

    broadcastEvent('STORY_DELETED', { storyId });
    res.json({ success: true, storyId });
  });

  // Admin Name Update
  app.post('/api/admin/name', (req: Request, res: Response) => {
    const { name } = req.body;
    if (name) {
      db.adminName = name.trim();
      const adminUser = db.users.find((u) => u.username === 'sabah_sndi');
      if (adminUser) {
        adminUser.name = db.adminName;
      }
      saveDatabase(db);
      broadcastEvent('ADMIN_NAME_UPDATED', { name: db.adminName });
    }
    res.json({ success: true, adminName: db.adminName });
  });

  // Admin Stats
  app.get('/api/admin/stats', (_req: Request, res: Response) => {
    res.json({
      totalUsers: db.users.length,
      totalStories: db.stories.length,
      totalMessages: db.messages.length,
      totalBans: db.bannedUsers.length,
      adminName: db.adminName,
      bannedUsers: db.bannedUsers,
    });
  });

  // Mount Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kurd Chat Real Full-Stack Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Kurd Chat server:', err);
});
