import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replacement block for initMeetingsListener loop in app.js
new_listener_code = """    db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {
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
            
            // Track active participants for real-time status badges in employee list
            if (data.createdBy) window._activeCallUsers.add(data.createdBy);
            if (data.targetUid) window._activeCallUsers.add(data.targetUid);
            
            hasActive = true; // Mark that an active call exists in the company
            
            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isGroup = data.isGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            var isParticipant = isCreator || isTarget || isGroup || isAdmin;
            
            var title = data.isGroup ? `اجتماع جماعي: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;
            var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : `مكالمة بين: ${data.createdByName} و ${data.targetName || 'موظف'}`;
            var statusText = (data.status === 'calling') ? '📞 جاري الرنين...' : '🟢 مباشر الآن';
            
            var endBtn = '';
            if(isCreator || isAdmin) {
                endBtn = `<button class="bt" onclick="endCallDirectly('${doc.id}')" style="background:var(--no) !important; color:#fff !important; font-size:13px; margin-right:5px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء</button>`;
            }
            
            var joinBtn = '';
            if (isParticipant) {
                // Hide 'Join' button for the caller if they are already in the call locally
                if (!(isCreator && _currentMeetingId === doc.id)) {
                    joinBtn = `<button class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}', ${isCreator})" style="background:var(--ok) !important; color:#fff !important; font-size:13px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-sign-in"></i> انضمام للمكالمة</button>`;
                }
            } else {
                // Private 1-on-1 call badge for non-participant employees
                joinBtn = `<span style="background:rgba(156,163,175,0.15); color:var(--tx2); font-size:12px; padding:5px 12px; border-radius:5px; font-weight:bold;"><i class="fa fa-lock"></i> مكالمة ثنائية خاصة</span>`;
            }
            
            html += `<div style="background:var(--bg2); border:1px solid ${isParticipant ? 'var(--ok)' : 'var(--bd)'}; padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid ${isParticipant ? 'var(--ok)' : 'var(--tx2)'};">
                <div>
                    <div style="font-weight:bold; color:var(--tx); font-size:15px;"><span style="color:${isParticipant ? 'var(--ok)' : 'var(--tx2)'}; font-size:10px; margin-left:5px;">${statusText}</span> ${title}</div>
                    <div style="font-size:12px; color:var(--tx2);">${subtitle}</div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
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
        });
        
        if(!hasActive) {
            listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;">لا توجد اجتماعات أو مكالمات نشطة حالياً في الشركة.</div>';
        } else {
            listContainer.innerHTML = html;
        }
        
        // Re-render user status badges in real-time based on the updated window._activeCallUsers
        if (typeof window.renderUsersList === 'function' && window._lastUsersSnap) {
            window.renderUsersList(window._lastUsersSnap);
        }
    });
};"""

start_pos = js.find("db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {")
end_pos = js.find("function getRelativeTimeArabic(date) {")

if start_pos != -1 and end_pos != -1:
    js = js[:start_pos] + new_listener_code + "\n\n" + js[end_pos:]
    print("app.js initMeetingsListener updated successfully!")
else:
    print("Could not find start or end pos in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete!")
