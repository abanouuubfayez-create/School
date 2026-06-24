
        // =========================================================
        // FIREBASE CONFIG — التخزين السحابي
        // =========================================================
        // 🔧 ضع هنا بيانات Firebase بتاعتك (من Firebase Console)
        // الشرح: console.firebase.google.com → Project Settings → General → Your apps → Config
        let FIREBASE_URL = 'https://school-project-ea190-default-rtdb.firebaseio.com';
        let FIREBASE_SECRET = 'n8qECaOyMrHOcp1vP9lwn2VffYKqo19UPyyB7nRd';

        // =========================================================
        // CLOUDINARY CONFIG — رفع الصور المجاني
        // =========================================================
        const CLOUDINARY_CLOUD_NAME = 'ddusz8jtz';
        const CLOUDINARY_UPLOAD_PRESET = 'lhoyzojb'; // Unsigned preset

        // Legacy aliases — kept for backward compatibility
        const JSONBIN_KEY = { toString() { return FIREBASE_URL; } };
        const JSONBIN_BIN = 'firebase';

        // =========================================================
        // =========================================================
        // PERSISTENT STORAGE — IndexedDB (primary) + localStorage (fallback) + JSONBin (cloud)
        // =========================================================
        const MEM = {};

        // ── IndexedDB wrapper ──
        const IDB_NAME = 'SchoolAppDB', IDB_STORE = 'kv', IDB_VER = 1;
        let _idb = null;
        function idbOpen() {
            if (_idb) return Promise.resolve(_idb);
            return new Promise((res, rej) => {
                const req = indexedDB.open(IDB_NAME, IDB_VER);
                req.onupgradeneeded = e => { e.target.result.createObjectStore(IDB_STORE); };
                req.onsuccess = e => { _idb = e.target.result; res(_idb); };
                req.onerror = () => rej(req.error);
            });
        }
        async function idbSet(k, v) {
            try {
                const db = await idbOpen();
                return new Promise((res, rej) => {
                    const tx = db.transaction(IDB_STORE, 'readwrite');
                    tx.objectStore(IDB_STORE).put(v, k);
                    tx.oncomplete = () => res(true);
                    tx.onerror = () => rej(tx.error);
                });
            } catch (e) { return false; }
        }
        async function idbGet(k) {
            try {
                const db = await idbOpen();
                return new Promise((res, rej) => {
                    const tx = db.transaction(IDB_STORE, 'readonly');
                    const req = tx.objectStore(IDB_STORE).get(k);
                    req.onsuccess = () => res(req.result ?? null);
                    req.onerror = () => rej(req.error);
                });
            } catch (e) { return null; }
        }
        async function idbDel(k) {
            try {
                const db = await idbOpen();
                return new Promise((res) => {
                    const tx = db.transaction(IDB_STORE, 'readwrite');
                    tx.objectStore(IDB_STORE).delete(k);
                    tx.oncomplete = () => res(true);
                });
            } catch (e) { return false; }
        }

        function lsSet(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); return true; } catch (e) { return false; } }
        function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
        function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }

        // ── Firebase Realtime Database REST helpers ──
        const FB_KEY_MAP = {
            'school_books_v1': 'books',
            'school_exam_files_v1': 'examfiles',
            'school_detailed_schedule_v2': 'detailedschedule',
        };
        function _fbUrl(key) {
            const node = FB_KEY_MAP[key] || 'schooldb';
            return FIREBASE_URL.replace(/\/+$/, '') + '/' + node + '.json' + (FIREBASE_SECRET ? '?auth=' + FIREBASE_SECRET : '');
        }

        async function cloudSave(data, key) {
            if (!FIREBASE_URL) return false;
            try {
                const body = typeof data === 'string' ? data : JSON.stringify(data);
                const r = await fetch(_fbUrl(key), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
                return r.ok;
            } catch (e) { return false; }
        }

        async function cloudLoad(key) {
            if (!FIREBASE_URL) return null;
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 5000); // 5 ثواني max
                const r = await fetch(_fbUrl(key), { signal: controller.signal });
                clearTimeout(timer);
                if (!r.ok) return null;
                const d = await r.json();
                if (d === null || d === undefined) return null;
                return typeof d === 'string' ? JSON.parse(d) : d;
            } catch (e) { return null; }
        }

        async function storeSave(key, val) {
            // ✅ أضف timestamp لكل الـ CLOUD_KEYS عشان نقدر نقارن أي نسخة أحدث
            const CLOUD_KEYS = [DB_KEY, 'school_books_v1', 'school_exam_files_v1', 'school_detailed_schedule_v2'];
            if (CLOUD_KEYS.includes(key)) {
                try {
                    const obj = typeof val === 'string' ? JSON.parse(val) : val;
                    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                        obj._savedAt = Date.now();
                        val = obj;
                    }
                } catch (e) { }
            }
            const str = typeof val === 'string' ? val : JSON.stringify(val);
            MEM[key] = str;
            // Save to IndexedDB (primary) — awaited for reliability
            let idbOk = false;
            try { idbOk = await idbSet(key, str); } catch (e) { idbOk = false; }
            // Save to localStorage (fallback)
            const lsOk = lsSet(key, str);
            // If both failed, warn the user (only for main DB key)
            if (!idbOk && !lsOk && key === DB_KEY) {
                showToast('⚠️ تحذير: فشل الحفظ في المتصفح — يُرجى تصدير نسخة احتياطية الآن!');
            }
            if (CLOUD_KEYS.includes(key) && FIREBASE_URL) {
                try { cloudSave(val, key); } catch (e) { }  // non-blocking cloud backup
            }
            return idbOk || lsOk;
        }

        async function storeLoad(key) {
            const CLOUD_KEYS = [DB_KEY, 'school_books_v1', 'school_exam_files_v1', 'school_detailed_schedule_v2'];
            if (CLOUD_KEYS.includes(key) && FIREBASE_URL) {
                try {
                    // ── اقرأ البيانات المحلية أولاً لمقارنة الـ timestamp ──
                    let localStr = null;
                    try { localStr = await idbGet(key); } catch (e) { }
                    if (!localStr) localStr = lsGet(key);

                    const cloud = await cloudLoad(key);
                    if (cloud) {
                        const str = typeof cloud === 'string' ? cloud : JSON.stringify(cloud);
                        // ── قارن الـ timestamp: خد الأحدث فقط ──
                        if (localStr) {
                            try {
                                const localObj = JSON.parse(localStr);
                                const cloudObj = typeof cloud === 'string' ? JSON.parse(cloud) : cloud;
                                const localTS = localObj && localObj._savedAt ? localObj._savedAt : 0;
                                const cloudTS = cloudObj && cloudObj._savedAt ? cloudObj._savedAt : 0;
                                // لو البيانات المحلية أحدث — احتفظ بها ولا تكتب فوقها
                                if (localTS > cloudTS) {
                                    MEM[key] = localStr; return localStr;
                                }
                            } catch (e) { }
                        }
                        MEM[key] = str; idbSet(key, str).catch(() => { }); lsSet(key, str); return str;
                    }
                } catch (e) { }
            }
            // Try IndexedDB first (most reliable)
            try {
                const idbVal = await idbGet(key);
                if (idbVal !== null) { MEM[key] = idbVal; return idbVal; }
            } catch (e) { }
            // Fallback to localStorage
            const ls = lsGet(key);
            if (ls !== null) {
                MEM[key] = ls;
                idbSet(key, ls).catch(() => { }); // migrate to IndexedDB
                return ls;
            }
            if (MEM[key] !== undefined) return MEM[key];
            return null;
        }

