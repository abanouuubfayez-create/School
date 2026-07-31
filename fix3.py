import codecs

def modify_index():
    with codecs.open('index.html', 'r', 'utf-8') as f:
        content = f.read()

    # 1. Add Sidebar Link
    sb_target = """<div class="S-i" onclick="go('announcements',this)" style="border-right:2px solid var(--gd)"><span class="ic">📢</span> إدارة الإعلانات <span class="S-b">جديد</span></div>"""
    sb_replacement = sb_target + """\n            <div class="S-i" onclick="go('archive',this)" style="border-right:2px solid var(--gd)"><span class="ic">🗂</span> أرشيف المستندات <span class="S-b">جديد</span></div>"""
    if sb_target in content:
        content = content.replace(sb_target, sb_replacement)
    else:
        sb_target = sb_target.replace('\n', '\r\n')
        sb_replacement = sb_replacement.replace('\n', '\r\n')
        content = content.replace(sb_target, sb_replacement)

    # 2. Add Autocomplete Dropdown
    ac_target = """<button class="bt bt-o" onclick="openPrintPreview()">🖨 معاينة وطباعة</button>"""
    ac_replacement = """<select id="tgAutoCompleteEmp" onchange="tgAutoCompleteForm(this.value)" style="margin-left:8px; padding:4px; font-size:11px; border:1px solid var(--bd); border-radius:4px; background:var(--bg); color:var(--tx)">
       <option value="">تعبئة بيانات موظف...</option>
    </select>\n    """ + ac_target
    if ac_target in content:
        content = content.replace(ac_target, ac_replacement)
    else:
        ac_target = ac_target.replace('\n', '\r\n')
        ac_replacement = ac_replacement.replace('\n', '\r\n')
        content = content.replace(ac_target, ac_replacement)

    # 3. Add Archive Page
    pg_target = """<div class="pg" id="pg-announcements">"""
    pg_replacement = """<div class="pg" id="pg-archive">
    <div class="set-sec">
        <div class="set-sec-title">🗂 أرشيف المستندات المطبوعة</div>
        <div class="set-hint" style="margin-bottom:12px">سجل لجميع المستندات التي تم طباعتها أو إرسالها من النظام.</div>
        <div class="fr fr2" style="margin-bottom:12px">
            <div class="fg"><label>اسم الموظف</label><input type="text" id="arcEmpFilter" placeholder="ابحث باسم الموظف..." onkeyup="tgRenderArchive()"></div>
            <div class="fg"><label>الشهر (سنة-شهر)</label><input type="month" id="arcMonthFilter" onchange="tgRenderArchive()"></div>
        </div>
        <div id="arcList"></div>
    </div>
</div>\n""" + pg_target

    if pg_target in content:
        content = content.replace(pg_target, pg_replacement)
    else:
        pg_target = pg_target.replace('\n', '\r\n')
        pg_replacement = pg_replacement.replace('\n', '\r\n')
        content = content.replace(pg_target, pg_replacement)

    with codecs.open('index.html', 'w', 'utf-8') as f:
        f.write(content)

