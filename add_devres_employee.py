import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

employee_devres_js = """
// ─── مسار التطوير المهني - لوحة الموظف ────────────────────────────────────
window.fetchEmpDevRes = function() {
    db.collection('dev_resources').orderBy('createdAt', 'desc').get().then(function(snap) {
        var grid = document.getElementById('empDevResGrid');
        if(!grid) return;
        
        window._allDevRes = [];
        
        if(snap.empty) {
            grid.innerHTML = '<div class="empty-hint">لم يتم إضافة أي مصادر للمكتبة بعد.</div>';
            return;
        }
        
        var h = '';
        snap.forEach(function(doc) {
            var d = doc.data();
            window._allDevRes.push(d);
            var isVideo = d.type === 'video';
            h += '<div style="background:var(--w); border:1px solid var(--bd2); border-radius:12px; padding:20px; transition:all 0.3s; box-shadow:0 4px 10px rgba(0,0,0,0.02); display:flex; flex-direction:column;">';
            h += '<div style="font-size:24px; margin-bottom:12px;">' + (isVideo ? '▶️' : '📕') + '</div>';
            h += '<div style="font-weight:800; font-size:16px; color:var(--nv); margin-bottom:8px;">' + escH(d.title) + '</div>';
            h += '<div style="font-size:12px; color:var(--tx3); margin-bottom:16px; flex:1;">المجال: ' + escH(d.tags || 'عام') + '</div>';
            h += '<a href="' + d.url + '" target="_blank" style="display:block; text-align:center; padding:10px; background:var(--bg2); color:var(--nv); border-radius:8px; text-decoration:none; font-weight:700; transition:all 0.2s;" onmouseover="this.style.background=\\'var(--nv)\\';this.style.color=\\'#fff\\';" onmouseout="this.style.background=\\'var(--bg2)\\';this.style.color=\\'var(--nv)\\';">' + (isVideo ? 'مشاهدة الفيديو' : 'قراءة الكتاب') + '</a>';
            h += '</div>';
        });
        grid.innerHTML = h;
    });
};

window.generateCareerPath = function() {
    var field = document.getElementById('devResEmpField').value.trim();
    var btn = document.getElementById('btnGeneratePath');
    var resultBox = document.getElementById('aiPathResult');
    
    if(!field) {
        alert('يرجى كتابة تخصصك أو مجالك أولاً.');
        return;
    }

    var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
    if(!apiKey) {
        alert('ميزة الذكاء الاصطناعي غير مفعلة حالياً. يرجى التواصل مع الإدارة لإضافة مفتاح API.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التفكير...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">🤖 يقوم الذكاء الاصطناعي الآن بتحليل تخصصك واختيار أفضل المصادر لك...</div>';

    var resourcesText = (window._allDevRes || []).map(function(r) { return "- " + r.title + " (نوع: " + (r.type === 'video' ? 'فيديو' : 'كتاب') + ", تخصص: " + (r.tags||'عام') + ")"; }).join('\\n');
    
    var prompt = "أنت مستشار تطوير مهني خبير ومحفز. طلب منك موظف يعمل في مجال أو تخصص: [" + field + "] أن تقترح له مساراً تطويرياً قصيراً ومفيداً.\\n" +
                 "لدينا في مكتبة الشركة المصادر التالية حصراً:\\n" + resourcesText + "\\n\\n" +
                 "يرجى كتابة خطة تطويرية محفزة باللغة العربية، واختر فقط المصادر الأكثر صلة من القائمة أعلاه (اذكر عناوينها لكي يبحث عنها الموظف في المكتبة أدناه). إذا لم تجد مصادر متخصصة، اقترح بعض المصادر العامة المفيدة له. قدم نصيحتك بتنسيق Markdown (استخدم العناوين، القوائم المنقطة، والخط العريض لتسهيل القراءة). لا تتحدث عن نفسك كمستشار، ابدأ مباشرة بالترحيب والتحفيز.";

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
        btn.innerHTML = '✨ اقترح مساراً لي';
        if(data.error) {
            resultBox.innerHTML = '<div style="color:red;">حدث خطأ في الاتصال بالذكاء الاصطناعي: ' + data.error.message + '</div>';
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
        btn.innerHTML = '✨ اقترح مساراً لي';
        resultBox.innerHTML = '<div style="color:red;">تعذر الاتصال بالذكاء الاصطناعي. تأكد من اتصالك بالإنترنت.</div>';
    });
};

// Hook into empGo to load resources when tab is clicked
var originalEmpGo = window.empGo;
window.empGo = function(id, nav) {
    if(originalEmpGo) originalEmpGo(id, nav);
    if(id === 'devres') {
        fetchEmpDevRes();
    }
};
"""

content += "\n" + employee_devres_js

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating app.js with employee devres logic")
