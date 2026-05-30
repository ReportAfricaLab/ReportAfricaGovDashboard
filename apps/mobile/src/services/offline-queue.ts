import { reportsAPI } from './api';

const QUEUE_KEY = '@reportafrica_offline_queue';

const getStorage = () => require('@react-native-async-storage/async-storage').default;
const getNetInfo = () => require('@react-native-community/netinfo').default;

export interface QueuedReport {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
  isAnonymous: boolean;
  mediaUris: string[];
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

class OfflineQueueService {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;

  // Start listening for connectivity changes
  init() {
    try {
      const NetInfo = getNetInfo();
      this.unsubscribe = NetInfo.addEventListener((state: any) => {
        if (state.isConnected && state.isInternetReachable) {
          this.syncAll();
        }
      });
    } catch {}
  }

  destroy() {
    this.unsubscribe?.();
  }

  async addToQueue(report: Omit<QueuedReport, 'id' | 'createdAt' | 'status' | 'retryCount'>) {
    const queue = await this.getQueue();
    const entry: QueuedReport = {
      ...report,
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
    queue.push(entry);
    try { await getStorage().setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
    return entry;
  }

  async getQueue(): Promise<QueuedReport[]> {
    try {
      const raw = await getStorage().getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.filter((r) => r.status === 'pending' || r.status === 'failed').length;
  }

  async removeFromQueue(id: string) {
    const queue = await this.getQueue();
    const filtered = queue.filter((r) => r.id !== id);
    try { await getStorage().setItem(QUEUE_KEY, JSON.stringify(filtered)); } catch {}
  }

  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await this.getQueue();
      const pending = queue.filter((r) => r.status === 'pending' || r.status === 'failed');

      for (const report of pending) {
        if (report.retryCount >= 3) continue;

        try {
          report.status = 'syncing';
          await this.saveQueue(queue);

          await reportsAPI.create({
            title: report.title,
            description: report.description,
            category: report.category,
            severity: report.severity,
            latitude: report.latitude,
            longitude: report.longitude,
            isAnonymous: report.isAnonymous,
            mediaUrls: [], // Media not available offline
          });

          await this.removeFromQueue(report.id);
        } catch {
          report.status = 'failed';
          report.retryCount += 1;
          await this.saveQueue(queue);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      const NetInfo = getNetInfo();
      const state = await NetInfo.fetch();
      return !!(state.isConnected && state.isInternetReachable);
    } catch { return true; } // Assume online if check fails
  }

  private async saveQueue(queue: QueuedReport[]) {
    try { await getStorage().setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
  }
}

export const offlineQueue = new OfflineQueueService();
