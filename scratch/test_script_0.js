
// ─── AUTOMATIC FORCE CACHE PURGER ─────────────────────────────────────────────
(function() {
    var CURRENT_VER = 'v1001_purge_realtime';
    var savedVer = localStorage.getItem('tg_app_cache_version');
    if (savedVer !== CURRENT_VER) {
        localStorage.setItem('tg_app_cache_version', CURRENT_VER);
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) caches.delete(name);
            });
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (let reg of registrations) reg.unregister();
            });
        }
    }
})();
