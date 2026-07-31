import sys
import os

with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# 1. Replace UI in tasksmgmt
old_ui = """        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0 16px;flex-wrap:wrap;gap:12px">';
        h+='<div class="set-sec-title" style="margin:0">🗂 المهام الحالية</div>';
        h+='<button class="bt bt-d" style="padding:5px 14px;font-size:11px" onclick="tgDeleteAllRecords(\'tasks\', \'المهام\', null, null, loadTasksMgmt)">🗑 حذف الكل</button>';
        h+='</div>';
        
        h+='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;border-bottom:2px solid var(--bd);padding-bottom:2px" id="tgTaskStatusTabs">';"""

new_ui = """        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0 16px;flex-wrap:wrap;gap:12px">';
        h+='<div class="set-sec-title" style="margin:0">🗂 المهام الحالية</div>';
        h+='<button class="bt bt-d" style="padding:5px 14px;font-size:11px" onclick="tgDeleteAllRecords(\'tasks\', \'المهام\', null, null, loadTasksMgmt)">🗑 حذف الكل</button>';
        h+='</div>';

        h+='<div style="background:var(--w);border:1px solid var(--bd2);border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">';
        h+='<input type="text" id="tgTasksSearch" style="border:1px solid var(--bd2);border-radius:7px;padding:6px 12px;font-size:12px;font-family:inherit;background:var(--bg);color:var(--tx);flex:1;min-width:200px" placeholder="🔍 ابحث بالعنوان أو الموظف..." oninput="tgApplyActiveTaskFilter()">';
        h+='<select id="tgTasksSortBy" style="border:1px solid var(--bd2);border-radius:7px;padding:6px 10px;font-size:11px;font-family:inherit;background:var(--bg);color:var(--tx)" onchange="tgApplyActiveTaskFilter()">';
        h+='<option value="">ترتيب: الأحدث</option><option value="prio">الأولوية: الأعلى</option><option value="emp">الموظف: أبجدياً</option></select>';
        h+='<div id="tgEmpFilterBtns" style="display:flex;flex-wrap:wrap;gap:6px"></div>';
        h+='</div>';

        h+='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;border-bottom:2px solid var(--bd);padding-bottom:2px" id="tgTaskStatusTabs">';"""

app = app.replace(old_ui.replace('\n', '\r\n'), new_ui.replace('\n', '\r\n'))
app = app.replace(old_ui, new_ui)

# 2. Add Employee buttons building inside renderTasksMgmtList
old_counts = """    // تحديث أرقام التبويبات
    ['all', '1', '2', '3', 'late'].forEach(function(key){
        var el = document.getElementById('tab-count-' + key);
        if(el) el.textContent = counts[key] || 0;
    });"""

new_counts = """    // تحديث أرقام التبويبات
    ['all', '1', '2', '3', 'late'].forEach(function(key){
        var el = document.getElementById('tab-count-' + key);
        if(el) el.textContent = counts[key] || 0;
    });

    var empBtns = document.getElementById('tgEmpFilterBtns');
    if(empBtns) {
        var empSet2 = new Set();
        list.forEach(function(t){ if(t.assignedToName) empSet2.add(t.assignedToName); });
        var savedEmp = window._tgActiveEmpTaskFilter || '';
        var btnsH = '<button class="tg-emp-btn'+(savedEmp===''?' tg-emp-active':'')+'" onclick="tgSetTaskEmpFilter(this,\'\')">الكل</button>';
        Array.from(empSet2).sort(function(a,b){return a.localeCompare(b,'ar');}).forEach(function(e){
            btnsH += '<button class="tg-emp-btn'+(e===savedEmp?' tg-emp-active':'')+'" onclick="tgSetTaskEmpFilter(this,\''+e.replace(/'/g,'\\\\x27')+'\')">'+escH(e)+'</button>';
        });
        empBtns.innerHTML = btnsH;
    }"""
app = app.replace(old_counts.replace('\n', '\r\n'), new_counts.replace('\n', '\r\n'))
app = app.replace(old_counts, new_counts)

