import re

# 1. Update index.html and employee.html active call cards for sleek UI without iframe refusal
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

old_admin_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:20px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                <h3 id="callStatusHeaderAdmin" style="color:var(--tx); font-size:16px; font-weight:bold; margin:0;"><i class="fa fa-video-camera" style="color:var(--ok);"></i> المكالمة نشطة الآن</h3>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <a id="openJitsiDirectBtnAdmin" href="#" target="_blank" class="bt" style="background:#10b981 !important; color:#fff !important; text-decoration:none; padding:8px 18px; border-radius:8px; font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> فتح في نافذة كاملة</a>
                    <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
                </div>
            </div>
            <div id="jitsiAdminInner" style="width:100%; min-height:520px; background:#000; border-radius:12px; overflow:hidden;"></div>
        </div>"""

new_admin_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:42px; margin-bottom:10px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderAdmin" style="color:var(--tx); margin-bottom:6px; font-size:17px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:12px; margin-bottom:18px;">تم تشغيل الاجتماع بنجاح عبر سيرفر الفيديو عالي الدقة. اضغط للفتح أو الإنهاء.</p>
            <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                <a id="openJitsiDirectBtnAdmin" href="#" target="_blank" class="bt" style="background:#10b981 !important; color:#fff !important; text-decoration:none; padding:10px 22px; border-radius:10px; font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:8px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> فتح في نافذة كاملة</a>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
            <div id="jitsiAdminInner" style="display:none;"></div>
        </div>"""

idx_html = idx_html.replace(old_admin_card, new_admin_card)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html active call card updated!")


with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

old_emp_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:20px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                <h3 id="callStatusHeaderEmp" style="color:var(--tx); font-size:16px; font-weight:bold; margin:0;"><i class="fa fa-video-camera" style="color:var(--ok);"></i> المكالمة نشطة الآن</h3>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <a id="openJitsiDirectBtnEmp" href="#" target="_blank" class="bt" style="background:#10b981 !important; color:#fff !important; text-decoration:none; padding:8px 18px; border-radius:8px; font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> فتح في نافذة كاملة</a>
                    <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:8px 18px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
                </div>
            </div>
            <div id="jitsiEmpInner" style="width:100%; min-height:520px; background:#000; border-radius:12px; overflow:hidden;"></div>
        </div>"""

new_emp_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:42px; margin-bottom:10px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderEmp" style="color:var(--tx); margin-bottom:6px; font-size:17px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:12px; margin-bottom:18px;">تم تشغيل الاجتماع بنجاح عبر سيرفر الفيديو عالي الدقة. اضغط للفتح أو الإنهاء.</p>
            <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                <a id="openJitsiDirectBtnEmp" href="#" target="_blank" class="bt" style="background:#10b981 !important; color:#fff !important; text-decoration:none; padding:10px 22px; border-radius:10px; font-weight:bold; font-size:13px; display:inline-flex; align-items:center; gap:8px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> فتح في نافذة كاملة</a>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
            <div id="jitsiEmpInner" style="display:none;"></div>
        </div>"""

emp_html = emp_html.replace(old_emp_card, new_emp_card)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html active call card updated!")


# 2. Update app.js startJitsiMeeting and endCall
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
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

new_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    var wrapper = adminContainer || empContainer;
    
    var headerAdmin = document.getElementById('callStatusHeaderAdmin');
    var headerEmp = document.getElementById('callStatusHeaderEmp');
    var header = headerAdmin || headerEmp;
    if(header) header.innerHTML = `📞 مكالمة نشطة: ${subject}`;
    
    _currentRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;
    
    var openBtnAdmin = document.getElementById('openJitsiDirectBtnAdmin');
    var openBtnEmp = document.getElementById('openJitsiDirectBtnEmp');
    if(openBtnAdmin) openBtnAdmin.href = _currentRoomUrl;
    if(openBtnEmp) openBtnEmp.href = _currentRoomUrl;
    
    if(wrapper) {
        wrapper.setAttribute('style', 'display:block !important; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15);');
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


old_end_call = """window.endCall = async function() {
    if(_jitsiWindowRef && !_jitsiWindowRef.closed) {
        _jitsiWindowRef.close();
        _jitsiWindowRef = null;
    }
    
    var innerAdmin = document.getElementById('jitsiAdminInner');
    var innerEmp = document.getElementById('jitsiEmpInner');
    if(innerAdmin) innerAdmin.innerHTML = '';
    if(innerEmp) innerEmp.innerHTML = '';
    
    if(window._callStatusUnsubscribe) {
        window._callStatusUnsubscribe();
        window._callStatusUnsubscribe = null;
    }
    
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    
    if(adminContainer) adminContainer.style.display = 'none';
    if(empContainer) empContainer.style.display = 'none';
    
    if(_currentMeetingId && window.db) {
        try {
            await db.collection('meetings').doc(_currentMeetingId).update({
                status: 'ended',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) {
            console.error("Error updating meeting status:", e);
        }
        _currentMeetingId = null;
    }
};"""

new_end_call = """window.endCall = async function() {
    // 1. Instantly hide UI cards synchronously (0 delay, 100% guarantee)
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    if(adminContainer) {
        adminContainer.style.display = 'none';
        adminContainer.setAttribute('style', 'display:none !important;');
    }
    if(empContainer) {
        empContainer.style.display = 'none';
        empContainer.setAttribute('style', 'display:none !important;');
    }
    
    var innerAdmin = document.getElementById('jitsiAdminInner');
    var innerEmp = document.getElementById('jitsiEmpInner');
    if(innerAdmin) innerAdmin.innerHTML = '';
    if(innerEmp) innerEmp.innerHTML = '';
    
    // 2. Close window if open
    if(_jitsiWindowRef && !_jitsiWindowRef.closed) {
        try { _jitsiWindowRef.close(); } catch(e){}
        _jitsiWindowRef = null;
    }
    
    // 3. Unsubscribe listener
    if(window._callStatusUnsubscribe) {
        window._callStatusUnsubscribe();
        window._callStatusUnsubscribe = null;
    }
    
    // 4. Update Firestore status
    var meetingIdToEnd = _currentMeetingId;
    _currentMeetingId = null;
    
    if(meetingIdToEnd && window.db) {
        try {
            await db.collection('meetings').doc(meetingIdToEnd).update({
                status: 'ended',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) {
            console.error("Error updating meeting status:", e);
        }
    }
};"""

js = js.replace(old_end_call, new_end_call)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js endCall instant close logic updated!")
