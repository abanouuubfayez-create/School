import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change get() to onSnapshot() for Admin list
old_admin_fetch = """window.fetchDevResAdminList = function() {
    var list = document.getElementById('devResAdminList');
    if(!list) return;
    list.innerHTML = '⏳ جارٍ التحميل...';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {"""
new_admin_fetch = """window.fetchDevResAdminList = function() {
    var list = document.getElementById('devResAdminList');
    if(!list) return;
    list.innerHTML = '⏳ جارٍ التحميل...';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').onSnapshot(function(snap) {"""
content = content.replace(old_admin_fetch, new_admin_fetch)

old_admin_catch = """        list.innerHTML = h;
    }).catch(function(err) {
        console.error("fetchDevResAdminList error:", err);
        list.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '<br><small>هل قمت بتحديث قواعد Firestore؟</small></div>';
    });
};"""
new_admin_catch = """        list.innerHTML = h;
    }, function(err) {
        console.error("fetchDevResAdminList error:", err);
        list.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '<br><small>هل قمت بتحديث قواعد Firestore؟</small></div>';
    });
};"""
content = content.replace(old_admin_catch, new_admin_catch)


# 2. Change get() to onSnapshot() for Employee list
old_emp_fetch = """window.fetchEmpDevRes = function() {
    var grid = document.getElementById('empDevResGrid');
    if(!grid) return;
    grid.innerHTML = '<div class="empty-hint">⏳ جارٍ تحميل المصادر...</div>';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {"""
new_emp_fetch = """window.fetchEmpDevRes = function() {
    var grid = document.getElementById('empDevResGrid');
    if(!grid) return;
    grid.innerHTML = '<div class="empty-hint">⏳ جارٍ تحميل المصادر...</div>';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').onSnapshot(function(snap) {"""
content = content.replace(old_emp_fetch, new_emp_fetch)

old_emp_catch = """        grid.innerHTML = h;
    }).catch(function(err){
        console.error("fetchEmpDevRes error:", err);
        grid.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '</div>';
    });
};"""
new_emp_catch = """        grid.innerHTML = h;
    }, function(err){
        console.error("fetchEmpDevRes error:", err);
        grid.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '</div>';
    });
};"""
content = content.replace(old_emp_catch, new_emp_catch)


# 3. Add AI suggestion to Admin UI
old_admin_ui = """    h += '<button class="bt bt-p" onclick="addDevRes()" id="btnSaveDevRes">➕ حفظ المصدر في المكتبة</button>';
    h += '<div id="devResUploadStatus" style="margin-top:10px; font-weight:bold; color:var(--nv); font-size:12px;"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📖 المصادر المضافة حالياً</div>';"""

new_admin_ui = """    h += '<button class="bt bt-p" onclick="addDevRes()" id="btnSaveDevRes">➕ حفظ المصدر في المكتبة</button>';
    h += '<div id="devResUploadStatus" style="margin-top:10px; font-weight:bold; color:var(--nv); font-size:12px;"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto; background: linear-gradient(135deg, #f0f4ff 0%, #e6edff 100%); border: 1px solid #cce0ff;">';
    h += '<div class="set-sec-title">🤖 مساعد الذكاء الاصطناعي للمدير</div>';
    h += '<div class="set-hint" style="margin-bottom:12px;">لا تعرف ماذا تضيف؟ أدخل المسمى الوظيفي أو القسم، وسيقترح لك الذكاء الاصطناعي أفضل الكتب أو مواضيع الفيديوهات لتبحث عنها وتضيفها للموظفين!</div>';
    h += '<div style="display:flex; gap:8px; flex-wrap:wrap;">';
    h += '<input type="text" id="adminAiSuggestField" placeholder="مثال: مبيعات، تسويق رقمي، مطورين..." style="flex:1;">';
    h += '<button class="bt bt-d" style="background:var(--nv); color:var(--w); border:none;" onclick="adminGenerateSuggestions()" id="btnAdminSuggest">✨ اقترح مصادر لإضافتها</button>';
    h += '</div>';
    h += '<div id="adminAiSuggestResult" style="display:none; margin-top:16px; padding:16px; background:var(--w); border-radius:8px; border:1px solid var(--bd2); font-size:14px; line-height:1.6; color:var(--tx);"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📖 المصادر المضافة حالياً</div>';"""
content = content.replace(old_admin_ui, new_admin_ui)


# 4. Add adminGenerateSuggestions function
admin_ai_js = """
window.adminGenerateSuggestions = function() {
    var field = document.getElementById('adminAiSuggestField').value.trim();
    var btn = document.getElementById('btnAdminSuggest');
    var resultBox = document.getElementById('adminAiSuggestResult');
    
    if(!field) {
        alert('يرجى إدخال التخصص أو القسم أولاً.');
        return;
    }

    var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
    if(!apiKey) {
        alert('مفتاح Gemini API غير موجود في إعدادات النظام. يرجى إضافته أولاً.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التفكير...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">🤖 الذكاء الاصطناعي يبحث لك عن أفضل الاقتراحات...</div>';

    var prompt = "أنت مستشار تطوير مهني خبير. بصفتي مدير موارد بشرية، أريد أن أضيف مصادر تعليمية (كتب، ملفات PDF، وقنوات أو دورات يوتيوب) للموظفين في تخصص: [" + field + "].\\n" +
                 "أرجو أن تقترح لي 3 إلى 5 مصادر قوية ومعروفة ومفيدة جداً في هذا المجال (يفضل باللغة العربية إن وجد، أو الإنجليزية). اكتب اسم الكتاب أو موضوع الفيديو بوضوح لكي أستطيع البحث عنه ورفعه للموظفين.\\n" +
                 "قدم الاقتراحات بتنسيق Markdown وضعها في نقاط سريعة وواضحة بدون مقدمات طويلة.";

    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    }).then(function(res) {
        return res.json();
    }).then(function(data) {
        btn.disabled = false;
        btn.innerHTML = '✨ اقترح مصادر لإضافتها';
        if(data.error) {
            resultBox.innerHTML = '<div style="color:red;">حدث خطأ: ' + data.error.message + '</div>';
            return;
        }
        var text = data.candidates[0].content.parts[0].text;
        if(typeof marked !== 'undefined') {
            resultBox.innerHTML = marked.parse(text);
        } else {
            resultBox.innerHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
        }
    }).catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = '✨ اقترح مصادر لإضافتها';
        resultBox.innerHTML = '<div style="color:red;">تعذر الاتصال بالذكاء الاصطناعي. تأكد من اتصالك بالإنترنت.</div>';
    });
};
"""

content += "\n" + admin_ai_js

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching app.js")