# 3. Add tgSetTaskEmpFilter and rewrite tgApplyActiveTaskFilter
old_filter = """// تطبيق الفلتر بناءً على التبويب النشط
function tgApplyActiveTaskFilter(){
    var status = window._tgActiveTaskTab || '';
    var cards = document.querySelectorAll('.tg-task-card');
    var now = Date.now();
    
    cards.forEach(function(card){
        var show = false;
        var cardStatus = card.getAttribute('data-status');
        var isLate = card.getAttribute('data-late') === '1';
        
        if(status === ''){
            show = true; // الكل
        } else if(status === 'late'){
            show = isLate;
        } else {
            show = (cardStatus === status);
        }
        
        card.style.display = show ? '' : 'none';
    });
}"""

new_filter = """window._tgActiveEmpTaskFilter = '';
function tgSetTaskEmpFilter(btn, emp){
    window._tgActiveEmpTaskFilter = emp;
    var p = btn.parentNode;
    if(p) {
        p.querySelectorAll('.tg-emp-btn').forEach(function(b){ b.classList.remove('tg-emp-active'); });
        btn.classList.add('tg-emp-active');
    }
    tgApplyActiveTaskFilter();
}

// تطبيق الفلتر بناءً على التبويب النشط
function tgApplyActiveTaskFilter(){
    var status = window._tgActiveTaskTab || '';
    var empFilter = window._tgActiveEmpTaskFilter || '';
    var searchInput = document.getElementById('tgTasksSearch');
    var search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var sortInput = document.getElementById('tgTasksSortBy');
    var sortBy = sortInput ? sortInput.value : '';

    var box = document.querySelector('.tg-tasks-grid');
    if(!box) return;
    var cardsArray = Array.from(box.querySelectorAll('.tg-task-card'));
    
    cardsArray.forEach(function(card){
        var show = true;
        var cardStatus = card.getAttribute('data-status');
        var isLate = card.getAttribute('data-late') === '1';
        
        if(status === 'late'){
            if(!isLate) show = false;
        } else if(status !== ''){
            if(cardStatus !== status) show = false;
        }

        if(empFilter !== ''){
            if(card.textContent.indexOf(empFilter) === -1) show = false;
        }

        if(search !== ''){
            if(card.textContent.toLowerCase().indexOf(search) === -1) show = false;
        }
        
        card.style.display = show ? '' : 'none';
    });

    if(sortBy !== ''){
        cardsArray.sort(function(a, b){
            if(sortBy === 'prio'){
                var pA = a.querySelector('.task-badge.prio-high') ? 3 : (a.querySelector('.task-badge.prio-med') ? 2 : 1);
                var pB = b.querySelector('.task-badge.prio-high') ? 3 : (b.querySelector('.task-badge.prio-med') ? 2 : 1);
                return pB - pA;
            }
            if(sortBy === 'emp'){
                var nA = a.querySelector('.task-card-info .info-text') ? a.querySelector('.task-card-info .info-text').textContent : '';
                var nB = b.querySelector('.task-card-info .info-text') ? b.querySelector('.task-card-info .info-text').textContent : '';
                return nA.localeCompare(nB, 'ar');
            }
            return 0;
        });
        cardsArray.forEach(function(card){ box.appendChild(card); });
    }
}"""

app = app.replace(old_filter.replace('\n', '\r\n'), new_filter.replace('\n', '\r\n'))
app = app.replace(old_filter, new_filter)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

# CSS Update
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

css_new = """
.tg-emp-btn {
    padding: 4px 12px; border-radius: 14px; font-size: 11px; font-weight: 700;
    cursor: pointer; border: 1px solid var(--bd2);
    background: var(--bg); color: var(--tx2);
    transition: all .15s; font-family: inherit;
}
.tg-emp-btn:hover { border-color: var(--gd); color: var(--nv); }
.tg-emp-active {
    background: var(--gd) !important; color: var(--nv) !important;
    border-color: var(--gd) !important; font-weight: 800;
}
[data-theme='dark'] .tg-emp-btn { background: var(--bg); color: var(--tx2); border-color: var(--bd2); }
[data-theme='dark'] .tg-emp-active { background: var(--gd) !important; color: var(--nv) !important; }
"""
if '.tg-emp-btn' not in css:
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write(css_new)
print('Done!')
