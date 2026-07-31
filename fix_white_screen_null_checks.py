import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace unguarded TG_USER in openSelectEmpMeetingModal and startTargetedGroupMeeting
old_targeted_helpers = """window._availableUsersForMeeting = [];

window.openSelectEmpMeetingModal = function() {
    var modal = document.getElementById('selectEmpMeetingModal');
    var listContainer = document.getElementById('selectEmpMeetingList');
    var topicInput = document.getElementById('targetMeetingTopicInput');
    
    if(topicInput) topicInput.value = '';
    if(!modal || !listContainer) return;
    
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var html = '';
    
    if(window._lastUsersSnap) {
        window._lastUsersSnap.forEach(doc => {
            if(doc.id !== myUid) {
                var d = doc.data();
                var roleName = d.role === 'admin' ? 'الإدارة' : (d.role === 'tech_admin' ? 'دعم فني' : 'موظف');
                var isOnline = false;
                var lastActive = d.lastActive ? d.lastActive.toDate() : null;
                if(lastActive && (Date.now() - lastActive.getTime() < 180000)) isOnline = true;
                if(window._activeCallUsers && window._activeCallUsers.has(doc.id)) isOnline = true;
                
                var statusBadge = isOnline ? '<span style="color:#10b981; font-size:11px; margin-right:auto;">🟢 متصل</span>' : '<span style="color:#9ca3af; font-size:11px; margin-right:auto;">🔴 غير متصل</span>';
                
                html += `
                <label style="display:flex; align-items:center; gap:10px; background:var(--bg); border:1px solid var(--bd); padding:10px; border-radius:8px; cursor:pointer; transition:background 0.2s;">
                    <input type="checkbox" class="emp-select-chk" value="${doc.id}" data-name="${d.name || d.displayName || 'موظف'}" style="width:18px; height:18px; accent-color:var(--ok);">
                    <div style="font-weight:bold; font-size:13px; color:var(--tx);">${d.name || d.displayName || 'موظف'} <span style="font-size:11px; color:var(--tx2); font-weight:normal;">(${roleName})</span></div>
                    ${statusBadge}
                </label>
                `;
            }
        });
    }
    
    if(!html) {
        html = '<div style="text-align:center; color:var(--tx2); padding:15px;">لا يوجد موظفون آخرون مسجلون في النظام حالياً.</div>';
    }
    
    listContainer.innerHTML = html;
    modal.style.display = 'flex';
};

window.closeSelectEmpMeetingModal = function() {
    var modal = document.getElementById('selectEmpMeetingModal');
    if(modal) modal.style.display = 'none';
};

window.selectAllMeetingEmps = function(select) {
    var chks = document.querySelectorAll('.emp-select-chk');
    chks.forEach(chk => chk.checked = select);
};

window.startTargetedGroupMeeting = async function() {
    var chks = document.querySelectorAll('.emp-select-chk:checked');
    if(chks.length === 0) {
        alert("يرجى اختيار موظف واحد على الأقل للبدء في الاجتماع.");
        return;
    }
    
    var topicInput = document.getElementById('targetMeetingTopicInput');
    var topic = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : "اجتماع فريق مخصص";
    
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var myName = (window.TG_USER && (TG_USER.displayName || TG_USER.name)) ? (TG_USER.displayName || TG_USER.name) : "الأدمن";
    
    var participantUids = [myUid];
    var participantNames = [myName];
    
    chks.forEach(chk => {
        participantUids.push(chk.value);
        participantNames.push(chk.getAttribute('data-name'));
    });
    
    closeSelectEmpMeetingModal();
    
    var roomName = "TechGo_Group_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    
    try {
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: true,
            isTargetedGroup: true,
            participantUids: participantUids,
            participantNames: participantNames,
            createdBy: myUid,
            createdByName: myName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'calling'
        };
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Send Push Notifications to targeted participants
        participantUids.forEach(uid => {
            if(uid !== myUid && typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(uid, "🎥 دعوة لاجتماع مخصص", `تمت دعوتك لاجتماع: ${topic} بواسطة ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        });
        
        startJitsiMeeting(roomName, topic, true);
        
    } catch(e) {
        console.error("Error starting targeted meeting:", e);
        alert("حدث خطأ أثناء إطلاق الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};"""

start_pos = js.find("window._availableUsersForMeeting = [];")
end_pos = js.find("var _jitsiWindowRef = null;")

if start_pos != -1 and end_pos != -1:
    js = js[:start_pos] + old_targeted_helpers + "\n\n" + js[end_pos:]
    print("Safely replaced TG_USER references at top of app.js!")
else:
    print("Could not match bounds for TG_USER replacement in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete!")