def modify_app():
    with codecs.open('app.js', 'r', 'utf-8') as f:
        content = f.read()

    js_code = """
// ─── ميزة أرشيف المستندات ─────────────────────────────────────────────
var tgArchiveCache = [];
function loadArchive() {
    var c = document.getElementById('pg-archive');
    if(!c) return;
    document.getElementById('pT').innerText = 'أرشيف المستندات';
    c.classList.add('a');
    if(!c.dataset.mounted) {
        c.dataset.mounted = '1';
        db.collection('docArchive').orderBy('createdAt', 'desc').limit(200).onSnapshot(function(snap){
            tgArchiveCache = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
            tgRenderArchive();
        });
    }
}

function tgRenderArchive() {
    var box = document.getElementById('arcList');
    if(!box) return;
    var ef = (document.getElementById('arcEmpFilter').value || '').toLowerCase();
    var mf = document.getElementById('arcMonthFilter').value; // YYYY-MM
    var html = '';
    var count = 0;
    for(var i=0; i<tgArchiveCache.length; i++){
        var d = tgArchiveCache[i];
        if(ef && d.employeeName && d.employeeName.toLowerCase().indexOf(ef)===-1) continue;
        if(mf) {
            var dt = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : new Date();
            var mStr = dt.getFullYear() + '-' + ('0'+(dt.getMonth()+1)).slice(-2);
            if(mStr !== mf) continue;
        }
        count++;
        var ts = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString('ar-EG') : '';
        html += '<div class="pj-row" style="display:flex; justify-content:space-between; align-items:center;">';
        html += '<div><div class="pj-t">'+escH(d.docTitle)+'</div><div class="pj-meta">👤 '+escH(d.employeeName)+' | 🕒 '+ts+'</div></div>';
        html += '<button class="bt bt-o" style="padding:4px 8px; font-size:11px" onclick="tgViewArchiveDoc(\\''+d.id+'\\')">👁 عرض</button>';
        html += '</div>';
    }
    if(count === 0) html = '<div class="empty-hint">لا توجد مستندات مطابقة في الأرشيف.</div>';
    box.innerHTML = html;
}

function tgViewArchiveDoc(id) {
    var d = tgArchiveCache.find(function(x){ return x.id === id; });
    if(!d) return;
    var win = window.open('', '_blank');
    if(win) {
        win.document.write(d.htmlContent || 'محتوى غير متوفر');
        win.document.close();
    } else {
        alert('يرجى السماح بالنوافذ المنبثقة (Popups) لعرض المستند.');
    }
}

// ─── ميزة التعبئة التلقائية ──────────────────────────────────────────
var tgAutoEmpList = [];
function tgLoadAutoCompleteList() {
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap){
        tgAutoEmpList = snap.docs.map(function(d){ return Object.assign({uid:d.id}, d.data()); });
        tgAutoEmpList.sort(function(a,b){ return (a.name||a.email||'').localeCompare(b.name||b.email||''); });
        var sel = document.getElementById('tgAutoCompleteEmp');
        if(sel) {
            var opts = '<option value="">تعبئة بيانات موظف...</option>';
            tgAutoEmpList.forEach(function(e){ opts += '<option value="'+e.uid+'">'+escH(e.name||e.email)+'</option>'; });
            sel.innerHTML = opts;
        }
    });
}
setTimeout(tgLoadAutoCompleteList, 3000); // load after 3s

function tgAutoCompleteForm(uid) {
    if(!uid) return;
    var emp = tgAutoEmpList.find(function(x){ return x.uid === uid; });
    if(!emp) return;
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    
    // map fields to keys in employee data
    var mappings = [
        { labels: ['الاسم', 'الموظف'], key: 'name' },
        { labels: ['الرقم القومي'], key: 'nid' },
        { labels: ['الجنسية'], key: 'nationality' },
        { labels: ['الحالة الاجتماعية'], key: 'marital' },
        { labels: ['رقم الهاتف', 'التواصل'], key: 'phone' },
        { labels: ['البريد'], key: 'email' },
        { labels: ['العنوان'], key: 'address' },
        { labels: ['المسمى الوظيفي'], key: 'jobTitle' },
        { labels: ['القسم', 'الإدارة'], key: 'dept' },
        { labels: ['الرقم الوظيفي'], key: 'empId' },
        { labels: ['المدير'], key: 'manager' }
    ];
    
    // First, try by data-fid (used in formsend forms)
    var inputs = activePg.querySelectorAll('input, textarea');
    inputs.forEach(function(el){
        var fid = el.getAttribute('data-fid');
        if(fid && emp[fid] !== undefined) {
            el.value = emp[fid];
        } else {
            // Try by previous label text
            var prev = el.previousElementSibling;
            if(prev && prev.tagName === 'SPAN' || prev && prev.tagName === 'LABEL') {
                var txt = prev.textContent;
                for(var i=0; i<mappings.length; i++) {
                    var match = mappings[i].labels.some(function(l){ return txt.indexOf(l) > -1; });
                    if(match && emp[mappings[i].key]) {
                        el.value = emp[mappings[i].key];
                        break;
                    }
                }
            }
        }
    });
    
    // Also try FL-line inputs
    var flItems = activePg.querySelectorAll('.FL-meta-item');
    flItems.forEach(function(item){
        var lbl = item.querySelector('.FL-meta-lbl');
        var val = item.querySelector('.FL-meta-val');
        if(lbl && val) {
            var txt = lbl.textContent;
            for(var i=0; i<mappings.length; i++) {
                var match = mappings[i].labels.some(function(l){ return txt.indexOf(l) > -1; });
                if(match && emp[mappings[i].key]) {
                    val.value = emp[mappings[i].key];
                    break;
                }
            }
        }
    });
    
    // Reset selection so it can be triggered again
    document.getElementById('tgAutoCompleteEmp').value = '';
    if(typeof tgToast === 'function') tgToast('✅ تم تعبئة البيانات تلقائياً', 'ok');
}
"""

    if "function loadArchive" not in content:
        content += "\n" + js_code
        with codecs.open('app.js', 'w', 'utf-8') as f:
            f.write(content)

modify_index()
modify_app()
print("Modifications applied successfully.")
