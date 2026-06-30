'use client';
import { useEffect } from 'react';

const VAPID_KEY = 'BOTcmaIYj2u7rzz5xKUYEvPCJl1xrVKjXWLcW2IvSIL2ZVlaz8_R6mQs57_C2SN9wwZIE-53J8XiuAXZSnHa8aw';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAOW3f4T7PPsvZ3N-itDriSpSxxDDFQ4s4',
  projectId: 'reportafrica-4b7bf',
  messagingSenderId: '446848946760',
  appId: '1:446848946760:android:ee772b55a084e2ee0d7e7d',
};

export function PushNotificationRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('ra_token');
    if (!token) return;

    registerPush(token).catch(() => {});
  }, []);

  return null;
}

async function registerPush(authToken: string) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  // Register Firebase messaging service worker
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;

  // Load Firebase dynamically
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js' as any).catch(() => null) || {};
  
  // Use compat version via service worker getToken approach
  // Simpler approach: use fetch to get token via the messaging API
  const fcmToken = await getFCMToken(registration);
  if (!fcmToken) return;

  // Save to API
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ fcmToken }),
  });
}

async function getFCMToken(registration: ServiceWorkerRegistration): Promise<string | null> {
  try {
    // Dynamic import of Firebase messaging
    const firebase = await import('firebase/app').catch(() => null);
    const messaging = await import('firebase/messaging').catch(() => null);
    
    if (!firebase || !messaging) {
      // Fallback: try global firebase from CDN
      return getFCMTokenViaScript(registration);
    }

    const app = firebase.initializeApp(FIREBASE_CONFIG);
    const msg = messaging.getMessaging(app);
    const token = await messaging.getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    return token;
  } catch {
    return getFCMTokenViaScript(registration);
  }
}

async function getFCMTokenViaScript(registration: ServiceWorkerRegistration): Promise<string | null> {
  return new Promise((resolve) => {
    // Load Firebase SDK via script tags
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js';
      script2.onload = async () => {
        try {
          const app = (window as any).firebase.initializeApp(FIREBASE_CONFIG);
          const msg = (window as any).firebase.messaging();
          const token = await msg.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
          resolve(token);
        } catch { resolve(null); }
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script1);
  });
}
