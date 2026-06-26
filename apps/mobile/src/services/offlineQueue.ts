import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '../constants';

const QUEUE_KEY = 'ra_offline_reports';
const MEDIA_DIR = `${FileSystem.cacheDirectory}ra_offline_media/`;

interface QueuedMedia {
  localUri: string;
  type: string;
  fileName: string;
}

interface QueuedReport {
  id: string;
  data: any;
  media: QueuedMedia[];
  token: string;
  createdAt: string;
}

export const offlineQueue = {
  async init() {
    const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  },

  async add(data: any, mediaFiles: { uri: string; type: string; name: string }[], token: string) {
    await this.init();
    const id = `offline_${Date.now()}`;
    const media: QueuedMedia[] = [];

    for (const file of mediaFiles) {
      const fileName = `${id}_${file.name}`;
      const localUri = `${MEDIA_DIR}${fileName}`;
      await FileSystem.copyAsync({ from: file.uri, to: localUri });
      media.push({ localUri, type: file.type, fileName });
    }

    const queue = await this.getAll();
    queue.push({ id, data, media, token, createdAt: new Date().toISOString() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return id;
  },

  async getAll(): Promise<QueuedReport[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },

  async syncAll(currentToken?: string): Promise<{ synced: number; failed: number }> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, failed: 0 };

    const queue = await this.getAll();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    const remaining: QueuedReport[] = [];

    for (const item of queue) {
      try {
        const token = currentToken || item.token;
        const uploadedMedia: { type: string; url: string }[] = [];

        // Upload media files to S3
        for (const m of item.media) {
          const fileInfo = await FileSystem.getInfoAsync(m.localUri);
          if (!fileInfo.exists) continue;

          const fileType = m.type.startsWith('video') ? 'video' : 'image';
          const presignRes = await fetch(`${API_URL}/upload/presigned-url?fileType=${fileType}&contentType=${encodeURIComponent(m.type)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { uploadUrl, fileUrl } = await presignRes.json();

          await FileSystem.uploadAsync(uploadUrl, m.localUri, {
            httpMethod: 'PUT',
            headers: { 'Content-Type': m.type },
          });
          uploadedMedia.push({ type: m.type, url: fileUrl });
        }

        // Submit report with uploaded media URLs
        const reportData = { ...item.data, media: uploadedMedia.length > 0 ? uploadedMedia : item.data.media };
        const res = await fetch(`${API_URL}/reports`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });

        if (res.ok) {
          synced++;
          // Clean up local media files
          for (const m of item.media) {
            await FileSystem.deleteAsync(m.localUri, { idempotent: true });
          }
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return { synced, failed: remaining.length };
  },

  startAutoSync(getToken?: () => string | null) {
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const token = getToken?.() || undefined;
        const result = await this.syncAll(token);
        if (result.synced > 0) {
          console.log(`[OfflineQueue] Synced ${result.synced} reports (${result.failed} remaining)`);
        }
      }
    });
  },
};
