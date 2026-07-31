// ─── مصادقة وصلاحيات مشتركة ────────────────────────────────────────────
// يُستخدم في index.html (لوحة الأدمن) و employee.html (بوابة الموظف)

var TG_USER = null; // { uid, email, name, role, empId, jobTitle }

// يتحقق من تسجيل الدخول والصلاحية المطلوبة، وينفّذ onOk(userDoc) لو كل شيء تمام.
// requiredRole: 'admin' | 'tech_admin' | 'employee' | null (أي دور)
function tgRequireAuth(requiredRole, onOk) {
    auth.onAuthStateChanged(function (user) {
        if (!user) { location.href = 'login.html'; return; }
        db.collection('users').doc(user.uid).get().then(function (doc) {
            if (!doc.exists) {
                alert('هذا الحساب غير مرتبط بملف مستخدم في النظام. تواصل مع مدير النظام.');
                auth.signOut().then(function () { location.href = 'login.html'; });
                return;
            }
            var data = doc.data();
            if (data.disabled === true) {
                alert('تم تعطيل هذا الحساب من قبل الإدارة. تواصل مع مدير النظام لمزيد من التفاصيل.');
                auth.signOut().then(function () { location.href = 'login.html'; });
                return;
            }
            TG_USER = {
                uid: user.uid, email: user.email,
                name: data.name || user.email,
                role: data.role,
                empId: data.empId || '',
                jobTitle: data.jobTitle || '',
                chatAccess: data.chatAccess !== false,
                workMode: data.workMode || 'office'
            };

            // ── منطق التحويل حسب الدور ──
            if (requiredRole === 'admin') {
                // يقبل admin و tech_admin كلاهما في لوحة الأدمن
                if (data.role !== 'admin' && data.role !== 'tech_admin') {
                    location.href = 'employee.html';
                    return;
                }
            } else if (requiredRole === 'employee') {
                if (data.role !== 'employee') {
                    location.href = 'index.html';
                    return;
                }
            } else if (requiredRole && data.role !== requiredRole) {
                location.href = (data.role === 'admin') ? 'index.html' : 'employee.html';
                return;
            }

            document.documentElement.classList.remove('tg-auth-pending');
            // Listen to appSettings globally
            db.collection('system').doc('appSettings').onSnapshot(function(sDoc) {
                window._appSettingsCache = sDoc.data() || {};
                if (typeof window.onAppSettingsUpdate === 'function') {
                    window.onAppSettingsUpdate(window._appSettingsCache);
                }
            });
            // طلب إذن الإشعارات وتشغيل استماع المكالمات فوراً لكل المستحدثين
            tgRequestNotificationPermission();
            setTimeout(function() {
                if (typeof window.initMeetingsListener === 'function') {
                    window.initMeetingsListener();
                }
            }, 300);
            try {
                if (typeof onOk === 'function') onOk(TG_USER);
            } catch (errOnOk) {
                console.error("Error inside auth callback:", errOnOk);
            }
        }).catch(function (err) {
            console.error(err);
            alert('حدث خطأ أثناء التحقق من صلاحية الحساب: ' + err.message);
        });
    });
}

function tgRequestNotificationPermission(){
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().then(function(perm) {
                if (perm === "granted" && typeof tgToast === 'function') {
                    tgToast('تم تفعيل إشعارات Push للمكالمات والاجتماعات بنجاح! 🔔', 'success', false, 'إشعارات النظام');
                }
            }).catch(function(){});
        }
    }
}

function tgShowNotification(title, body, opts) {
    var isCall = (opts && opts.isCall) || (opts && opts.tag && (opts.tag.indexOf('livemeeting') > -1 || opts.tag.indexOf('call') > -1)) || (title && (title.indexOf('مكالمة') > -1 || title.indexOf('اجتماع') > -1));
    
    var defaultActions = isCall ? [
        { action: 'accept_call', title: '📞 قبول وانضمام' },
        { action: 'decline_call', title: '❌ رفض / كتم' }
    ] : [];

    var options = Object.assign({
        body: body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: isCall ? [500, 200, 500, 200, 500] : [150, 50, 150],
        tag: 'techgo-' + Date.now(),
        requireInteraction: isCall ? true : false,
        renotify: isCall ? true : false,
        actions: defaultActions
    }, opts || {});

    // Try Service Worker registration first
    if ('serviceWorker' in navigator) {
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
        tgToast(body || title, isCall ? 'warning' : 'info', false, title);
    }
}

