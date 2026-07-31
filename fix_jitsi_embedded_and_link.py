import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

old_admin_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:45px; margin-bottom:12px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderAdmin" style="color:var(--tx); margin-bottom:8px; font-size:18px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:13px; margin-bottom:20px;">تم فتح الاجتماع في نافذة عالية الجودة وتوفير أقصى نقاء للصوت والصورة.</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> إظهار / إعادة فتح نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

new_admin_card = """        <!-- Active Call Control Dashboard Card -->
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

idx_html = idx_html.replace(old_admin_card, new_admin_card)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html card layout updated!")


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

old_emp_card = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:45px; margin-bottom:12px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderEmp" style="color:var(--tx); margin-bottom:8px; font-size:18px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:13px; margin-bottom:20px;">تم فتح الاجتماع في نافذة عالية الجودة وتوفير أقصى نقاء للصوت والصورة.</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> إظهار / إعادة فتح نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

new_emp_card = """        <!-- Active Call Control Dashboard Card -->
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

emp_html = emp_html.replace(old_emp_card, new_emp_card)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html card layout updated!")


# 3. Update app.js startJitsiMeeting and endCall
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    var wrapper = adminContainer || empContainer;
    
    var headerAdmin = document.getElementById('callStatusHeaderAdmin');
    var headerEmp = document.getElementById('callStatusHeaderEmp');
    var header = headerAdmin || headerEmp;
    if(header) header.innerText = `📞 مكالمة نشطة: ${subject}`;
    
    if(wrapper) {
        wrapper.style.display = 'block';
        setTimeout(() => {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    _currentRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;
    _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');
    if(_jitsiWindowRef) _jitsiWindowRef.focus();
};"""

new_start_jitsi = """window.startJitsiMeeting = function(roomName, subject, isCreator) {
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

js = js.replace(old_start_jitsi, new_start_jitsi)

old_end_call = """window.endCall = async function() {
    if(_jitsiWindowRef && !_jitsiWindowRef.closed) {
        _jitsiWindowRef.close();
        _jitsiWindowRef = null;
    }
    
    if(window._callStatusUnsubscribe) {
        window._callStatusUnsubscribe();
        window._callStatusUnsubscribe = null;
    }
    
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    
    if(adminContainer) adminContainer.style.display = 'none';
    if(empContainer) empContainer.style.display = 'none';"""

new_end_call = """window.endCall = async function() {
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
    if(empContainer) empContainer.style.display = 'none';"""

js = js.replace(old_end_call, new_end_call)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js startJitsiMeeting and endCall updated with embedded iframe and direct link!")
