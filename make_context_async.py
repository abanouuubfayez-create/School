import re

def fix_async_context():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    new_context_func = """
async function buildCompanyContextForAi() {
    var ctx = "معلومات عن الشركة لتكون في السياق عند الإجابة:\\n";
    if (window._appSettingsCache && window._appSettingsCache.companyName) {
        ctx += "اسم الشركة: " + window._appSettingsCache.companyName + "\\n";
    } else {
        ctx += "اسم الشركة: الشركة الخاصة بنا\\n";
    }
    
    if (!window._pmgmtProjCache && window.auth && window.auth.currentUser && window.db) {
        try {
            var userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            var role = userDoc.data() ? userDoc.data().role : 'employee';
            var snap;
            if (role === 'admin' || role === 'tech_admin') {
                snap = await db.collection('projects').get();
            } else {
                snap = await db.collection('projects').where('assignees', 'array-contains', auth.currentUser.uid).get();
            }
            window._pmgmtProjCache = [];
            snap.forEach(function(d){ var data = d.data(); data.id = d.id; window._pmgmtProjCache.push(data); });
        } catch(e) { console.error("Error loading projects for AI context", e); }
    }

    if (!window._staffEmpCache && window.auth && window.auth.currentUser && window.db) {
        try {
            var snap = await db.collection('users').get();
            window._staffEmpCache = [];
            snap.forEach(function(d){ var data = d.data(); data.uid = d.id; window._staffEmpCache.push(data); });
        } catch(e) { console.error("Error loading employees for AI context", e); }
    }

    // Add Projects Context
    if (window._pmgmtProjCache && window._pmgmtProjCache.length > 0) {
        ctx += "\\nالمشاريع الحالية في الشركة:\\n";
        var activeProjects = window._pmgmtProjCache.filter(function(p){ return p.status !== 'مكتمل'; });
        for(var i=0; i<Math.min(activeProjects.length, 15); i++) {
            var p = activeProjects[i];
            ctx += "- " + (p.title || 'بدون اسم') + " (الحالة: " + (p.status || 'قيد التنفيذ') + ")\\n";
        }
    }

    // Add Employees Context
    if (window._staffEmpCache && window._staffEmpCache.length > 0) {
        ctx += "\\nالموظفون الحاليون (أسماء ومناصب):\\n";
        for(var i=0; i<Math.min(window._staffEmpCache.length, 30); i++) {
            var e = window._staffEmpCache[i];
            var roleStr = e.role === 'admin' ? 'مدير نظام' : (e.role === 'manager' ? 'مدير' : 'موظف');
            var levelStr = e.level || '';
            var deptStr = e.department || '';
            ctx += "- " + (e.name || 'غير معروف') + " (" + roleStr + (deptStr ? " قسم " + deptStr : "") + (levelStr ? " مستوى " + levelStr : "") + ")\\n";
        }
    }
    
    ctx += "\\nملاحظة: استخدم هذه المعلومات فقط إذا كان سؤال المستخدم يتعلق بها أو إذا كانت ستساعد في تقديم مسار مهني أو نصيحة أفضل داخل سياق شركتنا. لا تقم بسرد هذه المعلومات للمستخدم إلا إذا طلب ذلك.\\n\\n";
    return ctx;
}
"""
    
    # 1. Replace the old context function
    # Find the block from `function buildCompanyContextForAi()` to the closing brace before `window.generateCareerPath = function()`
    # We will use regex
    content = re.sub(r'function buildCompanyContextForAi\(\) \{.*?\n\}\n(?=window\.generateCareerPath)', new_context_func, content, flags=re.DOTALL)

    # 2. Make generateCareerPath async and await buildCompanyContextForAi()
    content = content.replace("window.generateCareerPath = function() {", "window.generateCareerPath = async function() {")
    content = content.replace("var prompt = buildCompanyContextForAi()", "var prompt = (await buildCompanyContextForAi())")

    # 3. Make adminGenerateSuggestions async
    content = content.replace("window.adminGenerateSuggestions = function() {", "window.adminGenerateSuggestions = async function() {")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Async AI Context configured successfully.")

if __name__ == "__main__":
    fix_async_context()
