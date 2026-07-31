import sys
import re

# --- app.js update ---
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

old_toast = '''function tgToast(msg, type){
    var container = document.getElementById('tg-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tg-toast-container';
        document.body.appendChild(container);
    }
    var t=document.createElement('div');
    t.className='tg-toast'+(type==='ok'?' toast-ok':type==='err'?' toast-err':'');
    t.textContent=msg;
    container.appendChild(t);
    setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 3100);
}'''

new_toast = '''function tgToast(msg, type, isPersistent, titleOverride){
    var container = document.getElementById('tg-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tg-toast-container';
        document.body.appendChild(container);
    }
    
    var title = titleOverride || 'إشعار';
    var body = msg;
    var icon = '🔔';
    if(type === 'ok') icon = '✅';
    else if(type === 'err') icon = '❌';

    var msgParts = msg.split(' — ');
    if(msgParts.length > 1) {
        title = msgParts[0].replace('🔔 ', '').replace('✅ ', '').replace('❌ ', '');
        body = msgParts.slice(1).join(' — ');
    } else {
        body = msg.replace('🔔 ', '').replace('✅ ', '').replace('❌ ', '');
        if(!titleOverride) {
            title = type === 'ok' ? 'نجاح' : (type === 'err' ? 'خطأ' : 'تنبيه');
        }
    }

    var t=document.createElement('div');
    t.className='tg-toast tg-toast-'+(type||'info');
    
    var h = '<div class="tg-toast-icon">' + icon + '</div>';
    h += '<div class="tg-toast-content">';
    h += '<div class="tg-toast-title">' + (typeof escH === 'function' ? escH(title) : title) + '</div>';
    if(body) h += '<div class="tg-toast-body">' + (typeof escH === 'function' ? escH(body) : body) + '</div>';
    h += '</div>';
    h += '<div class="tg-toast-close" onclick="this.parentElement.remove()">✕</div>';
    if(!isPersistent) {
        h += '<div class="tg-toast-progress"></div>';
    }
    
    t.innerHTML = h;
    container.appendChild(t);
    
    if(!isPersistent) {
        setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 4000);
    }
    return t;
}'''

app = app.replace(old_toast.replace('\n', '\r\n'), new_toast.replace('\n', '\r\n'))
app = app.replace(old_toast, new_toast)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

# --- auth.js update ---
with open('auth.js', 'r', encoding='utf-8') as f:
    auth = f.read()

old_show = '''function tgShowNotification(title, body, opts) {
    var options = Object.assign({
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [150, 50, 150],
        tag: 'techgo-' + Date.now(),
        requireInteraction: false
    }, opts || {});

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use SW for richer notifications
        navigator.serviceWorker.ready.then(function(reg) {
            reg.showNotification(title, options);
        }).catch(function() {
            // Fallback to basic Notification
            if ('Notification' in window && Notification.permission === 'granted') {
                try { new Notification(title, options); } catch(e) {}
            }
        });
    } else if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(title, options); } catch(e) {}
    }

    // Always show in-app toast as well
    if (typeof tgToast === 'function') {
        tgToast('\\uD83D\\uDD14 ' + title + (body ? ' — ' + body : ''), 'ok');
    }
}'''

new_show = '''function tgShowNotification(title, body, opts) {
    var options = Object.assign({
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [150, 50, 150],
        tag: 'techgo-' + Date.now(),
        requireInteraction: false
    }, opts || {});

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(function(reg) {
            reg.showNotification(title, options);
        }).catch(function() {
            if ('Notification' in window && Notification.permission === 'granted') {
                try { new Notification(title, options); } catch(e) {}
            }
        });
    } else if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(title, options); } catch(e) {}
    }

    if (typeof tgToast === 'function') {
        tgToast(body || title, 'info', false, title);
    }
}'''
auth = auth.replace(old_show.replace('\n', '\r\n'), new_show.replace('\n', '\r\n'))
auth = auth.replace(old_show, new_show)

