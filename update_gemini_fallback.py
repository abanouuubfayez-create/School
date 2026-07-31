import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_helper = """function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText) {
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

        // Sort by version descending
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
                if(typeof marked !== 'undefined') {
                    resultBox.innerHTML = marked.parse(text);
                } else {
                    resultBox.innerHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
                }
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

start_idx = content.find('function callGemini(')
if start_idx != -1:
    # Find the next window.adminGenerateSuggestions to know where callGemini ends
    # No wait, callGemini is inserted at the end of the file in my previous python script!
    # "if "function callGemini" not in content: content = content + "\n\n" + helper_func"
    # Wait, the first time I added it, I added it to the END of the file! No, in app.js, is it at the end?
    # Let me just replace everything from "function callGemini(" to the end of the file, because it's the last function!
    end_idx = content.find('function callGemini(', start_idx + 1)
    if end_idx == -1:
        # It's the only one. We can just cut everything from start_idx to the end, EXCEPT wait...
        # Let's find the exact string of the old callGemini and replace it.
        # Let's use regex but compile it properly.
        pattern = re.compile(r'function callGemini[\s\S]+?\}\n\}')
        match = pattern.search(content)
        if match:
            content = content[:match.start()] + new_helper + content[match.end():]
        else:
            print("Regex did not match! We'll just replace everything after function callGemini")
            # The old function has about 40 lines.
            content = content[:start_idx] + new_helper
            
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("done")
else:
    print("function not found")
