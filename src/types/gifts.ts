export type GiftCategory = 'gifts' | 'songs' | 'interactive' | 'exclusive';

export interface VoiceGiftItem {
  id: string;
  name: string;
  kurName: string;
  category: GiftCategory;
  coins: number;
  icon: string;
  badge?: string;
  animationType?: 'standard' | 'flight' | 'royal' | 'screen_explosion';
}

export interface VoiceSongItem {
  id: string;
  title: string;
  artist: string;
  coins: number;
  color: string;
}

export interface LiveSentGift {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  recipientName: string;
  gift: VoiceGiftItem;
  comboCount: number;
  timestamp: number;
}

export interface RechargePackage {
  coins: number;
  iqdPrice: string;
  popular?: boolean;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { coins: 5, iqdPrice: '110 د.ع.' },
  { coins: 70, iqdPrice: '1,530 د.ع.', popular: true },
  { coins: 350, iqdPrice: '7,700 د.ع.' },
  { coins: 700, iqdPrice: '15,300 د.ع.' },
  { coins: 1400, iqdPrice: '30,500 د.ع.' },
  { coins: 3500, iqdPrice: '76,100 د.ع.' },
  { coins: 7000, iqdPrice: '152,100 د.ع.' },
  { coins: 17500, iqdPrice: '380,200 د.ع.' },
];
