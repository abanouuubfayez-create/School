import re

# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Let's write the complete loadUsersForCalls function with real-time status and getRelativeTimeArabic helper
# We'll replace window.loadUsersForCalls and adjust_alignment_and_clean elements

new_user_calls_logic = """function getRelativeTimeArabic(date) {
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
        <div style="background:var(--bg2); border:1px solid var(--bd); padding:12px 15px; border-radius:8px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px;">
            <div>
                <div style="font-weight:bold; color:var(--tx); font-size:14px;">🏢 الشركة بأكملها (اجتماع عام)</div>
                <div style="font-size:11px; color:var(--tx2);">بدء اجتماع مباشر لجميع موظفي الشركة</div>
            </div>
            <button class="bt" onclick="startNewMeeting(null, 'اجتماع الشركة العام', true)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:6px 12px; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-users"></i> بدء اجتماع</button>
        </div>
        `;
        
        usersSnap.forEach(doc => {
            if(doc.id !== TG_USER.uid) { // Don't include self
                var data = doc.data();
                var roleName = data.role === 'admin' ? 'الإدارة' : (data.role === 'tech_admin' ? 'دعم فني' : 'موظف');
                
                var lastActive = data.lastActive ? data.lastActive.toDate() : null;
                var statusLabel = '🔴 غير متصل';
                var dotColor = 'var(--no)';
                
                if (lastActive) {
                    var diffMs = Date.now() - lastActive.getTime();
                    if (diffMs < 120000) { // Active in the last 2 minutes
                        statusLabel = '🟢 متصل الآن';
                        dotColor = 'var(--ok)';
                    } else {
                        statusLabel = '⚪ نشط ' + getRelativeTimeArabic(lastActive);
                        dotColor = '#9ca3af';
                    }
                }
                
                html += `
                <div style="background:var(--bg2); border:1px solid var(--bd); padding:10px 15px; border-radius:8px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px;">
                    <div>
                        <div style="font-weight:bold; color:var(--tx); font-size:14px; display:flex; align-items:center; gap:8px;">
                            👤 ${data.name}
                            <span style="font-size:11px; padding:2px 8px; border-radius:12px; background:rgba(0,0,0,0.05); color:${dotColor}; font-weight:normal; display:inline-flex; align-items:center; gap:4px;">
                                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor};"></span>
                                ${statusLabel}
                            </span>
                        </div>
                        <div style="font-size:11px; color:var(--tx2);">${roleName}</div>
                    </div>
                    <button class="bt" onclick="startNewMeeting('${doc.id}', '${data.name}', false)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:6px 12px; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-phone"></i> بدء مكالمة</button>
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

# Replace window.loadUsersForCalls = async function ... up to startNewMeeting
old_load_users_pattern = re.compile(r'window\.loadUsersForCalls = async function\(\).*?\}\s*;\s*(?=window\.startNewMeeting =)', re.DOTALL)

if old_load_users_pattern.search(js):
    js = old_load_users_pattern.sub(new_user_calls_logic + "\n", js)
    print("loadUsersForCalls replaced with real-time status!")
else:
    # Alternative index fallback
    start_idx = js.find('window.loadUsersForCalls = async function')
    end_idx = js.find('window.startNewMeeting = async function')
    if start_idx != -1 and end_idx != -1:
        js = js[:start_idx] + new_user_calls_logic + "\n" + js[end_idx:]
        print("loadUsersForCalls replaced with index fallback!")
    else:
        print("Could not locate the loadUsersForCalls block.")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)


# 4. Update auth.js to write lastActive periodically
with open('auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

presence_script = """
    // Periodically update user online status
    function updatePresence() {
        if (window.db && firebase.auth().currentUser) {
            var uid = firebase.auth().currentUser.uid;
            db.collection('users').doc(uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(e) {});
        }
    }
    setTimeout(updatePresence, 3000);
    setInterval(updatePresence, 60000);
"""

# Append presence script inside firebase auth state changed listener, or simply at the end of auth.js
if "updatePresence" not in auth_js:
    auth_js = auth_js + presence_script
    print("auth.js updated with presence tracking!")
else:
    print("auth.js already has presence tracking.")

with open('auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
