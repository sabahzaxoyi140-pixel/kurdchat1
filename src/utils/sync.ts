// Real-time synchronization across browser tabs/windows using BroadcastChannel & Storage events

type SyncEvent =
  | { type: 'NEW_MESSAGE'; chatId: string; message: unknown }
  | { type: 'NEW_STORY'; story: unknown }
  | { type: 'BROADCAST_ANNOUNCEMENT'; text: string; sender: string }
  | { type: 'CLEAR_CHATS' }
  | { type: 'BAN_USER'; username: string };

type SyncListener = (event: SyncEvent) => void;

class RealtimeChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('kurd_chat_network');
        this.channel.onmessage = (e) => {
          this.notifyListeners(e.data);
        };
      } catch {
        this.channel = null;
      }
    }

    // Fallback: listen to window storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'kurd_chat_last_sync' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {}
        }
      });
    }
  }

  post(event: SyncEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {}
    }
    // Also trigger via localStorage for maximum cross-tab compatibility
    try {
      localStorage.setItem('kurd_chat_last_sync', JSON.stringify({ ...event, _t: Date.now() }));
    } catch {}
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {}
    });
  }
}

export const realtimeSync = new RealtimeChannel();
