import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"var storageRef = firebase\.storage\(\)\.ref\(\);[\s\S]*?btn\.disabled = false;\s*\}\);\s*\}\);\s*\} else if\(type === 'video'\)"
replacement = """tgUploadFile('dev_resources', file.name, file,
              function(progress) {
                  status.innerText = '⏳ جارٍ رفع الملف... ' + Math.round(progress) + '%';
              },
              function(error) {
                  status.innerText = '❌ خطأ في الرفع: ' + error;
                  btn.disabled = false;
              },
              function(url) {
                  status.innerText = '⏳ جارٍ حفظ البيانات...';
                  data.url = url;
                  data.fileName = file.name;
                  db.collection('dev_resources').add(data).then(function() {
                      status.innerText = '✅ تم الحفظ بنجاح!';
                      btn.disabled = false;
                      document.getElementById('devResTitle').value = '';
                      fileInput.value = '';
                      fetchDevResAdminList();
                      setTimeout(function(){ status.innerText = ''; }, 3000);
                  }).catch(function(err) {
                      status.innerText = '❌ خطأ في قاعدة البيانات: ' + err.message;
                      btn.disabled = false;
                  });
              }
          );
      } else if(type === 'video')"""

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced Firebase Storage with Supabase Storage for dev_resources")
else:
    print("Pattern not found! Check the file manually.")
