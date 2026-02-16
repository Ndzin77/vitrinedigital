// Service Worker for Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = {
    title: '🛒 Novo Pedido!',
    body: 'Você recebeu um novo pedido.',
    url: '/admin/orders'
  };

  try {
    if (event.data) {
      try {
        data = { ...data, ...event.data.json() };
      } catch {
        data.body = event.data.text(); // fallback iOS Safari
      }
    }
  } catch (e) {
    console.warn('[SW] Could not parse push data:', e);
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-order',
    renotify: true,
    vibrate: [200, 100, 200],
    silent: false, // garante som no Android
    data: { url: data.url || '/admin/orders' },
    actions: [
      { action: 'open', title: 'Ver Pedidos' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes('/admin/orders') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
