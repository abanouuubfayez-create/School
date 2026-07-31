import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_helper = """function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin) {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري المعالجة...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري البحث عن أحدث نموذج متاح...</div>';

    fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.error) throw new Error(data.error.message);
        var models = data.models || [];
        var validModels = [];
        for(var i=0; i<models.length; i++) {
            var m = models[i];
            if(m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1 && m.name.indexOf('gemini') !== -1) {
                validModels.push(m.name);
            }
        }
        
        if (validModels.length === 0) throw new Error("لم يتم العثور على أي نموذج.");

        validModels.sort(function(a, b) {
            var matchA = a.match(/gemini-(\\d+\\.\\d+)/);
            var matchB = b.match(/gemini-(\\d+\\.\\d+)/);
            var vA = matchA ? parseFloat(matchA[1]) : 0;
            var vB = matchB ? parseFloat(matchB[1]) : 0;
            return vB - vA;
        });

        function tryModel(index) {
            if(index >= validModels.length) {
                resultBox.innerHTML = '<div style="color:red;">❌ عذراً، جميع النماذج المتاحة بحسابك لا تعمل.</div>';
                btn.disabled = false;
                btn.innerHTML = btnOriginalText;
                return;
            }
            var targetModel = validModels[index];
            resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري تجربة: ' + targetModel.replace('models/','') + '...</div>';
            
            fetch('https://generativelanguage.googleapis.com/v1beta/' + targetModel + ':generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if(data.error) {
                    tryModel(index + 1);
                    return;
                }
                btn.disabled = false;
                btn.innerHTML = btnOriginalText;
                var text = data.candidates[0].content.parts[0].text;
                
                var resultHTML = '';
                if(typeof marked !== 'undefined') {
                    resultHTML = marked.parse(text);
                } else {
                    resultHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
                }
                
                var actionsHTML = '<div style="margin-top:20px; padding-top:15px; border-top:1px solid var(--border); display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">';
                
                actionsHTML += '<button onclick="shareAIResult()" class="btn-primary" style="padding:8px 15px; font-size:14px; background:var(--primary); color:#fff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-share-alt"></i> مشاركة</button>';
                actionsHTML += '<button onclick="downloadAIResult()" class="btn-secondary" style="padding:8px 15px; font-size:14px; background:var(--bg3); color:var(--tx1); border:1px solid var(--border); border-radius:5px; cursor:pointer;"><i class="fa fa-file-text"></i> حفظ النص</button>';
                
                if (isAdmin) {
                    actionsHTML += '<button onclick="searchAIResultOnGoogle()" class="btn-secondary" style="padding:8px 15px; font-size:14px; background:#4285F4; color:#fff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-google"></i> البحث عن الملفات لتحميلها</button>';
                    actionsHTML += '<button onclick="jumpToUploadResource()" class="btn-secondary" style="padding:8px 15px; font-size:14px; background:#10B981; color:#fff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-upload"></i> رفع ملف للمكتبة</button>';
                }
                
                actionsHTML += '</div>';
                
                resultBox.innerHTML = resultHTML + actionsHTML;
                window._lastAiResultText = text;
            })
            .catch(function(err) {
                tryModel(index + 1);
            });
        }
        
        tryModel(0);
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        resultBox.innerHTML = '<div style="color:red;">❌ ' + err.message + '</div>';
    });
}"""

# regex to replace the entire callGemini function
pattern = re.compile(r'function callGemini[\s\S]+?\}\n\}')
match = pattern.search(content)
if match:
    content = content[:match.start()] + new_helper + content[match.end():]
else:
    print("Could not find callGemini function")

# Update generateCareerPath to pass isAdmin = false
content = content.replace("callGemini(apiKey, prompt, btn, resultBox, '✨ اصنع مسار تطوري الآن');", "callGemini(apiKey, prompt, btn, resultBox, '✨ اصنع مسار تطوري الآن', false);")

# Update adminGenerateSuggestions to pass isAdmin = true
content = content.replace("callGemini(apiKey, prompt, btn, resultBox, '✨ اقترح مصادر لإضافتها');", "callGemini(apiKey, prompt, btn, resultBox, '✨ اقترح مصادر لإضافتها', true);")

global_funcs = """

window.searchAIResultOnGoogle = function() {
    var field = document.getElementById('adminDevField') ? document.getElementById('adminDevField').value : '';
    var query = encodeURIComponent("كتب ودورات " + field + " PDF تحميل");
    window.open("https://www.google.com/search?q=" + query, "_blank");
};

window.jumpToUploadResource = function() {
    document.getElementById('adminDevResTitle').focus();
    alert('قم بالنزول لأسفل واكتب اسم المصدر الذي قمت بتحميله في خانة "عنوان المصدر" لرفعه.');
};
"""

if "window.searchAIResultOnGoogle" not in content:
    content += global_funcs

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
