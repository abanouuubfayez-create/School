import re

# 1. Add selectEmpMeetingModal to index.html and employee.html
modal_html = """<!-- Modal for selecting specific employees for a targeted meeting -->
<div id="selectEmpMeetingModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:99999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(5px); font-family:inherit;">
    <div style="background:var(--bg2); border:1px solid var(--bd); border-radius:16px; width:90%; max-width:550px; padding:25px; box-shadow:0 10px 30px rgba(0,0,0,0.3); max-height:85vh; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--bd); padding-bottom:12px;">
            <h3 style="margin:0; font-size:16px; color:var(--tx);"><i class="fa fa-user-plus" style="color:var(--ok); margin-left:6px;"></i> تحديد الموظفين المشاركين في الاجتماع</h3>
            <button onclick="closeSelectEmpMeetingModal()" style="background:none; border:none; color:var(--tx2); font-size:18px; cursor:pointer;"><i class="fa fa-times"></i></button>
        </div>
        
        <div style="margin-bottom:15px;">
            <label style="font-size:12px; font-weight:bold; color:var(--tx2); display:block; margin-bottom:5px;">موضوع أو عنوان الاجتماع:</label>
            <input type="text" id="targetMeetingTopicInput" placeholder="مثال: اجتماع فريق المبيعات والتسويق" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--bd); background:var(--bg); color:var(--tx); font-family:inherit;">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:12px; font-weight:bold; color:var(--tx);">اختر الموظفين المطلوب دعوتهم:</span>
            <div>
                <button onclick="selectAllMeetingEmps(true)" style="background:none; border:none; color:var(--ok); font-size:11px; cursor:pointer; font-weight:bold; margin-left:8px;">تحديد الكل</button>
                <button onclick="selectAllMeetingEmps(false)" style="background:none; border:none; color:var(--no); font-size:11px; cursor:pointer;">إلغاء الكل</button>
            </div>
        </div>

        <div id="selectEmpMeetingList" style="flex:1; overflow-y:auto; padding-right:5px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px; max-height:280px;">
            <!-- Employees with checkboxes rendered dynamically -->
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button onclick="closeSelectEmpMeetingModal()" style="background:var(--bg); border:1px solid var(--bd); color:var(--tx2); padding:9px 18px; border-radius:8px; cursor:pointer; font-size:13px;">إلغاء</button>
            <button onclick="startTargetedGroupMeeting()" style="background:var(--ok); color:#fff; border:none; padding:9px 22px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-play"></i> بدء الاجتماع ورنين الموظفين</button>
        </div>
    </div>
</div>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

if 'id="selectEmpMeetingModal"' not in idx_html:
    idx_html = idx_html.replace('</body>', modal_html + '\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(idx_html)
    print("selectEmpMeetingModal added to index.html!")

with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

if 'id="selectEmpMeetingModal"' not in emp_html:
    emp_html = emp_html.replace('</body>', modal_html + '\n</body>')
    with open('employee.html', 'w', encoding='utf-8') as f:
        f.write(emp_html)
    print("selectEmpMeetingModal added to employee.html!")


# 2. Update app.js (switch to meet.ffmuc.net to remove 5min disconnect limit & add targeted meeting logic)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace startJitsiMeeting to use meet.ffmuc.net without 5-minute disconnect limits
old_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    var wrapper = adminContainer || empContainer;
    
    var headerAdmin = document.getElementById('callStatusHeaderAdmin');
    var headerEmp = document.getElementById('callStatusHeaderEmp');
    var header = headerAdmin || headerEmp;
    if(header) header.innerHTML = `<i class="fa fa-video-camera" style="color:var(--ok); margin-left:6px;"></i> مكالمة نشطة: ${subject}`;
    
    _currentRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;
    
    var openBtnAdmin = document.getElementById('openJitsiDirectBtnAdmin');
    var openBtnEmp = document.getElementById('openJitsiDirectBtnEmp');
    if(openBtnAdmin) openBtnAdmin.href = _currentRoomUrl;
    if(openBtnEmp) openBtnEmp.href = _currentRoomUrl;
    
    var innerAdmin = document.getElementById('jitsiAdminInner');
    var innerEmp = document.getElementById('jitsiEmpInner');
    var inner = innerAdmin || innerEmp;
    
    if(inner) {
        inner.innerHTML = `<iframe src="${_currentRoomUrl}" allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen" style="width:100%; height:520px; border:none; border-radius:12px;"></iframe>`;
    }
    
    if(wrapper) {
        wrapper.style.display = 'block';
        setTimeout(() => {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    try {
        _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');
        if(_jitsiWindowRef) _jitsiWindowRef.focus();
    } catch(e) {}
};"""

