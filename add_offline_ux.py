import sys

# 1. CSS update
css_offline = '''
/* ── Offline Banner ── */
#tg-offline-banner {
    position: fixed; top: 0; left: 0; width: 100%; z-index: 999999;
    background: rgba(220, 53, 69, 0.95); color: #fff; text-align: center;
    padding: 10px 15px; font-weight: bold; font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    transform: translateY(-100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex; justify-content: center; align-items: center; gap: 8px;
}
#tg-offline-banner.show {
    transform: translateY(0);
}
#tg-offline-banner.online {
    background: rgba(40, 167, 69, 0.95);
}
'''
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()
if '#tg-offline-banner' not in css:
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write(css_offline)

# 2. JS Update in theme.js
js_offline = '''
// ─── Offline/Online UX ────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tgInitOfflineUX);
} else {
    tgInitOfflineUX();
}

function tgInitOfflineUX() {
    var banner = document.getElementById('tg-offline-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tg-offline-banner';
        banner.innerHTML = '<span style="font-size:18px;">⚠️</span> أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.';
        document.body.appendChild(banner);
    }

    function updateOnlineStatus() {
        if (!navigator.onLine) {
            banner.innerHTML = '<span style="font-size:18px;">⚠️</span> أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.';
            banner.classList.remove('online');
            banner.classList.add('show');
        } else {
            banner.innerHTML = '<span style="font-size:18px;">✅</span> عاد الاتصال بالإنترنت!';
            banner.classList.add('online');
            setTimeout(function() {
                if (navigator.onLine) banner.classList.remove('show');
            }, 3000);
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if (!navigator.onLine) {
        updateOnlineStatus();
    }
}
'''

with open('theme.js', 'r', encoding='utf-8') as f:
    js = f.read()
if 'tgInitOfflineUX' not in js:
    with open('theme.js', 'a', encoding='utf-8') as f:
        f.write(js_offline)

print('Success')
