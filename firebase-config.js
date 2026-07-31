// ═══════════════════════════════════════════════════════════════════════
// 🔧 إعدادات Firebase — عدّل القيم دي من مشروعك على Firebase Console
// Project Settings ⚙️ → General → Your apps → SDK setup and configuration
// ═══════════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyDyyl6cHWGh838xZ6epbUSwL2qmDgLsIwM",
    authDomain: "tech-go-system.firebaseapp.com",
    projectId: "tech-go-system",
    storageBucket: "tech-go-system.firebasestorage.app",
    messagingSenderId: "514371652334",
    appId: "1:514371652334:web:d4089a4f474d3655ab41ff"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth(); var auth = window.auth;
window.db   = firebase.firestore(); var db   = window.db;

// ═══════════════════════════════════════════════════════════════════════
// 🗄️ Supabase Storage (بديل مجاني لـ Firebase Storage)
// ═══════════════════════════════════════════════════════════════════════
var SUPABASE_URL = 'https://nokyxxajtrlmndsvbzik.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_o2zJ82_vrSGnYeFnL2Iemw_PI6oeqZ7';
var SUPABASE_BUCKET = 'uploads';

/**
 * حذف ملف من Supabase Storage بناءً على URL العام الخاص به
 * @param {string} publicUrl - الرابط العام للملف المراد حذفه
 * @param {function} [onDone] - callback عند النجاح (اختياري)
 * @param {function} [onError] - callback عند الخطأ (اختياري)
 */
function tgDeleteSupabaseFile(publicUrl, onDone, onError) {
    if (!publicUrl) { if (onDone) onDone(); return; }
    try {
        // استخراج المسار من الرابط العام
        // مثال: https://xxx.supabase.co/storage/v1/object/public/uploads/folder/file.jpg
        var marker = '/object/public/' + SUPABASE_BUCKET + '/';
        var idx = publicUrl.indexOf(marker);
        if (idx === -1) {
            // ليس ملف Supabase — تجاهل بصمت
            if (onDone) onDone();
            return;
        }
        var filePath = publicUrl.substring(idx + marker.length);

        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', SUPABASE_URL + '/storage/v1/object/' + SUPABASE_BUCKET + '/' + filePath, true);
        xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
        xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_ANON_KEY);

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                if (onDone) onDone();
            } else {
                var errMsg = 'Delete failed: ' + xhr.status;
                console.warn('Supabase delete error:', errMsg);
                if (onError) onError(errMsg); else if (onDone) onDone();
            }
        };
        xhr.onerror = function () {
            console.warn('Supabase delete network error');
            if (onError) onError('Network error'); else if (onDone) onDone();
        };
        xhr.send();
    } catch (err) {
        console.error('tgDeleteSupabaseFile error:', err);
        if (onError) onError(err.message); else if (onDone) onDone();
    }
}

/**
 * رفع ملف على Supabase Storage مع متابعة نسبة الرفع
 * @param {string} folder - المجلد (مثلاً 'tasks', 'projects', 'requests')
 * @param {string} fileName - اسم الملف الفريد
 * @param {File} file - كائن الملف
 * @param {function} onProgress - callback نسبة الرفع (0-100)
 * @param {function} onError - callback عند الخطأ
 * @param {function} onDone - callback عند النجاح (يستقبل الـ public URL)
 */
function tgUploadFile(folder, fileName, file, onProgress, onError, onDone) {
    try {
        var safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_\/]/g, '_').replace(/_+/g, '_');
        var path = folder + '/' + Date.now() + '_' + safeFileName;
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', SUPABASE_URL + '/storage/v1/object/' + SUPABASE_BUCKET + '/' + path, true);
        xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
        xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_ANON_KEY);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        
        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable && onProgress) {
                var percentComplete = Math.round((e.loaded / e.total) * 100);
                onProgress(percentComplete);
            }
        };
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + SUPABASE_BUCKET + '/' + path;
                if (onDone) onDone(publicUrl);
            } else {
                var errDesc = 'Upload failed with status: ' + xhr.status;
                try { errDesc += ' - ' + JSON.parse(xhr.responseText).message; } catch(e){}
                if (onError) onError(errDesc);
            }
        };
        
        xhr.onerror = function() {
            if (onError) onError('Network error occurred during upload.');
        };
        
        xhr.send(file);
    } catch(err) {
        console.error("Sync Upload Error:", err);
        if (onError) onError(err.message || err);
    }
}
