import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_URL } from '../constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushService = {
  async register(token: string): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: 'reportafrica-4b7bf',
    });

    // Send token to backend
    await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcmToken: pushToken.data }),
    }).catch(() => {});

    return pushToken.data;
  },

  addListeners(onNotification?: (notification: Notifications.Notification) => void) {
    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      onNotification?.(notification);
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Handle navigation based on notification data
      if (data?.reportId) {
        // Navigate to report - handled by app navigation
      }
    });

    return () => { sub1.remove(); sub2.remove(); };
  },
};
