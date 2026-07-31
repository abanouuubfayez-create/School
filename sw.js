// ─── Service Worker for Tech Go PWA ─────────────────────────────────────────
const CACHE_NAME = 'techgo-v999-purge-all';
const STATIC_ASSETS = [
    './login.html',
    './styles.css',
    './manifest.json'
];

// Install: cache static assets and skip waiting
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activate: purge ALL old caches immediately
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.map(function(k) { 
                    if (k !== CACHE_NAME) return caches.delete(k); 
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch: Always Network First for HTML and JS files
self.addEventListener('fetch', function(event) {
    var url = event.request.url;
    
    // Skip Firebase/Google requests - always go to network
    if (url.indexOf('firebase') > -1 ||
        url.indexOf('googleapis') > -1 ||
        url.indexOf('gstatic') > -1) {
        return;
    }
    
    // Always Network First for HTML and JS code files to guarantee latest version
    if (event.request.mode === 'navigate' || url.endsWith('app.js') || url.endsWith('index.html') || url.endsWith('employee.html')) {
        event.respondWith(
            fetch(event.request).then(function(response) {
                return response;
            }).catch(function() {
                return caches.match(event.request);
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request).then(function(response) {
            if (response && response.status === 200 && event.request.method === 'GET') {
                var resClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, resClone);
                });
            }
            return response;
        }).catch(function() {
            return caches.match(event.request);
        })
    );
});

// Push notifications handler
self.addEventListener('push', function(event) {
    var data = {};
    try { data = event.data ? event.data.json() : {}; } catch(e) {}
    var title = data.title || 'تيك جو';
    
    var isCall = data.isCall || (data.tag && (data.tag.indexOf('livemeeting') > -1 || data.tag.indexOf('call') > -1)) || (title && (title.indexOf('مكالمة') > -1 || title.indexOf('اجتماع') > -1));
    
    var defaultActions = isCall ? [
        { action: 'accept_call', title: '📞 قبول وانضمام' },
        { action: 'decline_call', title: '❌ رفض / كتم' }
    ] : [];

    var options = {
        body: data.body || 'لديك إشعار جديد',
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: isCall ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200],
        tag: data.tag || (isCall ? 'techgo-call-notification' : 'techgo-notification'),
        requireInteraction: isCall ? true : false,
        renotify: isCall ? true : false,
        actions: defaultActions,
        data: Object.assign({
            url: data.url || './index.html',
            meetingId: data.meetingId || '',
            roomName: data.roomName || '',
            topic: data.topic || '',
            roomUrl: data.roomUrl || ''
        }, data.data || {})
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var notifData = event.notification.data || {};
    var action = event.action;

    if (action === 'decline_call') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
                cls.forEach(function(client) {
                    client.postMessage({ action: 'DECLINE_CALL', meetingId: notifData.meetingId });
                });
            })
        );
        return;
    }

    var targetUrl = notifData.roomUrl || notifData.url || './index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
            for (var i = 0; i < cls.length; i++) {
                if (cls[i].url.indexOf('index.html') > -1 || cls[i].url.indexOf('employee.html') > -1) {
                    cls[i].postMessage({ 
                        action: 'ACCEPT_CALL', 
                        meetingId: notifData.meetingId, 
                        roomName: notifData.roomName, 
                        topic: notifData.topic,
                        roomUrl: notifData.roomUrl 
                    });
                    if ('focus' in cls[i]) cls[i].focus();
                    if (notifData.roomUrl && clients.openWindow) {
                        return clients.openWindow(notifData.roomUrl);
                    }
                    return;
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

