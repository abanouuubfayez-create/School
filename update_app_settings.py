import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Update saveAppSettings
old_save = """function saveAppSettings() {
    var enabled = document.getElementById('chkAttEnabled').checked;
    var globalRemote = document.getElementById('chkGlobalRemote').checked;
    db.collection('system').doc('appSettings').set({
        attendanceEnabled: enabled,
        globalRemoteMode: globalRemote
    }, {merge: true}).then(function() {
        window._appSettingsCache = window._appSettingsCache || {};
        window._appSettingsCache.attendanceEnabled = enabled;
        window._appSettingsCache.globalRemoteMode = globalRemote;"""

new_save = """function saveAppSettings() {
    var enabled = document.getElementById('chkAttEnabled').checked;
    var globalRemote = document.getElementById('chkGlobalRemote').checked;
    var geminiApi = document.getElementById('txtGeminiApi') ? document.getElementById('txtGeminiApi').value.trim() : (window._appSettingsCache ? window._appSettingsCache.geminiApiKey : '');
    db.collection('system').doc('appSettings').set({
        attendanceEnabled: enabled,
        globalRemoteMode: globalRemote,
        geminiApiKey: geminiApi
    }, {merge: true}).then(function() {
        window._appSettingsCache = window._appSettingsCache || {};
        window._appSettingsCache.attendanceEnabled = enabled;
        window._appSettingsCache.globalRemoteMode = globalRemote;
        window._appSettingsCache.geminiApiKey = geminiApi;"""

content = content.replace(old_save, new_save)

# Update settings UI
old_ui = """        h+='<button class="bt bt-p" style="padding:6px 14px;font-size:12px" onclick="saveAppSettings()">💾 حفظ إعدادات النظام</button>';
        h+='</div>';"""

new_ui = """        h+='<button class="bt bt-p" style="padding:6px 14px;font-size:12px" onclick="saveAppSettings()">💾 حفظ إعدادات النظام</button>';
        h+='</div>';

        h+='<div class="set-sec"><div class="set-sec-title">🤖 الذكاء الاصطناعي (Gemini API)</div>';
        h+='<div class="set-hint" style="margin-bottom:12px">ضع هنا مفتاح Gemini API لتفعيل اقتراحات التطوير المهني للموظفين.</div>';
        h+='<div class="fr fr2"><div class="fg" style="margin:0"><input type="password" id="txtGeminiApi" placeholder="AIzaSy..." value="'+(window._appSettingsCache&&window._appSettingsCache.geminiApiKey?window._appSettingsCache.geminiApiKey:'')+'"></div></div>';
        h+='<button class="bt bt-p" style="padding:6px 14px;font-size:12px;margin-top:10px" onclick="saveAppSettings()">💾 حفظ إعدادات النظام</button>';
        h+='</div>';"""

content = content.replace(old_ui, new_ui)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating app.js")
