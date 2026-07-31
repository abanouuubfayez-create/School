import codecs

# 1. Update app.js
with codecs.open('app.js', 'r', 'utf-8') as f:
    app_js = f.read()

target1 = """        h+='<div class="fr fr3" style="margin-top:10px">';
        h+='<div class="fg"><label>المسمى الوظيفي (اختياري)</label><input type="text" id="newAccJobTitle" placeholder="مثلاً: مصمم جرافيك"></div>';
        h+='<div class="fg"><label>نظام العمل</label><select id="newAccWorkMode"><option value="office">من المكتب</option><option value="remote">عن بُعد (ريموتلي)</option></select></div>';
        h+='<div class="fg"><label>دور الحساب</label><select id="newAccRole"><option value="employee">موظف (employee)</option><option value="tech_admin">أدمن تقني (بدون صلاحيات إدارية)</option></select></div>';
        h+='</div>';"""

replacement1 = """        h+='<div class="fr fr3" style="margin-top:10px">';
        h+='<div class="fg"><label>المسمى الوظيفي (اختياري)</label><input type="text" id="newAccJobTitle" placeholder="مثلاً: مصمم جرافيك"></div>';
        h+='<div class="fg"><label>القسم / الإدارة (اختياري)</label><input type="text" id="newAccDept" placeholder="مثلاً: قسم تكنولوجيا المعلومات"></div>';
        h+='<div class="fg"><label>رقم الهاتف (اختياري)</label><input type="text" id="newAccPhone" placeholder="مثلاً: 01012345678"></div>';
        h+='</div>';
        h+='<div class="fr fr2" style="margin-top:10px">';
        h+='<div class="fg"><label>نظام العمل</label><select id="newAccWorkMode"><option value="office">من المكتب</option><option value="remote">عن بُعد (ريموتلي)</option></select></div>';
        h+='<div class="fg"><label>دور الحساب</label><select id="newAccRole"><option value="employee">موظف (employee)</option><option value="tech_admin">أدمن تقني (بدون صلاحيات إدارية)</option></select></div>';
        h+='</div>';"""

app_js = app_js.replace(target1, replacement1)
app_js = app_js.replace(target1.replace('\n', '\r\n'), replacement1.replace('\n', '\r\n'))

target2 = """    var jobTitle=(document.getElementById('newAccJobTitle').value||'').trim();
    var roleEl=document.getElementById('newAccRole');"""

replacement2 = """    var jobTitle=(document.getElementById('newAccJobTitle').value||'').trim();
    var dept=(document.getElementById('newAccDept') ? document.getElementById('newAccDept').value||'' : '').trim();
    var phone=(document.getElementById('newAccPhone') ? document.getElementById('newAccPhone').value||'' : '').trim();
    var roleEl=document.getElementById('newAccRole');"""

app_js = app_js.replace(target2, replacement2)
app_js = app_js.replace(target2.replace('\n', '\r\n'), replacement2.replace('\n', '\r\n'))

target3 = """    tgCreateEmployeeAccount(name,email,pass,'',jobTitle,role,workMode,function(){
        if(role==='employee') addEmployeeName(name);
        var roleAr = role==='tech_admin' ? 'أدمن تقني' : 'موظف';
        msg.style.color='var(--ok)'; msg.textContent='✅ تم إنشاء حساب '+roleAr+' بنجاح.';
        document.getElementById('newAccName').value='';
        document.getElementById('newAccEmail').value='';
        document.getElementById('newAccPass').value='';
        document.getElementById('newAccJobTitle').value='';
        if(roleEl) roleEl.value='employee';"""

replacement3 = """    tgCreateEmployeeAccount(name,email,pass,'',jobTitle,role,workMode,dept,phone,function(){
        if(role==='employee') addEmployeeName(name);
        var roleAr = role==='tech_admin' ? 'أدمن تقني' : 'موظف';
        msg.style.color='var(--ok)'; msg.textContent='✅ تم إنشاء حساب '+roleAr+' بنجاح.';
        document.getElementById('newAccName').value='';
        document.getElementById('newAccEmail').value='';
        document.getElementById('newAccPass').value='';
        document.getElementById('newAccJobTitle').value='';
        if(document.getElementById('newAccDept')) document.getElementById('newAccDept').value='';
        if(document.getElementById('newAccPhone')) document.getElementById('newAccPhone').value='';
        if(roleEl) roleEl.value='employee';"""

app_js = app_js.replace(target3, replacement3)
app_js = app_js.replace(target3.replace('\n', '\r\n'), replacement3.replace('\n', '\r\n'))

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(app_js)

# 2. Update auth.js
with codecs.open('auth.js', 'r', 'utf-8') as f:
    auth_js = f.read()

target4 = """function tgCreateEmployeeAccount(name, email, password, empId, jobTitle, role, workMode, onDone, onError) {
    // للتوافق مع الاستدعاء القديم
    if (typeof role === 'function') {
        onError = onDone;
        onDone = role;
        role = 'employee';
        workMode = 'office';
    } else if (typeof workMode === 'function') {
        onError = onDone;
        onDone = workMode;
        workMode = 'office';
    }"""

replacement4 = """function tgCreateEmployeeAccount(name, email, password, empId, jobTitle, role, workMode, dept, phone, onDone, onError) {
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
    }"""

auth_js = auth_js.replace(target4, replacement4)
auth_js = auth_js.replace(target4.replace('\n', '\r\n'), replacement4.replace('\n', '\r\n'))

target5 = """        return db.collection('users').doc(uid).set({
            baseName: name, name: finalName, email: email,
            role: role || 'employee',
            empId: empId || '', jobTitle: jobTitle || '',
            workMode: workMode || 'office',
            createdAt: new Date()
        })"""

replacement5 = """        return db.collection('users').doc(uid).set({
            baseName: name, name: finalName, email: email,
            role: role || 'employee',
            empId: empId || '', jobTitle: jobTitle || '',
            dept: dept || '', phone: phone || '',
            workMode: workMode || 'office',
            createdAt: new Date()
        })"""

auth_js = auth_js.replace(target5, replacement5)
auth_js = auth_js.replace(target5.replace('\n', '\r\n'), replacement5.replace('\n', '\r\n'))

with codecs.open('auth.js', 'w', 'utf-8') as f:
    f.write(auth_js)

print("Updates completed.")
