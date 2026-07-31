import re

# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Define the new loadUsersForCalls function with premium UI and aligned columns
new_load_users_ui = """function getRelativeTimeArabic(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "منذ ثوانٍ";
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return "منذ " + minutes + " د";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return "منذ " + hours + " س";
    var days = Math.floor(hours / 24);
    return "منذ " + days + " يوم";
}

window.loadUsersForCalls = function() {
    var adminList = document.getElementById('callTargetListAdmin');
    var empList = document.getElementById('callTargetListEmp');
    var listContainer = adminList || empList;
    
    if(!listContainer || !window.db) return;
    
    if(window._callUsersUnsubscribe) {
        window._callUsersUnsubscribe();
    }
    
    window._callUsersUnsubscribe = db.collection('users').onSnapshot(function(usersSnap) {
        var html = `
        <!-- Group Call Row -->
        <div style="background:var(--bg2); border:1px solid var(--bd); padding:15px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:15px; box-shadow:var(--sh-sm);">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">🏢</div>
                <div>
                    <div style="font-weight:bold; color:var(--tx); font-size:14px;">الشركة بأكملها (اجتماع عام)</div>
                    <div style="font-size:11px; color:var(--tx2); margin-top:2px;">بدء اجتماع مباشر لجميع موظفي الشركة</div>
                </div>
            </div>
            <button class="bt" onclick="startNewMeeting(null, 'اجتماع الشركة العام', true)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);"><i class="fa fa-users"></i> بدء اجتماع</button>
        </div>
        `;
        
        usersSnap.forEach(doc => {
            if(doc.id !== TG_USER.uid) { // Don't include self
                var data = doc.data();
                var roleName = data.role === 'admin' ? 'الإدارة' : (data.role === 'tech_admin' ? 'دعم فني' : 'موظف');
                
                var lastActive = data.lastActive ? data.lastActive.toDate() : null;
                var isOnline = false;
                
                if (lastActive) {
                    var diffMs = Date.now() - lastActive.getTime();
                    if (diffMs < 120000) { // Active in last 2 mins
                        isOnline = true;
                    }
                }
                
                var statusLabel = isOnline ? 'متصل الآن' : (lastActive ? 'نشط ' + getRelativeTimeArabic(lastActive) : 'غير متصل');
                var dotColor = isOnline ? '#10b981' : '#9ca3af';
                var badgeBg = isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)';
                
                var initial = (data.name || '?').trim().slice(0, 1);
                
                html += `
                <div style="background:var(--bg2); border:1px solid var(--bd); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:10px; box-shadow:var(--sh-sm); transition:all 0.2s;">
                    <!-- Right side: Avatar and Name -->
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-transform:uppercase;">
                            ${initial}
                        </div>
                        <div>
                            <div style="font-weight:bold; color:var(--tx); font-size:14px;">
                                👤 ${data.name}
                            </div>
                            <div style="font-size:11px; color:var(--tx2); margin-top:2px;">
                                ${roleName}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Left side: Status badge and Call Button -->
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span style="font-size:11px; padding:4px 10px; border-radius:20px; background:${badgeBg}; color:${dotColor}; font-weight:bold; display:inline-flex; align-items:center; gap:5px;">
                            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${dotColor};"></span>
                            ${statusLabel}
                        </span>
                        <button class="bt" onclick="startNewMeeting('${doc.id}', '${data.name}', false)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);"><i class="fa fa-phone"></i> بدء مكالمة</button>
                    </div>
                </div>
                `;
            }
        });
        listContainer.innerHTML = html;
    }, function(e) {
        console.error("Error loading users for calls:", e);
        listContainer.innerHTML = '<div style="color:var(--no); padding:10px;">فشل في تحميل قائمة الموظفين.</div>';
    });
};
"""

# Replace in app.js
start_idx = js.find('function getRelativeTimeArabic(date) {')
end_idx = js.find('window.startNewMeeting = async function')
if start_idx != -1 and end_idx != -1:
    js = js[:start_idx] + new_load_users_ui + "\n" + js[end_idx:]
    print("app.js updated with premium card layout!")
else:
    print("Could not find the target range in app.js.")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete!")
