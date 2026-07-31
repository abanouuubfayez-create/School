with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin) {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري المعالجة...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري إنشاء الرد...</div>';

    var targetModel = 'models/gemini-1.5-flash';
    
    fetch('https://generativelanguage.googleapis.com/v1beta/' + targetModel + ':generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.error) throw new Error(data.error.message);
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        var text = data.candidates[0].content.parts[0].text;
        
        var resultHTML = '';
        if(typeof marked !== 'undefined') {
            resultHTML = marked.parse(text);
        } else {
            resultHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
        }
        
        var actionsHTML = '<div style="margin-top:20px; padding-top:15px; border-top:1px solid #ccc; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">';
        
        actionsHTML += '<button onclick="share_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#2563eb; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-share-alt"></i> مشاركة</button>';
        actionsHTML += '<button onclick="download_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#f3f4f6; color:#1f2937; border:1px solid #d1d5db; border-radius:5px; cursor:pointer;"><i class="fa fa-file-text"></i> حفظ النص</button>';
        
        if (isAdmin) {
            actionsHTML += '<button onclick="search_ai_content_on_google()" style="padding:8px 15px; font-size:14px; background-color:#4285F4; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-google"></i> البحث في جوجل</button>';
            actionsHTML += '<button onclick="jump_to_upload_resource()" style="padding:8px 15px; font-size:14px; background-color:#10B981; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-upload"></i> إضافة للمكتبة</button>';
        }
        
        actionsHTML += '</div>';
        
        resultBox.innerHTML = resultHTML + actionsHTML;
        window._lastAiResultText = text;
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        resultBox.innerHTML = '<div style="color:red;">❌ ' + err.message + '</div>';
    });
};
"""

start_idx = content.find("function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin)")
end_idx = content.find("function copyToClipboardFallback()", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_func + '\n' + content[end_idx:]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced callGemini")
else:
    print(f"Could not find callGemini. start_idx={start_idx}, end_idx={end_idx}")
