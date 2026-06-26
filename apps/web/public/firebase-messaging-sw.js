importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAOW3f4T7PPsvZ3N-itDriSpSxxDDFQ4s4',
  projectId: 'reportafrica-4b7bf',
  messagingSenderId: '446848946760',
  appId: '1:446848946760:android:ee772b55a084e2ee0d7e7d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ReportAfrica';
  const options = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  let url = '/feed';
  if (data?.reportId) url = `/report?id=${data.reportId}`;
  event.waitUntil(clients.openWindow(url));
});
