import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """window.fetchDevResAdminList = function() {
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
};"""

new_func = """window.fetchDevResAdminList = function() {
    var list = document.getElementById('devResAdminList');
    if(!list) return;
    list.innerHTML = '⏳ جارٍ التحميل...';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {
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
    }).catch(function(err) {
        console.error("fetchDevResAdminList error:", err);
        list.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '<br><small>هل قمت بتحديث قواعد Firestore؟</small></div>';
    });
};"""

content = content.replace(old_func, new_func)

# Also update fetchEmpDevRes just in case
old_emp = """window.fetchEmpDevRes = function() {
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {
        var grid = document.getElementById('empDevResGrid');
        if(!grid) return;
        
        window._allDevRes = [];
        
        if(snap.empty) {
            grid.innerHTML = '<div class="empty-hint">لم يتم إضافة أي مصادر للمكتبة بعد.</div>';
            return;
        }
        
        var h = '';
        snap.forEach(function(doc) {
            var d = doc.data();
            window._allDevRes.push(d);
            var isVideo = d.type === 'video';
            h += '<div style="background:var(--w); border:1px solid var(--bd2); border-radius:12px; padding:20px; transition:all 0.3s; box-shadow:0 4px 10px rgba(0,0,0,0.02); display:flex; flex-direction:column;">';
            h += '<div style="font-size:24px; margin-bottom:12px;">' + (isVideo ? '▶️' : '📕') + '</div>';
            h += '<div style="font-weight:800; font-size:16px; color:var(--nv); margin-bottom:8px;">' + escH(d.title) + '</div>';
            h += '<div style="font-size:12px; color:var(--tx3); margin-bottom:16px; flex:1;">المجال: ' + escH(d.tags || 'عام') + '</div>';
            h += '<a href="' + d.url + '" target="_blank" style="display:block; text-align:center; padding:10px; background:var(--bg2); color:var(--nv); border-radius:8px; text-decoration:none; font-weight:700; transition:all 0.2s;" onmouseover="this.style.background=\\'var(--nv)\\';this.style.color=\\'#fff\\';" onmouseout="this.style.background=\\'var(--bg2)\\';this.style.color=\\'var(--nv)\\';">' + (isVideo ? 'مشاهدة الفيديو' : 'قراءة الكتاب') + '</a>';
            h += '</div>';
        });
        grid.innerHTML = h;
    });
};"""

new_emp = """window.fetchEmpDevRes = function() {
    var grid = document.getElementById('empDevResGrid');
    if(!grid) return;
    grid.innerHTML = '<div class="empty-hint">⏳ جارٍ تحميل المصادر...</div>';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {
        window._allDevRes = [];
        
        if(snap.empty) {
            grid.innerHTML = '<div class="empty-hint">لم يتم إضافة أي مصادر للمكتبة بعد.</div>';
            return;
        }
        
        var h = '';
        snap.forEach(function(doc) {
            var d = doc.data();
            window._allDevRes.push(d);
            var isVideo = d.type === 'video';
            h += '<div style="background:var(--w); border:1px solid var(--bd2); border-radius:12px; padding:20px; transition:all 0.3s; box-shadow:0 4px 10px rgba(0,0,0,0.02); display:flex; flex-direction:column;">';
            h += '<div style="font-size:24px; margin-bottom:12px;">' + (isVideo ? '▶️' : '📕') + '</div>';
            h += '<div style="font-weight:800; font-size:16px; color:var(--nv); margin-bottom:8px;">' + escH(d.title) + '</div>';
            h += '<div style="font-size:12px; color:var(--tx3); margin-bottom:16px; flex:1;">المجال: ' + escH(d.tags || 'عام') + '</div>';
            h += '<a href="' + d.url + '" target="_blank" style="display:block; text-align:center; padding:10px; background:var(--bg2); color:var(--nv); border-radius:8px; text-decoration:none; font-weight:700; transition:all 0.2s;" onmouseover="this.style.background=\\'var(--nv)\\';this.style.color=\\'#fff\\';" onmouseout="this.style.background=\\'var(--bg2)\\';this.style.color=\\'var(--nv)\\';">' + (isVideo ? 'مشاهدة الفيديو' : 'قراءة الكتاب') + '</a>';
            h += '</div>';
        });
        grid.innerHTML = h;
    }).catch(function(err){
        console.error("fetchEmpDevRes error:", err);
        grid.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '</div>';
    });
};"""

content = content.replace(old_emp, new_emp)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing catch block in app.js")
