import sys

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "var storageRef = firebase.storage().ref();" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "} else if(type === 'video')" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_code = """          tgUploadFile('dev_resources', file.name, file, 
              function(progress) {
                  status.innerText = '⏳ جارٍ رفع الملف... ' + progress + '%';
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
                      setTimeout(function(){ status.innerText=''; }, 3000);
                  }).catch(function(err) {
                      status.innerText = '❌ خطأ في قاعدة البيانات: ' + err.message;
                      btn.disabled = false;
                  });
              }
          );
      } else if(type === 'video') {
"""
    lines[start_idx:end_idx+1] = [new_code]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Success")
else:
    print(f"Failed to find block start={start_idx} end={end_idx}")
