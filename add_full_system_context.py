import re

def update_context():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    new_context = """
async function buildCompanyContextForAi() {
    var ctx = "معلومات شاملة عن الشركة والنظام لتكون في السياق عند الإجابة:\\n";
    if (window._appSettingsCache && window._appSettingsCache.companyName) {
        ctx += "اسم الشركة: " + window._appSettingsCache.companyName + "\\n";
    } else {
        ctx += "اسم الشركة: الشركة الخاصة بنا\\n";
    }
    
    if (window.auth && window.auth.currentUser && window.db) {
        var uid = auth.currentUser.uid;
        try {
            var userDoc = await db.collection('users').doc(uid).get();
            var role = userDoc.data() ? userDoc.data().role : 'employee';
            var isAdmin = (role === 'admin' || role === 'tech_admin');
            
            // 1. Projects
            if (!window._pmgmtProjCache) {
                var snapP = isAdmin ? await db.collection('projects').get() : await db.collection('projects').where('assignees', 'array-contains', uid).get();
                window._pmgmtProjCache = [];
                snapP.forEach(function(d){ var data = d.data(); data.id = d.id; window._pmgmtProjCache.push(data); });
            }
            if (window._pmgmtProjCache.length > 0) {
                ctx += "\\nالمشاريع المرتبطة:\\n";
                for(var i=0; i<Math.min(window._pmgmtProjCache.length, 15); i++) {
                    var p = window._pmgmtProjCache[i];
                    ctx += "- مشروع: " + (p.title || 'بدون اسم') + " (الحالة: " + (p.status || 'قيد التنفيذ') + ")\\n";
                }
            } else {
                ctx += "\\nلا توجد مشاريع مسندة حالياً.\\n";
            }

            // 2. Employees (Only if Admin or Tech Admin to save tokens, OR we can list all employees for everyone as they can see them)
            if (!window._staffEmpCache) {
                var snapE = await db.collection('users').get();
                window._staffEmpCache = [];
                snapE.forEach(function(d){ var data = d.data(); data.uid = d.id; window._staffEmpCache.push(data); });
            }
            if (window._staffEmpCache.length > 0) {
                ctx += "\\nالموظفون الحاليون (عينة):\\n";
                for(var i=0; i<Math.min(window._staffEmpCache.length, 30); i++) {
                    var e = window._staffEmpCache[i];
                    var roleStr = e.role === 'admin' ? 'مدير نظام' : (e.role === 'manager' ? 'مدير' : 'موظف');
                    ctx += "- " + (e.name || 'غير معروف') + " (" + roleStr + ")\\n";
                }
            }

            // 3. Tasks
            var snapT = isAdmin ? await db.collection('tasks').limit(20).get() : await db.collection('tasks').where('assignedTo', '==', uid).limit(20).get();
            if (!snapT.empty) {
                ctx += "\\nالمهام الحالية:\\n";
                snapT.forEach(function(d){
                    var t = d.data();
                    ctx += "- مهمة: " + (t.title || 'بدون اسم') + " (الحالة: " + (t.status || 'معلقة') + ")\\n";
                });
            }

            // 4. Requests
            var snapR = isAdmin ? await db.collection('requests').limit(10).get() : await db.collection('requests').where('uid', '==', uid).limit(10).get();
            if (!snapR.empty) {
                ctx += "\\nالطلبات الأخيرة:\\n";
                snapR.forEach(function(d){
                    var r = d.data();
                    ctx += "- طلب: " + (r.type || 'طلب') + " (الحالة: " + (r.status || 'معلق') + ")\\n";
                });
            }

            // 5. Achievements
            var snapA = await db.collection('achievements').where('uid', '==', uid).limit(5).get();
            if (!snapA.empty) {
                ctx += "\\nالإنجازات الأخيرة:\\n";
                snapA.forEach(function(d){
                    var a = d.data();
                    ctx += "- إنجاز: " + (a.title || 'إنجاز') + "\\n";
                });
            }

        } catch(e) { console.error("Error loading full system context for AI", e); }
    }
    
    ctx += "\\nملاحظة هامة جداً: أنت الآن مساعد ووكيل ذكي داخل هذا النظام. لقد تم تزويدك بالبيانات أعلاه (مشاريع، موظفين، مهام، إلخ) بناءً على ما يمكن للمستخدم الحالي رؤيته. استخدم هذه المعلومات للإجابة عن أسئلة المستخدم حول النظام بشكل مباشر وكأنك تعرف كل التفاصيل. لا تقل أبداً 'لم يتم تزويدنا بمعلومات'.\\n\\n";
    return ctx;
}
"""

    content = re.sub(r'async function buildCompanyContextForAi\(\) \{.*?\n\}\n(?=window\.generateCareerPath)', new_context, content, flags=re.DOTALL)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Full system context injected.")

if __name__ == "__main__":
    update_context()
