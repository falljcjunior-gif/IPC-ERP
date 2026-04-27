importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBMQwaE0JnyJ-0zHQI2Ydc2kYD5MiVzoUw",
  authDomain: "ipc-erp.firebaseapp.com",
  projectId: "ipc-erp",
  storageBucket: "ipc-erp.firebasestorage.app",
  messagingSenderId: "487186181701",
  appId: "1:487186181701:web:c309b560b3432323383d2c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
