import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix search_ai_content_on_google
content = re.sub(
    r"window\.search_ai_content_on_google\s*=\s*function\(\)\s*\{[\s\S]*?window\.open[\s\S]*?\};",
    """window.search_ai_content_on_google = function() {
    var field = document.getElementById('adminAiSuggestField') ? document.getElementById('adminAiSuggestField').value : '';
    var query = encodeURIComponent("كتاب عن " + field + " PDF مجانا");
    window.open("https://www.google.com/search?q=" + query, "_blank");
};""",
    content
)

# Fix jump_to_upload_resource
content = re.sub(
    r"window\.jump_to_upload_resource\s*=\s*function\(\)\s*\{[\s\S]*?alert\([\s\S]*?\};",
    """window.jump_to_upload_resource = function() {
    var titleInput = document.getElementById('devResTitle');
    if (titleInput) {
        titleInput.focus();
        titleInput.scrollIntoView({behavior: "smooth", block: "center"});
    }
    alert('قم بنسخ اسم الكتاب الذي أعجبك من الاقتراحات والصقه في عنوان إضافة مصدر لرفعه.');
};""",
    content
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing JS functions")