old_listen = '''function tgListenMyNotifications(uid) {
    if (!uid) return;
    // يمنع تراكم أكثر من مستمع (listener) واحد على نفس الحساب، وهو ما كان يسبب
    // إعادة عرض عشرات الإشعارات القديمة كل مرة تُعاد فيها المصادقة (auth state) خلال نفس الجلسة
    if (_tgMyNotifUnsub) { _tgMyNotifUnsub(); _tgMyNotifUnsub = null; }
    // ملاحظة: 'seen' يُستخدم فقط لمنع تكرار عرض التوست/الإشعار المنبثق لنفس العنصر،
    // وهو مستقل عن 'read' التي تتحكم بحالة القراءة داخل لوحة الإشعارات (Facebook-style)
    _tgMyNotifUnsub = db.collection('notifications').where('toUid', '==', uid).where('seen', '==', false)
        .onSnapshot(function(snap) {
            snap.docChanges().forEach(function(change) {
                if (change.type === 'added') {
                    var id = change.doc.id;
                    if (_tgMyNotifShownIds[id]) return; // اتعرض قبل كده في نفس الجلسة، تجاهله
                    _tgMyNotifShownIds[id] = true;

                    var d = change.doc.data();
                    // tag ثابت لكل إشعار حتى لو تكرر عرضه (مثلاً بسبب فشل تحديث seen) يستبدل نفسه
                    // في نظام تشغيل المستخدم بدل ما يتكدّس كإشعار جديد منفصل
                    tgShowNotification(d.title || 'إشعار', d.body || '', { tag: 'techgo-notif-' + id });
                    
                    // إذا كان الإشعار بخصوص انتهاء مشروع، شغل الاحتفال عند الموظف
                    if (d.tag === 'project-completed' && typeof tgCelebrate === 'function') {
                        setTimeout(tgCelebrate, 500); // تأخير بسيط ليظهر الإشعار أولاً
                    }

                    // تمييزها كـ "تم عرضها" فوراً حتى لا يتكرر التوست، مع إبقاء حالة القراءة كما هي
                    db.collection('notifications').doc(id).update({ seen: true }).catch(function(err) {
                        console.warn('تعذّر تحديث حالة seen للإشعار (تأكد من نشر firestore.rules المحدّثة):', err && err.message);
                    });
                }
            });
        }, function() {});
}'''

new_listen = '''function tgListenMyNotifications(uid) {
    if (!uid) return;
    if (_tgMyNotifUnsub) { _tgMyNotifUnsub(); _tgMyNotifUnsub = null; }
    
    var _isInitialLoad = true;
    _tgMyNotifUnsub = db.collection('notifications').where('toUid', '==', uid).where('seen', '==', false)
        .onSnapshot(function(snap) {
            var changes = snap.docChanges();
            
            if (_isInitialLoad) {
                _isInitialLoad = false;
                var count = 0;
                changes.forEach(function(change) {
                    if (change.type === 'added') {
                        count++;
                        var id = change.doc.id;
                        _tgMyNotifShownIds[id] = true;
                        db.collection('notifications').doc(id).update({ seen: true }).catch(function(){});
                    }
                });
                if (count > 0 && typeof tgToast === 'function') {
                    tgToast('تم نقلها لمركز الإشعارات', 'info', false, 'لديك ' + count + ' إشعار سابق غير مقروء');
                }
                return;
            }

            changes.forEach(function(change) {
                if (change.type === 'added') {
                    var id = change.doc.id;
                    if (_tgMyNotifShownIds[id]) return;
                    _tgMyNotifShownIds[id] = true;

                    var d = change.doc.data();
                    tgShowNotification(d.title || 'إشعار', d.body || '', { tag: 'techgo-notif-' + id });
                    
                    if (d.tag === 'project-completed' && typeof tgCelebrate === 'function') {
                        setTimeout(tgCelebrate, 500);
                    }
                    db.collection('notifications').doc(id).update({ seen: true }).catch(function() {});
                }
            });
        }, function() {});
}'''

