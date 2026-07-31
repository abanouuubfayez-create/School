import re

# 1. Update firestore.rules to allow targetUid to update meetings
with open('firestore.rules', 'r', encoding='utf-8') as f:
    rules = f.read()

old_meeting_rule = """    // إدارة الاجتماعات (المكالمات)
    match /meetings/{meetingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isAnyAdmin() || (isSignedIn() && resource.data.createdBy == myUid());
    }"""

new_meeting_rule = """    // إدارة الاجتماعات (المكالمات)
    match /meetings/{meetingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAnyAdmin() || (isSignedIn() && (resource.data.createdBy == myUid() || resource.data.targetUid == myUid()));
      allow delete: if isAnyAdmin() || (isSignedIn() && resource.data.createdBy == myUid());
    }"""

rules = rules.replace(old_meeting_rule, new_meeting_rule)

with open('firestore.rules', 'w', encoding='utf-8') as f:
    f.write(rules)
print("firestore.rules updated to allow targetUid update permissions!")


# 2. Update index.html and employee.html layout for active call card
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

old_admin_cnt = """        <!-- Call Screen Container (Placed at top for visibility) -->
        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:12px; display:none; overflow:hidden; position:relative; margin-top:15px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>"""

new_admin_cnt = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:45px; margin-bottom:12px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderAdmin" style="color:var(--tx); margin-bottom:8px; font-size:18px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:13px; margin-bottom:20px;">تم فتح الاجتماع في نافذة عالية الجودة وتوفير أقصى نقاء للصوت والصورة.</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> إظهار / إعادة فتح نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

idx_html = idx_html.replace(old_admin_cnt, new_admin_cnt)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html active call control card updated!")


with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

old_emp_cnt = """        <!-- Call Screen Container (Placed at top for visibility) -->
        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:12px; display:none; overflow:hidden; position:relative; margin-top:15px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>"""

