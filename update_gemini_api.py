import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The helper function to inject
helper_func = """
function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText) {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري المعالجة...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري المعالجة والتحليل الذكي...</div>';

    fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.error) throw new Error(data.error.message);
        var models = data.models || [];
        var targetModel = null;
        for(var i=0; i<models.length; i++) {
            var m = models[i];
            if(m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1) {
                if(m.name.indexOf('gemini-1.5-flash') !== -1) { targetModel = m.name; break; }
                if(!targetModel && m.name.indexOf('gemini') !== -1) { targetModel = m.name; }
            }
        }
        if(!targetModel) targetModel = 'models/gemini-1.5-flash';
        
        return fetch('https://generativelanguage.googleapis.com/v1beta/' + targetModel + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        if(data.error) {
            resultBox.innerHTML = '<div style="color:red;">❌ حدث خطأ: ' + data.error.message + '</div>';
            return;
        }
        var text = data.candidates[0].content.parts[0].text;
        if(typeof marked !== 'undefined') {
            resultBox.innerHTML = marked.parse(text);
        } else {
            resultBox.innerHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
        }
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        resultBox.innerHTML = '<div style="color:red;">❌ حدث خطأ: ' + err.message + '</div>';
    });
}
"""

if "function callGemini" not in content:
    content = content + "\n\n" + helper_func

# Replace the first fetch block in generateCareerPath
emp_fetch_regex = r"fetch\('https://generativelanguage\.googleapis\.com/v1beta/models/gemini-pro:generateContent\?key=' \+ apiKey, \{[\s\S]*?\}\);\n"
content = re.sub(emp_fetch_regex, "callGemini(apiKey, prompt, btn, resultBox, '✨ اصنع مسار تطوري الآن');\n", content)

# Replace the second fetch block in adminGenerateSuggestions
admin_fetch_regex = r"fetch\('https://generativelanguage\.googleapis\.com/v1beta/models/gemini-pro:generateContent\?key=' \+ apiKey, \{[\s\S]*?\}\);\n"
content = re.sub(admin_fetch_regex, "callGemini(apiKey, prompt, btn, resultBox, '✨ اقترح مصادر لإضافتها');\n", content)


with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
