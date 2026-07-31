import re

with open(r'd:\Tech Go System\app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Update empNameInput (first occurrence around line 913)
content = re.sub(
    r'<input type="text" id="empNameInput\'\+idx\+\'" value="\'\+escH\(emp\.name\|\|\'\'\)\+\'">',
    r'<input type="text" id="empNameInput\'+idx+\'" value="\'+escH(emp.baseName||emp.name||\'\')+\'">',
    content
)

# Update empNameInput (second occurrence around line 4122)
content = re.sub(
    r'<input type="text" id="empNameInput\' \+ idx \+ \'" value="\' \+ escH\(emp\.name \|\| \'\'\) \+ \'">',
    r'<input type="text" id="empNameInput\' + idx + \'" value="\' + escH(emp.baseName||emp.name|| \'\') + \'">',
    content
)

# Update new account creation job title (if it uses name/jobTitle separately)
# Actually, the user creates an account from admin panel using tgCreateEmployeeAccount
# Let's update saveEmpName function
save_emp_name_old = """function saveEmpName(uid,idx){
    var name=(document.getElementById('empNameInput'+idx).value||'').trim();
    var msg=document.getElementById('empNameMsg'+idx);
    if(!name){ msg.style.color='var(--no)'; msg.textContent='اكتب اسماً صحيحاً.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).update({name:name}).then(function(){
        addEmployeeName(name);
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}"""

save_emp_name_new = """function saveEmpName(uid,idx){
    var name=(document.getElementById('empNameInput'+idx).value||'').trim();
    var msg=document.getElementById('empNameMsg'+idx);
    if(!name){ msg.style.color='var(--no)'; msg.textContent='اكتب اسماً صحيحاً.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).get().then(function(doc){
        var jt = doc.data().jobTitle || '';
        var finalName = jt ? name + ' (' + jt + ')' : name;
        return db.collection('users').doc(uid).update({baseName: name, name: finalName});
    }).then(function(){
        addEmployeeName(name);
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}"""

content = content.replace(save_emp_name_old, save_emp_name_new)

# Update saveEmpJob function
save_emp_job_old = """function saveEmpJob(uid,idx){
    var jobTitle=(document.getElementById('empJobInput'+idx).value||'').trim();
    var msg=document.getElementById('empJobMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).update({jobTitle:jobTitle}).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}"""

save_emp_job_new = """function saveEmpJob(uid,idx){
    var jobTitle=(document.getElementById('empJobInput'+idx).value||'').trim();
    var msg=document.getElementById('empJobMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).get().then(function(doc){
        var baseName = doc.data().baseName || doc.data().name || '';
        if (baseName.includes(' (')) baseName = baseName.split(' (')[0].trim();
        var finalName = jobTitle ? baseName + ' (' + jobTitle + ')' : baseName;
        return db.collection('users').doc(uid).update({jobTitle: jobTitle, baseName: baseName, name: finalName});
    }).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}"""

content = content.replace(save_emp_job_old, save_emp_job_new)


# Update personal profile name edit (around line 2757)
profile_edit_old = """function tgSaveProfileName(){
    var name = (document.getElementById('profileName').value||'').trim();
    if(!name) { tgToast('الاسم مطلوب','err'); return; }
    var btn=document.getElementById('profileNameBtn');
    btn.disabled=true; btn.textContent='⏳';
    db.collection('users').doc(TG_USER.uid).update({name:name}).then(function(){
        TG_USER.name = name;
        tgNotifyAdmins('🧑 تحديث بيانات موظف', 'قام الموظف ' + name + ' بتحديث اسمه في النظام', 'name-change');
        tgToast('✅ تم الحفظ','ok');
        document.getElementById('profileNameBox').style.display='none';
        btn.disabled=false; btn.textContent='حفظ';
        var e = document.getElementById('dashSummary');
        if(e) e.innerHTML = '<div style="font-size:18px;font-weight:800;margin-bottom:4px">مرحباً، '+escH(name)+' 👋</div><div style="font-size:13px;color:var(--tx2)">إليك نظرة سريعة على مهامك ومشاريعك.</div>';
    }).catch(function(err){
        btn.disabled=false; btn.textContent='حفظ';
        tgToast('❌ تعذر الحفظ: '+err.message,'err');
    });
}"""

profile_edit_new = """function tgSaveProfileName(){
    var name = (document.getElementById('profileName').value||'').trim();
    if(!name) { tgToast('الاسم مطلوب','err'); return; }
    var btn=document.getElementById('profileNameBtn');
    btn.disabled=true; btn.textContent='⏳';
    var jt = TG_USER.jobTitle || '';
    var finalName = jt ? name + ' (' + jt + ')' : name;
    db.collection('users').doc(TG_USER.uid).update({baseName: name, name: finalName}).then(function(){
        TG_USER.baseName = name;
        TG_USER.name = finalName;
        tgNotifyAdmins('🧑 تحديث بيانات موظف', 'قام الموظف ' + name + ' بتحديث اسمه في النظام', 'name-change');
        tgToast('✅ تم الحفظ','ok');
        document.getElementById('profileNameBox').style.display='none';
        btn.disabled=false; btn.textContent='حفظ';
        var e = document.getElementById('dashSummary');
        if(e) e.innerHTML = '<div style="font-size:18px;font-weight:800;margin-bottom:4px">مرحباً، '+escH(finalName)+' 👋</div><div style="font-size:13px;color:var(--tx2)">إليك نظرة سريعة على مهامك ومشاريعك.</div>';
    }).catch(function(err){
        btn.disabled=false; btn.textContent='حفظ';
        tgToast('❌ تعذر الحفظ: '+err.message,'err');
    });
}"""

content = content.replace(profile_edit_old, profile_edit_new)

# Update profileName input value (around line 5064)
content = re.sub(
    r'<input type="text" id="profileName" value="\'\+escH\(TG_USER\.name\|\|TG_USER\.email\)\+\'">',
    r'<input type="text" id="profileName" value="\'+escH(TG_USER.baseName||TG_USER.name||TG_USER.email)+\'">',
    content
)


with open(r'd:\Tech Go System\app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Logic updated successfully in app.js")
