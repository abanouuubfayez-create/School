import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update load function
old_load = """    else if(id==="notice"){"""
new_load = """    else if(id==="devres"){
        loadDevResAdmin(c);
        return;
    }
    else if(id==="notice"){"""

content = content.replace(old_load, new_load)

# 2. Add loadDevResAdmin and its helpers
devres_js = """
// ─── مسار التطوير المهني - لوحة الإدارة ────────────────────────────────────
function loadDevResAdmin(container) {
    var h = '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📚 إضافة مصدر جديد لمكتبة التطوير</div>';
    h += '<div class="set-hint" style="margin-bottom:16px;">قم برفع كتاب (PDF) أو إضافة رابط فيديو من يوتيوب، ليتمكن الذكاء الاصطناعي من ترشيحه للموظفين بناءً على تخصصاتهم.</div>';
    
    h += '<div class="fg" style="margin-bottom:12px;">';
    h += '<label>عنوان المصدر (كتاب / فيديو)</label>';
    h += '<input type="text" id="devResTitle" placeholder="مثال: أساسيات التسويق الرقمي">';
    h += '</div>';

    h += '<div class="fr fr2" style="margin-bottom:12px;">';
    h += '<div class="fg" style="margin:0;"><label>نوع المصدر</label>';
    h += '<select id="devResType" onchange="toggleDevResInput(this.value)">';
    h += '<option value="book">كتاب / ملف (PDF)</option>';
    h += '<option value="video">فيديو / رابط خارجي</option>';
    h += '</select></div>';
    
    h += '<div class="fg" style="margin:0;"><label>التخصص أو المجال (اختياري)</label>';
    h += '<input type="text" id="devResTags" placeholder="مثال: تسويق، مبيعات، برمجة (مفصول بفاصلة)">';
    h += '</div></div>';

    h += '<div class="fg" id="devResFileInputContainer" style="margin-bottom:16px;">';
    h += '<label>ملف المصدر (أقصى حجم 100 ميجابايت)</label>';
    h += '<input type="file" id="devResFile" accept=".pdf,.doc,.docx,.ppt,.pptx">';
    h += '</div>';
    
    h += '<div class="fg" id="devResLinkInputContainer" style="margin-bottom:16px; display:none;">';
    h += '<label>رابط المصدر (URL)</label>';
    h += '<input type="url" id="devResLink" placeholder="https://youtube.com/...">';
    h += '</div>';

    h += '<button class="bt bt-p" onclick="addDevRes()" id="btnSaveDevRes">➕ حفظ المصدر في المكتبة</button>';
    h += '<div id="devResUploadStatus" style="margin-top:10px; font-weight:bold; color:var(--nv); font-size:12px;"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📖 المصادر المضافة حالياً</div>';
    h += '<div id="devResAdminList">⏳ جارٍ التحميل...</div>';
    h += '</div>';

    container.innerHTML = h;
    fetchDevResAdminList();
}

window.toggleDevResInput = function(type) {
    if(type === 'video') {
        document.getElementById('devResFileInputContainer').style.display = 'none';
        document.getElementById('devResLinkInputContainer').style.display = 'block';
    } else {
        document.getElementById('devResFileInputContainer').style.display = 'block';
        document.getElementById('devResLinkInputContainer').style.display = 'none';
    }
};

window.addDevRes = function() {
    var title = document.getElementById('devResTitle').value.trim();
    var type = document.getElementById('devResType').value;
    var tags = document.getElementById('devResTags').value.trim();
    var fileInput = document.getElementById('devResFile');
    var linkInput = document.getElementById('devResLink').value.trim();
    var btn = document.getElementById('btnSaveDevRes');
    var status = document.getElementById('devResUploadStatus');

    if(!title) { alert('يرجى إدخال عنوان المصدر'); return; }

    var data = {
        title: title,
        type: type,
        tags: tags,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if(type === 'book') {
        var file = fileInput.files[0];
        if(!file) { alert('يرجى اختيار ملف'); return; }
        if(file.size > 100*1024*1024) { alert('حجم الملف كبير جداً (يجب أن يكون أقل من 100 ميجا)'); return; }
        
        btn.disabled = true;
        status.innerText = '⏳ جارٍ رفع الملف...';
        
        var storageRef = firebase.storage().ref();
        var fileRef = storageRef.child('dev_resources/' + Date.now() + '_' + file.name);
        
        fileRef.put(file).then(function(snapshot) {
            return snapshot.ref.getDownloadURL();
        }).then(function(url) {
            data.url = url;
            data.fileName = file.name;
            return db.collection('dev_resources').add(data);
        }).then(function() {
            status.innerText = '✅ تم الحفظ بنجاح!';
            btn.disabled = false;
            document.getElementById('devResTitle').value = '';
            fileInput.value = '';
            fetchDevResAdminList();
            setTimeout(function(){ status.innerText = ''; }, 3000);
        }).catch(function(err) {
            status.innerText = '❌ خطأ: ' + err.message;
            btn.disabled = false;
        });

    } else {
        if(!linkInput) { alert('يرجى إدخال الرابط'); return; }
        data.url = linkInput;
        
        btn.disabled = true;
        status.innerText = '⏳ جارٍ الحفظ...';
        
        db.collection('dev_resources').add(data).then(function() {
            status.innerText = '✅ تم الحفظ بنجاح!';
            btn.disabled = false;
            document.getElementById('devResTitle').value = '';
            document.getElementById('devResLink').value = '';
            fetchDevResAdminList();
            setTimeout(function(){ status.innerText = ''; }, 3000);
        }).catch(function(err) {
            status.innerText = '❌ خطأ: ' + err.message;
            btn.disabled = false;
        });
    }
};

window.fetchDevResAdminList = function() {
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {
        var list = document.getElementById('devResAdminList');
        if(!list) return;
        
        if(snap.empty) {
            list.innerHTML = '<div class="empty-hint">لا توجد مصادر مضافة بعد.</div>';
            return;
        }
        
        var h = '<table class="dt" style="width:100%"><thead><tr><th>العنوان</th><th>النوع</th><th>المجال/التخصص</th><th>الرابط</th><th>إجراء</th></tr></thead><tbody>';
        snap.forEach(function(doc) {
            var d = doc.data();
            var icon = d.type === 'video' ? '▶️ فيديو' : '📕 كتاب';
            h += '<tr>';
            h += '<td>' + escH(d.title) + '</td>';
            h += '<td>' + icon + '</td>';
            h += '<td>' + escH(d.tags || 'عام') + '</td>';
            h += '<td><a href="'+d.url+'" target="_blank" style="color:var(--nv);font-weight:bold;text-decoration:none;">فتح الرابط 🔗</a></td>';
            h += '<td><button class="bt bt-d" style="padding:2px 8px;font-size:10px;" onclick="deleteDevRes(\\''+doc.id+'\\', \\''+(d.type==='book' ? d.url : '')+'\\')">🗑 حذف</button></td>';
            h += '</tr>';
        });
        h += '</tbody></table>';
        list.innerHTML = h;
    });
};

window.deleteDevRes = function(id, fileUrl) {
    if(!confirm('هل أنت متأكد من حذف هذا المصدر؟')) return;
    
    if(fileUrl) {
        var fileRef = firebase.storage().refFromURL(fileUrl);
        fileRef.delete().catch(function(e){ console.warn("Failed to delete file:", e); });
    }
    
    db.collection('dev_resources').doc(id).delete().then(function() {
        alert('تم الحذف بنجاح');
        fetchDevResAdminList();
    }).catch(function(err) {
        alert('خطأ: ' + err.message);
    });
};
"""

content += "\n" + devres_js

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating app.js with admin devres")