// إرسال إشعار للمستخدم عبر Firestore
function tgSendPushToUser(toUid, title, body, tag, extraData) {
    if (!db) return;
    var notifPayload = Object.assign({
        toUid: toUid,
        title: title,
        body: body,
        tag: tag || 'techgo',
        read: false,
        seen: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, extraData || {});
    
    db.collection('notifications').add(notifPayload).catch(function() {});
}

// إرسال إشعار لكل المستخدمين في النظام ما عدا شخص واحد
function tgBroadcastPush(title, body, tag, excludeUid, extraData) {
    if (!db) return;
    db.collection('users').get().then(function(snap) {
        snap.forEach(function(d) {
            if (d.id !== excludeUid) tgSendPushToUser(d.id, title, body, tag, extraData);
        });
    }).catch(function() {});
}

// استماع للإشعارات الواردة للمستخدم الحالي (يقرأه من onSnapshot عند فتح البوابة)
var _tgMyNotifUnsub = null;
var _tgMyNotifShownIds = {}; // درع إضافي: يمنع إعادة عرض نفس الإشعار مرتين في نفس الجلسة حتى لو فشل تحديث Firestore
function tgListenMyNotifications(uid) {
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
                        var id = change.doc.id;
                        var d = change.doc.data();
                        _tgMyNotifShownIds[id] = true;
                        db.collection('notifications').doc(id).update({ seen: true }).catch(function(){});
                        if (!d.read) {
                            count++;
                        }
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
                    
                    if (!d.read) {
                        tgShowNotification(d.title || 'إشعار', d.body || '', { tag: 'techgo-notif-' + id });
                    }
                    
                    if (d.tag === 'project-completed' && typeof tgCelebrate === 'function') {
                        setTimeout(tgCelebrate, 500);
                    }
                    db.collection('notifications').doc(id).update({ seen: true }).catch(function() {});
                }
            });
        }, function() {});
}

// ─── مركز الإشعارات (Facebook-style) — للأدمن فقط ─────────────────────────
// يستمع لكل إشعارات المستخدم (مقروءة وغير مقروءة) ويستدعي onUpdate(list, unreadCount) في كل تحديث
var _tgNotifCenterUnsub = null;
function tgListenNotifCenter(uid, onUpdate) {
    if (!uid || typeof onUpdate !== 'function') return;
    if (_tgNotifCenterUnsub) { _tgNotifCenterUnsub(); _tgNotifCenterUnsub = null; }
    // بدون orderBy لتفادي الحاجة لفهرس مركّب — الترتيب يتم في العميل
    _tgNotifCenterUnsub = db.collection('notifications').where('toUid', '==', uid)
        .onSnapshot(function(snap) {
            var list = [];
            var unread = 0;
            snap.forEach(function(doc) {
                var d = doc.data();
                d.id = doc.id;
                if (!d.read) unread++;
                list.push(d);
            });
            list.sort(function(a, b) {
                var ta = (a.createdAt && a.createdAt.toMillis) ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                var tb = (b.createdAt && b.createdAt.toMillis) ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return tb - ta;
            });
            onUpdate(list.slice(0, 40), unread);
        }, function() {});
}

function tgMarkNotifRead(notifId) {
    if (!notifId) return;
    db.collection('notifications').doc(notifId).update({ read: true, seen: true }).catch(function() {});
}

function tgMarkAllNotifsRead(uid) {
    if (!uid) return;
    db.collection('notifications').where('toUid', '==', uid).get()
        .then(function(snap) {
            var count = 0;
            snap.forEach(function(doc) { 
                if (!doc.data().read) {
                    db.collection('notifications').doc(doc.id).update({ read: true, seen: true }).catch(function(){}); 
                    count++;
                }
            });
            console.log('Marked ' + count + ' notifications as read.');
        }).catch(function(e) { console.error('Mark all read error:', e); });
}

function tgDeleteNotif(notifId) {
    if (!notifId) return;
    db.collection('notifications').doc(notifId).delete().catch(function() {});
}

// هل المستخدم الحالي لديه صلاحية الأدمن الكاملة؟
function isFullAdmin() {
    return TG_USER && TG_USER.role === 'admin';
}
// هل المستخدم الحالي أدمن تقني؟
function isAssistantAdmin() {
    return TG_USER && TG_USER.role === 'tech_admin';
}

function tgLogout() {
    if (!confirm('تسجيل الخروج من النظام؟')) return;
    auth.signOut().then(function () { location.href = 'login.html'; });
}

