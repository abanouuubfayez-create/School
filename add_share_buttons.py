import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the innerHTML setting in callGemini
old_block = """                if(typeof marked !== 'undefined') {
                    resultBox.innerHTML = marked.parse(text);
                } else {
                    resultBox.innerHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
                }"""

new_block = """                var resultHTML = '';
                if(typeof marked !== 'undefined') {
                    resultHTML = marked.parse(text);
                } else {
                    resultHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
                }
                
                var actionsHTML = '<div style="margin-top:20px; padding-top:15px; border-top:1px solid var(--border); display:flex; gap:10px; justify-content:flex-end;">' +
                    '<button onclick="shareAIResult()" class="btn-primary" style="padding:8px 15px; font-size:14px; background:var(--primary); color:#fff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-share-alt"></i> مشاركة</button>' +
                    '<button onclick="downloadAIResult()" class="btn-secondary" style="padding:8px 15px; font-size:14px; background:var(--bg3); color:var(--tx1); border:1px solid var(--border); border-radius:5px; cursor:pointer;"><i class="fa fa-download"></i> تحميل مباشر</button>' +
                    '</div>';
                
                resultBox.innerHTML = resultHTML + actionsHTML;
                window._lastAiResultText = text;"""

content = content.replace(old_block, new_block)

# Append the global functions
global_funcs = """

window.downloadAIResult = function() {
    if(!window._lastAiResultText) return;
    var blob = new Blob([window._lastAiResultText], {type: "text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "اقتراحات_الذكاء_الاصطناعي.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.shareAIResult = function() {
    if(!window._lastAiResultText) return;
    if (navigator.share) {
        navigator.share({
            title: 'اقتراحات التطوير المهني',
            text: window._lastAiResultText
        }).catch(function(err){
            console.error(err);
            copyToClipboardFallback();
        });
    } else {
        copyToClipboardFallback();
    }
};

function copyToClipboardFallback() {
    if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window._lastAiResultText).then(function() {
            alert('تم نسخ النص إلى الحافظة بنجاح! يمكنك الآن لصقه في أي محادثة لمشاركته مع فريقك.');
        }).catch(function(err) {
            alert('فشل النسخ: ' + err);
        });
    } else {
        alert('المتصفح الخاص بك لا يدعم المشاركة المباشرة.');
    }
}
"""

if "window.downloadAIResult" not in content:
    content += global_funcs

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
