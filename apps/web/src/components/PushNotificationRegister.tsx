'use client';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const VAPID_KEY = 'BOTcmaIYj2u7rzz5xKUYEvPCJl1xrVKjXWLcW2IvSIL2ZVlaz8_R6mQs57_C2SN9wwZIE-53J8XiuAXZSnHa8aw';

export function PushNotificationRegister() {
  useEffect(() => {
    const token = localStorage.getItem('ra_token');
    if (!token) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'denied') return;

    // Don't re-register if already done this session
    if (sessionStorage.getItem('fcm_registered')) return;

    initPush(token);
  }, []);

  return null;
}

async function initPush(authToken: string) {
  try {
    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }

    // Register the Firebase messaging service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Load Firebase via script if not already loaded
    if (!(window as any).firebase) {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
    }

    const fb = (window as any).firebase;
    if (!fb) return;

    // Initialize Firebase (only once)
    if (!fb.apps?.length) {
      fb.initializeApp({
        apiKey: 'AIzaSyAOW3f4T7PPsvZ3N-itDriSpSxxDDFQ4s4',
        projectId: 'reportafrica-4b7bf',
        messagingSenderId: '446848946760',
        appId: '1:446848946760:android:ee772b55a084e2ee0d7e7d',
      });
    }

    const messaging = fb.messaging();
    const fcmToken = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (!fcmToken) return;

    // Save to API
    await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ fcmToken }),
    });

    sessionStorage.setItem('fcm_registered', '1');
    console.log('[Push] FCM token registered');
  } catch (err) {
    console.warn('[Push] Registration failed:', err);
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}