new_emp_cnt = """        <!-- Active Call Control Dashboard Card -->
        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:25px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15); transition:all 0.3s;">
            <div style="font-size:45px; margin-bottom:12px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderEmp" style="color:var(--tx); margin-bottom:8px; font-size:18px; font-weight:bold;">المكالمة نشطة الآن</h3>
            <p style="color:var(--tx2); font-size:13px; margin-bottom:20px;">تم فتح الاجتماع في نافذة عالية الجودة وتوفير أقصى نقاء للصوت والصورة.</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(16,185,129,0.3);"><i class="fa fa-external-link"></i> إظهار / إعادة فتح نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no) !important; color:#fff !important; border:none; padding:10px 22px; border-radius:10px; font-weight:bold; cursor:pointer; font-size:13px; box-shadow:0 3px 10px rgba(239,68,68,0.3);"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

emp_html = emp_html.replace(old_emp_cnt, new_emp_cnt)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html active call control card updated!")


# 3. Update app.js (meetings logic, popups, and window reference)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

meetings_lines = [
    "var _jitsiWindowRef = null;",
    "var _currentRoomUrl = '';",
    "",
    "window.reopenJitsiWindow = function() {",
    "    if(_currentRoomUrl) {",
    "        _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');",
    "        if(_jitsiWindowRef) _jitsiWindowRef.focus();",
    "    }",
    "};",
    "",
    "window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {",
    "    var topic = isGroup ? \"اجتماع جماعي\" : `مكالمة فردية مع ${targetEmpName}`;",
    "    var roomName = \"TechGo_\" + Date.now() + \"_\" + Math.floor(Math.random()*1000);",
    "    ",
    "    try {",
    "        var meetingData = {",
    "            roomName: roomName,",
    "            topic: topic,",
    "            isGroup: isGroup,",
    "            createdBy: TG_USER.uid,",
    "            createdByName: TG_USER.displayName || TG_USER.name || \"مستخدم\",",
    "            createdAt: firebase.firestore.FieldValue.serverTimestamp(),",
    "            status: isGroup ? 'active' : 'calling'",
    "        };",
    "        ",
    "        if(!isGroup) {",
    "            meetingData.targetUid = targetEmpId;",
    "            meetingData.targetName = targetEmpName;",
    "        }",
    "        ",
    "        var meetingRef = await db.collection('meetings').add(meetingData);",
    "        _currentMeetingId = meetingRef.id;",
    "        ",
    "        if(!isGroup) {",
    "            if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }",
    "            window._callStatusUnsubscribe = db.collection('meetings').doc(_currentMeetingId).onSnapshot(function(doc) {",
    "                if(!doc.exists) return;",
    "                var d = doc.data();",
    "                ",
    "                if(d.status === 'rejected') {",
    "                    alert(\"تم رفض المكالمة من قبل الطرف الآخر.\");",
    "                    endCall();",
    "                } else if(d.status === 'ended') {",
    "                    endCall();",
    "                }",
    "            });",
    "        }",
    "        ",
    "        if(!isGroup) {",
    "            if(typeof tgSendPushToUser === 'function') {",
    "                tgSendPushToUser(targetEmpId, \"📞 مكالمة واردة\", `مكالمة واردة من ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');",
    "            }",
    "        } else {",
    "            if(TG_USER.role === 'admin' || TG_USER.role === 'tech_admin') {",
    "                if(typeof tgBroadcastPush === 'function') {",
    "                    tgBroadcastPush('🎥 اجتماع مباشر', `يوجد اجتماع جماعي الآن: ${topic}. يرجى الانضمام.`, 'livemeeting', '');",
    "                }",
    "            }",
    "        }",
    "        ",
    "        startJitsiMeeting(roomName, topic, true);",
    "        ",
    "    } catch(e) {",
    "        console.error(\"Error creating meeting:\", e);",
    "        alert(\"حدث خطأ أثناء محاولة بدء الاجتماع. يرجى المحاولة مرة أخرى.\");",
    "    }",
    "};",
    "",
    "window.startJitsiMeeting = function(roomName, subject, isCreator) {",
    "    var adminContainer = document.getElementById('jitsiAdminContainer');",
    "    var empContainer = document.getElementById('jitsiEmpContainer');",
    "    var wrapper = adminContainer || empContainer;",
    "    ",
    "    var headerAdmin = document.getElementById('callStatusHeaderAdmin');",
    "    var headerEmp = document.getElementById('callStatusHeaderEmp');",
    "    var header = headerAdmin || headerEmp;",
    "    if(header) header.innerText = `📞 مكالمة نشطة: ${subject}`;",
    "    ",
    "    if(wrapper) {",
    "        wrapper.style.display = 'block';",
    "        setTimeout(() => {",
    "            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });",
    "        }, 100);",
    "    }",
    "    ",
    "    _currentRoomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;",
    "    _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');",
    "    if(_jitsiWindowRef) _jitsiWindowRef.focus();",
    "};",
    "",
    "window.joinCall = async function(meetingId, roomName, topic, isCreator) {",
    "    _currentMeetingId = meetingId;",
    "    ",
    "    if(!isCreator && window.db) {",
    "        db.collection('meetings').doc(meetingId).update({",
    "            status: 'active'",
    "        }).catch(function(e){console.error(e)});",
    "    }",
    "    ",
    "    if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }",
    "    window._callStatusUnsubscribe = db.collection('meetings').doc(meetingId).onSnapshot(function(doc) {",
    "        if(!doc.exists) return;",
    "        var d = doc.data();",
    "        if(d.status === 'ended') {",
    "            endCall();",
    "        } else if(d.status === 'rejected') {",
    "            endCall();",
    "        }",
    "    });",
    "    ",
    "    startJitsiMeeting(roomName, topic, isCreator);",
    "};",
    "",
    "window.endCall = async function() {",
    "    if(_jitsiWindowRef && !_jitsiWindowRef.closed) {",
    "        _jitsiWindowRef.close();",
    "        _jitsiWindowRef = null;",
    "    }",
    "    ",
    "    if(window._callStatusUnsubscribe) {",
    "        window._callStatusUnsubscribe();",
    "        window._callStatusUnsubscribe = null;",
    "    }",
    "    ",
    "    var adminContainer = document.getElementById('jitsiAdminContainer');",
    "    var empContainer = document.getElementById('jitsiEmpContainer');",
    "    ",
    "    if(adminContainer) adminContainer.style.display = 'none';",
    "    if(empContainer) empContainer.style.display = 'none';",
    "    ",
    "    if(_currentMeetingId && window.db) {",
    "        try {",
    "            await db.collection('meetings').doc(_currentMeetingId).update({",
    "                status: 'ended',",
    "                endedAt: firebase.firestore.FieldValue.serverTimestamp()",
    "            });",
    "        } catch(e) {",
    "            console.error(\"Error updating meeting status:\", e);",
    "        }",
    "        _currentMeetingId = null;",
    "    }",
    "};",
    "",
    "window.endCallDirectly = async function(meetingId) {",
    "    if(confirm(\"هل أنت متأكد من إنهاء وإغلاق هذه المكالمة؟\")) {",
    "        try {",
    "            await db.collection('meetings').doc(meetingId).update({",
    "                status: 'ended',",
    "                endedAt: firebase.firestore.FieldValue.serverTimestamp()",
    "            });",
    "            if(_currentMeetingId === meetingId) {",
    "                endCall();",
    "            }",
    "        } catch(e) {",
    "            console.error(\"Error ending meeting:\", e);",
    "        }",
    "    }",
    "};"
]

new_meetings_code = "\n".join(meetings_lines) + "\n"

start_pos = js.find("window.reopenJitsiWindow = function")
if start_pos == -1:
    start_pos = js.find("function loadJitsiScript()")
if start_pos == -1:
    start_pos = js.find("window.startNewMeeting = async function")

end_pos = js.find("var _meetingListenerInit = false;")

if start_pos != -1 and end_pos != -1:
    js = js[:start_pos] + new_meetings_code + "\n" + js[end_pos:]
    print("app.js updated with window.open Jitsi handler and clean call card!")
else:
    print("Could not match bounds in app.js!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete fix script!")
