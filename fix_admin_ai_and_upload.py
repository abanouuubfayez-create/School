import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix upload progress bar and error handling in addDevRes
upload_old = """        var storageRef = firebase.storage().ref();
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
        });"""

upload_new = """        var storageRef = firebase.storage().ref();
        var fileRef = storageRef.child('dev_resources/' + Date.now() + '_' + file.name);
        
        var uploadTask = fileRef.put(file);
        
        uploadTask.on('state_changed', function(snapshot) {
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            status.innerText = '⏳ جارٍ رفع الملف... ' + Math.round(progress) + '%';
        }, function(error) {
            status.innerText = '❌ خطأ في الرفع: ' + error.message;
            btn.disabled = false;
        }, function() {
            status.innerText = '⏳ جارٍ حفظ البيانات...';
            uploadTask.snapshot.ref.getDownloadURL().then(function(url) {
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
                status.innerText = '❌ خطأ في الحفظ: ' + err.message;
                btn.disabled = false;
            });
        });"""

if upload_old in content:
    content = content.replace(upload_old, upload_new)
    print("Upload logic fixed")
else:
    print("Upload logic old pattern not found")


# 2. Inject Admin AI Assistant box using Regex
# We'll look for `<div class="set-sec-title">📖 المصادر المضافة حالياً</div>`
ai_box_html = """    h += '<div class="set-sec" style="max-width:800px; margin:20px auto; background: linear-gradient(135deg, #f0f4ff 0%, #e6edff 100%); border: 1px solid #cce0ff; padding:20px; border-radius:8px;">';
    h += '<div class="set-sec-title">🤖 مساعد الذكاء الاصطناعي للمدير</div>';
    h += '<div class="set-hint" style="margin-bottom:12px;">لا تعرف ماذا تضيف؟ أدخل المسمى الوظيفي أو القسم، وسيقترح لك الذكاء الاصطناعي أفضل الكتب أو الفيديوهات!</div>';
    h += '<div style="display:flex; gap:8px; flex-wrap:wrap;">';
    h += '<input type="text" id="adminAiSuggestField" placeholder="مثال: مبيعات، تسويق رقمي، مطورين..." style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">';
    h += '<button class="bt bt-d" style="background:var(--nv); color:var(--w); border:none; padding:8px 15px; border-radius:4px; cursor:pointer;" onclick="adminGenerateSuggestions()" id="btnAdminSuggest">✨ اقترح مصادر لإضافتها</button>';
    h += '</div>';
    h += '<div id="adminAiSuggestResult" style="display:none; margin-top:16px; padding:16px; background:var(--w); border-radius:8px; border:1px solid var(--bd2); font-size:14px; line-height:1.6; color:var(--tx);"></div>';
    h += '</div>';
"""

target_pattern = r"(h \+= '<div class=\"set-sec\" style=\"max-width:800px; margin:20px auto;\">';\s*h \+= '<div class=\"set-sec-title\">📖 المصادر المضافة حالياً</div>';)"
match = re.search(target_pattern, content)
if match and "🤖 مساعد الذكاء الاصطناعي للمدير" not in content:
    content = content[:match.start()] + ai_box_html + "\n    " + match.group(1) + content[match.end():]
    print("AI Box injected")
else:
    print("AI box pattern not found or already injected")


with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