// إنشاء حساب دخول لموظف جديد بدون تسجيل خروج المدير الحالي
function tgCreateEmployeeAccount(name, email, password, empId, jobTitle, role, workMode, dept, phone, onDone, onError) {
    // للتوافق مع الاستدعاء القديم
    if (typeof dept === 'function') {
        onError = phone;
        onDone = dept;
        dept = '';
        phone = '';
    } else if (typeof role === 'function') {
        onError = onDone;
        onDone = role;
        role = 'employee';
        workMode = 'office';
        dept = '';
        phone = '';
    } else if (typeof workMode === 'function') {
        onError = onDone;
        onDone = workMode;
        workMode = 'office';
        dept = '';
        phone = '';
    }
    var secondaryApp;
    try {
        secondaryApp = firebase.apps.find(function (a) { return a.name === 'secondary'; })
            || firebase.initializeApp(firebaseConfig, 'secondary');
    } catch (e) { onError(e); return; }
    var secAuth = firebase.auth(secondaryApp);
    secAuth.createUserWithEmailAndPassword(email, password).then(function (cred) {
        var uid = cred.user.uid;
        var finalName = name;
        if (jobTitle) finalName = name + ' (' + jobTitle + ')';
        return db.collection('users').doc(uid).set({
            baseName: name, name: finalName, email: email,
            role: role || 'employee',
            empId: empId || '', jobTitle: jobTitle || '',
            dept: dept || '', phone: phone || '',
            workMode: workMode || 'office',
            createdAt: new Date()
        }).then(function () { return secAuth.signOut(); }).then(function () { onDone(uid); });
    }).catch(function (err) { onError(err); });
}

// ─── إعداد أول تشغيل ───────────────────────────────────────────────────────
function tgCheckSetupDone(onResult, onError) {
    db.collection('system').doc('meta').get().then(function (doc) {
        onResult(!!(doc.exists && doc.data().setupDone === true));
    }).catch(function (err) { onError ? onError(err) : onResult(false); });
}

function tgCreateFirstAdmin(name, email, password, onDone, onError) {
    auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
        var uid = cred.user.uid;
        var batch = db.batch();
        batch.set(db.collection('users').doc(uid), {
            name: name, email: email, role: 'admin',
            createdAt: new Date()
        });
        batch.set(db.collection('system').doc('meta'), {
            setupDone: true, setupAt: new Date()
        });
        batch.commit().then(function () { onDone(uid); }).catch(function (err) {
            cred.user.delete().catch(function () {});
            onError(err);
        });
    }).catch(function (err) { onError(err); });
}

// ─── مسح سجلات متعددة ────────────────────────────────────────────────────────
function tgDeleteAllRecords(collectionName, label, filterField, filterValue, callback) {
    if(!confirm('هل أنت متأكد من حذف جميع ' + label + ' نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1b2a4a;color:#fff;padding:14px 28px;border-radius:10px;z-index:99999;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    msg.textContent = '⏳ جاري الحذف...';
    document.body.appendChild(msg);

    var query = db.collection(collectionName);
    if(filterField && filterValue) query = query.where(filterField, '==', filterValue);

    query.get().then(function(snap) {
        var batch = db.batch();
        snap.forEach(function(d) { batch.delete(d.ref); });
        return batch.commit();
    }).then(function() {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        if(typeof tgToast === 'function') tgToast('✅ تم حذف جميع ' + label + ' بنجاح', 'ok');
        else if(typeof showToast === 'function') showToast('✅ تم الحذف بنجاح');
        else alert('✅ تم الحذف بنجاح');
        if(callback) callback();
    }).catch(function(err) {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        alert('❌ خطأ أثناء الحذف: ' + err.message);
    });
}

// يمنع وميض عرض المحتوى قبل التأكد من تسجيل الدخول
document.documentElement.classList.add('tg-auth-pending');

    // Periodically update user online status (Using Web Worker to bypass page/tab minimize throttling)
    function updatePresence() {
        if (window.db && firebase.auth().currentUser) {
            var uid = firebase.auth().currentUser.uid;
            db.collection('users').doc(uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(e) {});
        }
    }
    
    // Initial updates
    setTimeout(updatePresence, 2000);
    setTimeout(updatePresence, 10000);
    
    // Background worker for steady updates even when minimized or hidden
    try {
        var workerBlob = new Blob([
            "setInterval(function() { postMessage('tick'); }, 30000);"
        ], { type: 'application/javascript' });
        var worker = new Worker(URL.createObjectURL(workerBlob));
        worker.onmessage = function() {
            updatePresence();
        };
        console.log("Web Worker active-presence tracking successfully initialized.");
    } catch(e) {
        console.warn("Web Worker blocked or unsupported, falling back to standard interval.");
        setInterval(updatePresence, 35000);
    }
