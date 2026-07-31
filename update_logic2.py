import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

target = """// ─── ميزة التعبئة التلقائية ──────────────────────────────────────────
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
}"""

replacement = """// ─── ميزة التعبئة التلقائية ──────────────────────────────────────────
var tgAutoEmpList = [];
function tgLoadAutoCompleteList() {
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap){
        tgAutoEmpList = snap.docs.map(function(d){ return Object.assign({uid:d.id}, d.data()); });
        tgAutoEmpList.sort(function(a,b){ return (a.name||a.email||'').localeCompare(b.name||b.email||''); });
        
        // 1. Update top bar select if exists
        var sel = document.getElementById('tgAutoCompleteEmp');
        if(sel) {
            var opts = '<option value="">تعبئة بيانات موظف...</option>';
            tgAutoEmpList.forEach(function(e){ opts += '<option value="'+e.uid+'">'+escH(e.name||e.email)+'</option>'; });
            sel.innerHTML = opts;
        }
        
        // 2. Create datalist for inline form autocomplete
        var dl = document.getElementById('tgEmpNamesDatalist');
        if(!dl) {
            dl = document.createElement('datalist');
            dl.id = 'tgEmpNamesDatalist';
            document.body.appendChild(dl);
        }
        var dlOpts = '';
        tgAutoEmpList.forEach(function(e){ dlOpts += '<option value="'+escH(e.name||e.email)+'">'; });
        dl.innerHTML = dlOpts;
        
        // 3. Attach list to all existing name inputs
        tgAttachDatalistToInputs();
    });
}

function tgAttachDatalistToInputs() {
    document.querySelectorAll('input').forEach(function(el){
        var fid = el.getAttribute('data-fid');
        var isName = (fid === 'name');
        if(!isName && el.previousElementSibling) {
            var txt = el.previousElementSibling.textContent || '';
            if(txt.indexOf('الاسم') > -1 || txt.indexOf('الموظف') > -1) isName = true;
        }
        if(!isName && el.placeholder && (el.placeholder.indexOf('اسم') > -1 || el.placeholder.indexOf('الموظف') > -1)) {
            isName = true;
        }
        if(isName && el.type === 'text') {
            el.setAttribute('list', 'tgEmpNamesDatalist');
        }
    });
}

// Attach datalist when pages change
var oldGo = go;
window.go = function(id, nav, force) {
    oldGo(id, nav, force);
    setTimeout(tgAttachDatalistToInputs, 300);
};

// Listen for selection from datalist
document.addEventListener('input', function(e) {
    if(e.target && e.target.tagName === 'INPUT' && e.target.getAttribute('list') === 'tgEmpNamesDatalist') {
        var val = e.target.value;
        var emp = tgAutoEmpList.find(function(x){ return (x.name === val || x.email === val); });
        if(emp) {
            tgAutoCompleteForm(emp.uid, e.target);
        }
    }
});
"""

target_crlf = target.replace('\n', '\r\n')
replacement_crlf = replacement.replace('\n', '\r\n')

if target in content:
    content = content.replace(target, replacement)
elif target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf)

# Also modify tgAutoCompleteForm to take targetEl
target2 = """function tgAutoCompleteForm(uid) {
    if(!uid) return;
    var emp = tgAutoEmpList.find(function(x){ return x.uid === uid; });
    if(!emp) return;
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;"""

replacement2 = """function tgAutoCompleteForm(uid, targetEl) {
    if(!uid) return;
    var emp = tgAutoEmpList.find(function(x){ return x.uid === uid; });
    if(!emp) return;
    var activePg = targetEl ? targetEl.closest('.pg') : document.querySelector('.pg.a');
    if(!activePg) activePg = document.querySelector('.pg.a');
    if(!activePg) return;"""

target2_crlf = target2.replace('\n', '\r\n')
replacement2_crlf = replacement2.replace('\n', '\r\n')

if target2 in content:
    content = content.replace(target2, replacement2)
elif target2_crlf in content:
    content = content.replace(target2_crlf, replacement2_crlf)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(content)
