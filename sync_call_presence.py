import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Define the new sync presence logic and rendering functions
new_sync_presence_code = """window._activeCallUsers = new Set();
window._lastUsersSnap = null;

window.renderUsersList = function(usersSnap) {
    var adminList = document.getElementById('callTargetListAdmin');
    var empList = document.getElementById('callTargetListEmp');
    var listContainer = adminList || empList;
    
    if(!listContainer || !usersSnap) return;
    
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
            var isInCall = window._activeCallUsers.has(doc.id);
            
            if (lastActive) {
                var diffMs = Date.now() - lastActive.getTime();
                if (diffMs < 120000) { // Active in last 2 mins
                    isOnline = true;
                }
            }
            
            var statusLabel = 'غير متصل';
            var dotColor = '#9ca3af';
            var badgeBg = 'rgba(156,163,175,0.1)';
            
            if (isInCall) {
                statusLabel = 'في مكالمة الآن';
                dotColor = '#3b82f6'; // Professional blue for active calls
                badgeBg = 'rgba(59,130,246,0.1)';
            } else if (isOnline) {
                statusLabel = 'متصل الآن';
                dotColor = '#10b981'; // Green
                badgeBg = 'rgba(16,185,129,0.1)';
            } else if (lastActive) {
                statusLabel = 'نشط ' + getRelativeTimeArabic(lastActive);
                dotColor = '#9ca3af';
                badgeBg = 'rgba(156,163,175,0.1)';
            }
            
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
};

window.loadUsersForCalls = function() {
    if(!window.db) return;
    
    if(window._callUsersUnsubscribe) {
        window._callUsersUnsubscribe();
    }
    
    window._callUsersUnsubscribe = db.collection('users').onSnapshot(function(usersSnap) {
        window._lastUsersSnap = usersSnap;
        window.renderUsersList(usersSnap);
    }, function(e) {
        console.error("Error loading users for calls:", e);
        var adminList = document.getElementById('callTargetListAdmin');
        var empList = document.getElementById('callTargetListEmp');
        var listContainer = adminList || empList;
        if(listContainer) {
            listContainer.innerHTML = '<div style="color:var(--no); padding:10px;">فشل في تحميل قائمة الموظفين.</div>';
        }
    });
};
"""

# Let's replace getRelativeTimeArabic and loadUsersForCalls functions in app.js
start_rel_time = js.find('function getRelativeTimeArabic(date) {')
end_load_users = js.find('window.loadUsersForCalls = function() {')

if start_rel_time != -1 and end_load_users != -1:
    # We find the end of loadUsersForCalls block
    end_block_idx = js.find('};', end_load_users) + 2
    # Let's construct the replaced code
    # We will replace from start_rel_time to end_block_idx with the new sync presence code and a clean getRelativeTimeArabic
    rel_time_and_sync = """function getRelativeTimeArabic(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "منذ ثوانٍ";
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return "منذ " + minutes + " د";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return "منذ " + hours + " س";
    var days = Math.floor(hours / 24);
    return "منذ " + days + " يوم";
}

""" + new_sync_presence_code
    js = js[:start_rel_time] + rel_time_and_sync + js[end_block_idx:]
    print("Replaced users presence and load list successfully in app.js!")
else:
    print("Could not find getRelativeTimeArabic or loadUsersForCalls in app.js. Trying alternative match.")


# Now let's update initMeetingsListener in app.js to populate _activeCallUsers and re-render users list
# Let's inspect initMeetingsListener inside app.js
# We need to find:
# db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {
#     var adminList = ...
#     ...
#     snap.forEach(function(doc) {
#         var data = doc.data();

new_listener_loop = """    db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {
        var adminList = document.getElementById('activeMeetingsListAdmin');
        var empList = document.getElementById('activeMeetingsListEmp');
        var listContainer = adminList || empList;
        
        if(!listContainer) return;
        
        // Reset active call users set
        window._activeCallUsers.clear();
        
        var hasActive = false;
        var html = '';
        
        snap.forEach(function(doc) {
            var data = doc.data();
            
            // Ignore meetings older than 5 minutes to avoid stale ringing
            var createdAt = data.createdAt ? data.createdAt.toDate() : null;
            if(createdAt && (Date.now() - createdAt.getTime() > 300000)) {
                return;
            }
            
            // Track active participants
            if (data.createdBy) window._activeCallUsers.add(data.createdBy);
            if (data.targetUid) window._activeCallUsers.add(data.targetUid);
            
            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isGroup = data.isGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            
            if(isCreator || isTarget || isGroup || isAdmin) {
                hasActive = true;
                
                var title = data.isGroup ? `اجتماع جماعي: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;
                var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : (isTarget ? `مكالمة من: ${data.createdByName}` : `مكالمة إلى: ${data.targetName}`);
                var statusText = (data.status === 'calling') ? '📞 جاري الرنين...' : '🟢 مباشر الآن';
                
                var endBtn = '';
                if(isCreator || isAdmin) {
                    endBtn = `<button class="bt" onclick="endCallDirectly('${doc.id}')" style="background:var(--no) !important; color:#fff !important; font-size:13px; margin-right:5px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء</button>`;
                }
                
                var joinBtn = '';
                // Hide 'Join' button for the caller if they are already in the call locally
                if (!(isCreator && _currentMeetingId === doc.id)) {
                    joinBtn = `<button class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}', ${isCreator})" style="background:var(--ok) !important; color:#fff !important; font-size:13px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-sign-in"></i> انضمام للمكالمة</button>`;
                }
                
                html += `<div style="background:var(--bg2); border:1px solid var(--ok); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid var(--ok);">
                    <div>
                        <div style="font-weight:bold; color:var(--tx); font-size:15px;"><span style="color:var(--ok); font-size:10px; margin-left:5px;">${statusText}</span> ${title}</div>
                        <div style="font-size:12px; color:var(--tx2);">${subtitle}</div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        ${joinBtn}
                        ${endBtn}
                    </div>
                </div>`;
                
                // Ringing logic: only ring if target, not creator, status is calling, and we are NOT currently in a call!
                if(isTarget && !isCreator && data.status === 'calling' && !_currentMeetingId && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {
                     var modal = document.getElementById('incomingMeetingModal');
                     if(modal && modal.style.display !== 'flex') {
                         modal.style.display = 'flex';
                         playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                     }
                }
            }
        });
        
        if(!hasActive) {
            listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;">لا توجد اجتماعات أو مكالمات نشطة حالياً.</div>';
        } else {
            listContainer.innerHTML = html;
        }
        
        // Re-render user status badges in real-time based on the updated window._activeCallUsers
        if (typeof window.renderUsersList === 'function' && window._lastUsersSnap) {
            window.renderUsersList(window._lastUsersSnap);
        }
    });"""

listener_start = js.find("db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {")
if listener_start != -1:
    # We find the end of initMeetingsListener block
    end_listener_idx = js.find('    });', listener_start) + 7
    js = js[:listener_start] + new_listener_loop + js[end_listener_idx:]
    print("initMeetingsListener successfully updated to push real-time user presence!")
else:
    print("Could not find initMeetingsListener in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete presence sync script!")