new_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    var wrapper = adminContainer || empContainer;
    
    var headerAdmin = document.getElementById('callStatusHeaderAdmin');
    var headerEmp = document.getElementById('callStatusHeaderEmp');
    var header = headerAdmin || headerEmp;
    if(header) header.innerHTML = `<i class="fa fa-video-camera" style="color:var(--ok); margin-left:6px;"></i> مكالمة نشطة: ${subject}`;
    
    // Use meet.ffmuc.net to eliminate 5-minute disconnect warnings and demo limits!
    _currentRoomUrl = `https://meet.ffmuc.net/${roomName}#config.prejoinPageEnabled=false`;
    
    var openBtnAdmin = document.getElementById('openJitsiDirectBtnAdmin');
    var openBtnEmp = document.getElementById('openJitsiDirectBtnEmp');
    if(openBtnAdmin) openBtnAdmin.href = _currentRoomUrl;
    if(openBtnEmp) openBtnEmp.href = _currentRoomUrl;
    
    var innerAdmin = document.getElementById('jitsiAdminInner');
    var innerEmp = document.getElementById('jitsiEmpInner');
    var inner = innerAdmin || innerEmp;
    
    if(inner) {
        inner.innerHTML = `<iframe src="${_currentRoomUrl}" allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen" style="width:100%; height:520px; border:none; border-radius:12px;"></iframe>`;
    }
    
    if(wrapper) {
        wrapper.style.display = 'block';
        setTimeout(() => {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    try {
        _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');
        if(_jitsiWindowRef) _jitsiWindowRef.focus();
    } catch(e) {}
};"""

js = js.replace(old_start_jitsi, new_start_jitsi)


# Add helper functions for targeted meeting modal
targeted_meeting_helpers = """
window._availableUsersForMeeting = [];

window.openSelectEmpMeetingModal = function() {
    var modal = document.getElementById('selectEmpMeetingModal');
    var listContainer = document.getElementById('selectEmpMeetingList');
    var topicInput = document.getElementById('targetMeetingTopicInput');
    
    if(topicInput) topicInput.value = '';
    if(!modal || !listContainer) return;
    
    var html = '';
    if(window._lastUsersSnap) {
        window._lastUsersSnap.forEach(doc => {
            if(doc.id !== TG_USER.uid) {
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
    
    var participantUids = [TG_USER.uid];
    var participantNames = [TG_USER.displayName || TG_USER.name || "الأدمن"];
    
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
            createdBy: TG_USER.uid,
            createdByName: TG_USER.displayName || TG_USER.name || "مستخدم",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'calling'
        };
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Send Push Notifications to targeted participants
        participantUids.forEach(uid => {
            if(uid !== TG_USER.uid && typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(uid, "🎥 دعوة لاجتماع مخصص", `تمت دعوتك لاجتماع: ${topic} بواسطة ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        });
        
        startJitsiMeeting(roomName, topic, true);
        
    } catch(e) {
        console.error("Error starting targeted meeting:", e);
        alert("حدث خطأ أثناء إطلاق الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};
"""

if 'window.openSelectEmpMeetingModal' not in js:
    js = targeted_meeting_helpers + "\n" + js

# Update renderUsersList top group row to include both 'اجتماع عام' and 'اجتماع مخصص'
old_group_row = """    <!-- Group Call Row -->
    <div style="background:var(--bg2); border:1px solid var(--bd); padding:15px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:15px; box-shadow:var(--sh-sm);">
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">🏢</div>
            <div>
                <div style="font-weight:bold; color:var(--tx); font-size:14px;">الشركة بأكملها (اجتماع عام)</div>
                <div style="font-size:11px; color:var(--tx2); margin-top:2px;">بدء اجتماع مباشر لجميع موظفي الشركة</div>
            </div>
        </div>
        <button class="bt" onclick="startNewMeeting(null, 'اجتماع الشركة العام', true)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);"><i class="fa fa-users"></i> بدء اجتماع</button>
    </div>"""

new_group_row = """    <!-- Group Call Header Rows -->
    <div style="background:var(--bg2); border:1px solid var(--bd); padding:15px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:12px; box-shadow:var(--sh-sm);">
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">🏢</div>
            <div>
                <div style="font-weight:bold; color:var(--tx); font-size:14px;">الشركة بأكملها (اجتماع عام)</div>
                <div style="font-size:11px; color:var(--tx2); margin-top:2px;">بدء اجتماع عام موجه لكل موظفي الشركة</div>
            </div>
        </div>
        <button class="bt" onclick="startNewMeeting(null, 'اجتماع الشركة العام', true)" style="background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);"><i class="fa fa-globe"></i> بدء اجتماع عام</button>
    </div>
    
    <div style="background:var(--bg2); border:1px solid var(--ok); padding:15px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:15px; box-shadow:var(--sh-sm);">
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:50%; background:var(--ok); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;">👥</div>
            <div>
                <div style="font-weight:bold; color:var(--tx); font-size:14px;">اجتماع لموظفين مخصصين (فريق عمل)</div>
                <div style="font-size:11px; color:var(--tx2); margin-top:2px;">اختيار موظفين محددين ورنين هواتفهم للانضمام</div>
            </div>
        </div>
        <button class="bt" onclick="openSelectEmpMeetingModal()" style="background:#3b82f6 !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(59,130,246,0.2);"><i class="fa fa-user-plus"></i> تحديد موظفين الاجتماع</button>
    </div>"""

js = js.replace(old_group_row, new_group_row)

# Update initMeetingsListener to handle targeted group meetings permissions & ringing
old_participant_check = """            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isGroup = data.isGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            var isParticipant = isCreator || isTarget || isGroup || isAdmin;"""

new_participant_check = """            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isTargetedGroup = data.isTargetedGroup && Array.isArray(data.participantUids);
            var isInvitedInGroup = isTargetedGroup ? data.participantUids.includes(TG_USER.uid) : false;
            var isGroup = data.isGroup && !isTargetedGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            var isParticipant = isCreator || isTarget || isGroup || isInvitedInGroup || isAdmin;"""

js = js.replace(old_participant_check, new_participant_check)

old_ringing_check = """            // Ringing logic: only ring if target, not creator, status is calling, and we are NOT currently in a call!
            if(isTarget && !isCreator && data.status === 'calling' && !_currentMeetingId && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {
                 var modal = document.getElementById('incomingMeetingModal');
                 if(modal && modal.style.display !== 'flex') {
                     modal.style.display = 'flex';
                     playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                 }
            }"""

new_ringing_check = """            // Ringing logic: ring if target OR invited in targeted group call, not creator, status is calling, and NOT currently in call!
            var shouldRing = (isTarget || isInvitedInGroup) && !isCreator && (data.status === 'calling');
            if(shouldRing && !_currentMeetingId && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {
                 var modal = document.getElementById('incomingMeetingModal');
                 if(modal && modal.style.display !== 'flex') {
                     modal.style.display = 'flex';
                     playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                 }
            }"""

js = js.replace(old_ringing_check, new_ringing_check)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js updated with meet.ffmuc.net server and targeted group meeting features!")
