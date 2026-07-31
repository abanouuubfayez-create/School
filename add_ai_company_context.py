import re

def update_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new helper function
    context_func = """
function buildCompanyContextForAi() {
    var ctx = "معلومات عن الشركة لتكون في السياق عند الإجابة:\\n";
    if (window._appSettingsCache && window._appSettingsCache.companyName) {
        ctx += "اسم الشركة: " + window._appSettingsCache.companyName + "\\n";
    } else {
        ctx += "اسم الشركة: الشركة الخاصة بنا\\n";
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
    
    # 1. Insert the helper function above generateCareerPath
    if "function buildCompanyContextForAi()" not in content:
        content = content.replace("window.generateCareerPath = function() {", context_func + "\nwindow.generateCareerPath = function() {")

    # 2. Modify generateCareerPath to use the context
    old_career_prompt = 'var prompt = "أنت مستشار مهني وتطوير موارد بشرية محترف.'
    new_career_prompt = 'var prompt = buildCompanyContextForAi() + "أنت مستشار مهني وتطوير موارد بشرية محترف.'
    content = content.replace(old_career_prompt, new_career_prompt)

    # 3. Modify generateAdminSuggest to use the context
    # Need to find how generateAdminSuggest starts the prompt
    old_admin_prompt = 'var prompt = "أنت خبير تطوير مهني وموارد بشرية محترف.'
    new_admin_prompt = 'var prompt = buildCompanyContextForAi() + "أنت خبير تطوير مهني وموارد بشرية محترف.'
    content = content.replace(old_admin_prompt, new_admin_prompt)

    # Note: If the prompt strings in Arabic are slightly different, the exact replace won't work. Let's use regex.
    content = re.sub(r'(var prompt = )("أنت مستشار مهني وتطوير)', r'\1buildCompanyContextForAi() + \2', content)
    content = re.sub(r'(var prompt = )("أنت خبير تطوير مهني وموارد)', r'\1buildCompanyContextForAi() + \2', content)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Successfully updated app.js to inject AI context")

if __name__ == "__main__":
    update_app_js()
