import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the styling of actionsHTML
old_actions = "var actionsHTML = '<div style=\"margin-top:20px; padding-top:15px; border-top:1px solid var(--border); display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;\">';"
new_actions = "var actionsHTML = '<div style=\"margin-top:20px; padding-top:15px; border-top:1px solid #ccc; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;\">';"

old_share = "'<button onclick=\"shareAIResult()\" class=\"btn-primary\" style=\"padding:8px 15px; font-size:14px; background:var(--primary); color:#fff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-share-alt\"></i> مشاركة</button>';"
new_share = "'<button onclick=\"share_ai_content()\" style=\"padding:8px 15px; font-size:14px; background-color:#2563eb; color:#ffffff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-share-alt\"></i> مشاركة</button>';"

old_download = "'<button onclick=\"downloadAIResult()\" class=\"btn-secondary\" style=\"padding:8px 15px; font-size:14px; background:var(--bg3); color:var(--tx1); border:1px solid var(--border); border-radius:5px; cursor:pointer;\"><i class=\"fa fa-file-text\"></i> حفظ النص</button>';"
new_download = "'<button onclick=\"download_ai_content()\" style=\"padding:8px 15px; font-size:14px; background-color:#f3f4f6; color:#1f2937; border:1px solid #d1d5db; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-file-text\"></i> حفظ النص</button>';"

old_search = "'<button onclick=\"searchAIResultOnGoogle()\" class=\"btn-secondary\" style=\"padding:8px 15px; font-size:14px; background:#4285F4; color:#fff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-google\"></i> البحث عن الملفات لتحميلها</button>';"
new_search = "'<button onclick=\"search_ai_content_on_google()\" style=\"padding:8px 15px; font-size:14px; background-color:#4285F4; color:#ffffff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-google\"></i> البحث في جوجل</button>';"

old_upload = "'<button onclick=\"jumpToUploadResource()\" class=\"btn-secondary\" style=\"padding:8px 15px; font-size:14px; background:#10B981; color:#fff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-upload\"></i> رفع ملف للمكتبة</button>';"
new_upload = "'<button onclick=\"jump_to_upload_resource()\" style=\"padding:8px 15px; font-size:14px; background-color:#10B981; color:#ffffff; border:none; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-upload\"></i> إضافة للمكتبة</button>';"

content = content.replace(old_actions, new_actions)
content = content.replace(old_share, new_share)
content = content.replace(old_download, new_download)
content = content.replace(old_search, new_search)
content = content.replace(old_upload, new_upload)

# Update global functions names
content = content.replace('window.downloadAIResult = function() {', 'window.download_ai_content = function() {')
content = content.replace('window.shareAIResult = function() {', 'window.share_ai_content = function() {')
content = content.replace('window.searchAIResultOnGoogle = function() {', 'window.search_ai_content_on_google = function() {')
content = content.replace('window.jumpToUploadResource = function() {', 'window.jump_to_upload_resource = function() {')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
