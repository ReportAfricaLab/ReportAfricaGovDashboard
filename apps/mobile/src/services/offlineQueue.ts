import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../constants';

const QUEUE_KEY = 'ra_offline_reports';

interface QueuedReport {
  id: string;
  data: any;
  token: string;
  createdAt: string;
}

export const offlineQueue = {
  async add(data: any, token: string) {
    const queue = await this.getAll();
    queue.push({ id: `offline_${Date.now()}`, data, token, createdAt: new Date().toISOString() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getAll(): Promise<QueuedReport[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },

  async syncAll(): Promise<{ synced: number; failed: number }> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, failed: 0 };

    const queue = await this.getAll();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    const remaining: QueuedReport[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(`${API_URL}/reports`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${item.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        if (res.ok) { synced++; }
        else { remaining.push(item); }
      } catch {
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return { synced, failed: remaining.length };
  },

  startAutoSync() {
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const result = await this.syncAll();
        if (result.synced > 0) {
          console.log(`[OfflineQueue] Synced ${result.synced} reports`);
        }
      }
    });
  },
};
