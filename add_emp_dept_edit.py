import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

# 1. Add the button
target_btn = """           '<button class="bt bt-o" onclick="event.stopPropagation();toggleEmpJobEdit('+idx+')">🏷 تعديل المسمى الوظيفي</button>'+"""
replace_btn = target_btn + """\n           '<button class="bt bt-o" onclick="event.stopPropagation();toggleEmpDeptPhoneEdit('+idx+')">☎️ الإدارة والهاتف</button>'+"""

if target_btn in content:
    content = content.replace(target_btn, replace_btn)
elif target_btn.replace('\n', '\r\n') in content:
    content = content.replace(target_btn.replace('\n', '\r\n'), replace_btn.replace('\n', '\r\n'))

# 2. Add the div inline form
target_div = """           '<div class="emp-inline-edit" id="empJobEdit'+idx+'" style="display:none">'+
           '<input type="text" id="empJobInput'+idx+'" value="'+escH(emp.jobTitle||'')+'" placeholder="مثلاً: مصمم جرافيك">'+
           '<button class="bt bt-p" onclick="saveEmpJob(\\''+emp.uid+'\\','+idx+')">💾 حفظ</button>'+
           '<span id="empJobMsg'+idx+'" style="font-size:10.5px"></span>'+
           '</div>'+"""

replace_div = target_div + """\n           '<div class="emp-inline-edit" id="empDeptPhoneEdit'+idx+'" style="display:none; gap:6px;">'+
           '<input type="text" id="empDeptInput'+idx+'" value="'+escH(emp.dept||'')+'" placeholder="القسم / الإدارة" style="flex:1;">'+
           '<input type="text" id="empPhoneInput'+idx+'" value="'+escH(emp.phone||'')+'" placeholder="رقم الهاتف" style="flex:1;">'+
           '<button class="bt bt-p" onclick="saveEmpDeptPhone(\\''+emp.uid+'\\','+idx+')">💾 حفظ</button>'+
           '<span id="empDeptPhoneMsg'+idx+'" style="font-size:10.5px"></span>'+
           '</div>'+"""

if target_div in content:
    content = content.replace(target_div, replace_div)
elif target_div.replace('\n', '\r\n') in content:
    content = content.replace(target_div.replace('\n', '\r\n'), replace_div.replace('\n', '\r\n'))

# 3. Add the JS functions
target_js = """// ─── تعديل نظام العمل من "متابعة الموظفين" ─────────────────────────"""

replace_js = """// ─── تعديل القسم ورقم الهاتف من "متابعة الموظفين" ─────────────────────────
function toggleEmpDeptPhoneEdit(idx){
    var e=document.getElementById('empDeptPhoneEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'flex':'none';
}
function saveEmpDeptPhone(uid,idx){
    var dept=(document.getElementById('empDeptInput'+idx).value||'').trim();
    var phone=(document.getElementById('empPhoneInput'+idx).value||'').trim();
    var msg=document.getElementById('empDeptPhoneMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).update({dept: dept, phone: phone}).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

""" + target_js

if target_js in content:
    content = content.replace(target_js, replace_js)
elif target_js.replace('\n', '\r\n') in content:
    content = content.replace(target_js.replace('\n', '\r\n'), replace_js.replace('\n', '\r\n'))

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(content)

print("Added Inline Edit")
