with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

missing_funcs = """
window.download_ai_content = function() {
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

window.share_ai_content = function() {
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
"""

if "window.share_ai_content" not in content:
    content += missing_funcs

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