auth = auth.replace(old_listen.replace('\n', '\r\n'), new_listen.replace('\n', '\r\n'))
auth = auth.replace(old_listen, new_listen)

with open('auth.js', 'w', encoding='utf-8') as f:
    f.write(auth)

# --- CSS Update ---
css_inject = '''
/* ── Enhanced Toast Notification ── */
#tg-toast-container {
    position: fixed; bottom: 20px; right: 20px; z-index: 99999;
    display: flex; flex-direction: column; gap: 10px;
    align-items: flex-end; pointer-events: none;
}
.tg-toast {
    position: relative; overflow: hidden;
    background: var(--card-bg) !important; color: var(--tx) !important; padding: 12px 16px 16px 12px !important; border-radius: 12px !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important; display: flex !important; align-items: flex-start !important; gap: 12px !important;
    animation: slideInRight .3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards, fadeOut .4s ease 3.6s forwards;
    max-width: 360px !important; min-width: 280px !important; border-right: 4px solid var(--gd) !important;
    pointer-events: auto !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255,255,255,0.1) !important; border-right-width: 4px !important;
}
.tg-toast.tg-toast-ok { border-right-color: var(--ok) !important; }
.tg-toast.tg-toast-err { border-right-color: var(--no) !important; }
.tg-toast.tg-toast-info { border-right-color: var(--nv) !important; }
[data-theme='dark'] .tg-toast.tg-toast-info { border-right-color: var(--gd) !important; }

.tg-toast-icon { font-size: 20px; line-height: 1; flex-shrink: 0; padding-top: 2px; }
.tg-toast-content { flex: 1; min-width: 0; }
.tg-toast-title { font-size: 13px; font-weight: 700; color: var(--tx); margin-bottom: 3px; }
.tg-toast-body { font-size: 11px; color: var(--tx2); line-height: 1.4; }
.tg-toast-close { 
    font-size: 14px; color: var(--tx3); cursor: pointer; padding: 0 4px; line-height: 1;
    transition: color 0.2s; position: relative; top: -2px;
}
.tg-toast-close:hover { color: var(--no); }
.tg-toast-progress {
    position: absolute; bottom: 0; left: 0; height: 3px; background: var(--ok);
    width: 100%; animation: toastProgress 3.6s linear forwards;
}
.tg-toast.tg-toast-err .tg-toast-progress { background: var(--no); }
.tg-toast.tg-toast-info .tg-toast-progress { background: var(--gd); }

@keyframes toastProgress {
    from { width: 100%; }
    to { width: 0%; }
}

/* ── Enhanced Notification Panel ── */
.notif-panel {
    border-radius: 16px !important; border: 1px solid rgba(255,255,255,0.1) !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important; overflow: hidden;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    background: var(--card-bg) !important;
}
.notif-panel-hd {
    background: rgba(0,0,0,0.03); border-bottom: 1px solid var(--bd2) !important;
    padding: 14px 16px !important; font-weight: 700 !important; font-size: 14px !important;
}
[data-theme='dark'] .notif-panel-hd { background: rgba(255,255,255,0.03); }
.notif-list { max-height: 400px; overflow-y: auto; }
.notif-item { transition: all 0.2s; padding: 12px 16px !important; border-bottom: 1px solid var(--bd2) !important; }
.notif-item:hover { background: rgba(0,0,0,0.02) !important; }
[data-theme='dark'] .notif-item:hover { background: rgba(255,255,255,0.05) !important; }
.notif-item.unread { background: rgba(201, 162, 39, 0.05) !important; }
[data-theme='dark'] .notif-item.unread { background: rgba(201, 162, 39, 0.1) !important; }
.notif-item-title { font-weight: 700 !important; font-size: 12.5px !important; margin-bottom: 4px; }
.notif-item-text { font-size: 11.5px !important; line-height: 1.4 !important; opacity: 0.85; }
.notif-item-time { font-size: 10px !important; opacity: 0.6; margin-top: 6px; }
'''

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

if '.tg-toast-content' not in css:
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write(css_inject)

print('Success')
