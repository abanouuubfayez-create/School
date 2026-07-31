import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

# Replace new_admin_cnt block back to the iframe structure
old_admin_cnt = """        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:1px solid var(--pr); border-radius:12px; padding:20px; text-align:center; margin-top:20px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size:40px; margin-bottom:15px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderAdmin" style="color:var(--tx); margin-bottom:10px;">جاري الاتصال...</h3>
            <p style="color:var(--tx2); font-size:14px; margin-bottom:20px;">تم فتح الاجتماع في نافذة مستقلة لتوفير أقصى جودة اتصال (مع تفعيل وضع الانتظار والموافقة التلقائي للضيوف).</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no); color:#fff;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

new_admin_cnt = """        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative; margin-top:20px;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>"""

idx_html = idx_html.replace(old_admin_cnt, new_admin_cnt)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html reverted to iframe layout!")


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Replace new_emp_cnt block back to the iframe structure
old_emp_cnt = """        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:1px solid var(--pr); border-radius:12px; padding:20px; text-align:center; margin-top:20px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size:40px; margin-bottom:15px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderEmp" style="color:var(--tx); margin-bottom:10px;">جاري الاتصال...</h3>
            <p style="color:var(--tx2); font-size:14px; margin-bottom:20px;">تم فتح الاجتماع في نافذة مستقلة لتوفير أقصى جودة اتصال (مع تفعيل وضع الانتظار والموافقة التلقائي للضيوف).</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no); color:#fff;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

new_emp_cnt = """        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative; margin-top:20px;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>"""

emp_html = emp_html.replace(old_emp_cnt, new_emp_cnt)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html reverted to iframe layout!")


# 3. Update app.js (meetings logic)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Define the updated meetings block using iframe on jitsi.belnet.be
meetings_lines = [
    "function loadJitsiScript() {",
    "    return new Promise((resolve, reject) => {",
    "        if (window.JitsiMeetExternalAPI) { resolve(); return; }",
    "        var script = document.createElement('script');",
    "        script.src = 'https://jitsi.belnet.be/external_api.js';",
    "        script.onload = () => resolve();",
    "        script.onerror = (e) => reject(e);",
    "        document.head.appendChild(script);",
    "    });",
    "}",
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
    "window.startJitsiMeeting = async function(roomName, subject, isCreator) {",
    "    var adminContainer = document.getElementById('jitsiAdminContainer');",
    "    var empContainer = document.getElementById('jitsiEmpContainer');",
    "    var container = adminContainer ? document.getElementById('jitsiAdminInner') : document.getElementById('jitsiEmpInner');",
    "    var wrapper = adminContainer || empContainer;",
    "    ",
    "    if(wrapper) {",
    "        wrapper.style.display = 'block';",
    "    }",
    "    ",
    "    await loadJitsiScript();",
    "    ",
    "    if(_jitsiApi) {",
    "        _jitsiApi.dispose();",
    "    }",
    "    ",
    "    var domain = 'jitsi.belnet.be';",
    "    var displayName = TG_USER.displayName || TG_USER.name || \"مستخدم\";",
    "    ",
    "    var options = {",
    "        roomName: roomName,",
    "        width: '100%',",
    "        height: '100%',",
    "        parentNode: container,",
    "        userInfo: {",
    "            displayName: displayName",
    "        },",
    "        configOverwrite: {",
    "            startWithAudioMuted: false,",
    "            startWithVideoMuted: false,",
    "            subject: subject,",
    "            prejoinPageEnabled: false,",
    "            disableDeepLinking: true",
    "        },",
    "        interfaceConfigOverwrite: {",
    "            SHOW_JITSI_WATERMARK: false,",
    "            SHOW_BRAND_WATERMARK: false,",
    "            TOOLBAR_BUTTONS: [",
    "                'microphone', 'camera', 'desktop', 'fullscreen',",
    "                'hangup', 'chat', 'raisehand', 'tileview'",
    "            ]",
    "        }",
    "    };",
    "    ",
    "    _jitsiApi = new JitsiMeetExternalAPI(domain, options);",
    "    ",
    "    _jitsiApi.addEventListener('participantRoleChanged', function(event) {",
    "        if (event.role === 'moderator' && isCreator) {",
    "            _jitsiApi.executeCommand('toggleLobby', true);",
    "        }",
    "    });",
    "    ",
    "    _jitsiApi.addEventListeners({",
    "        videoConferenceLeft: function() {",
    "            endCall();",
    "        }",
    "    });",
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
    "    if(_jitsiApi) {",
    "        _jitsiApi.dispose();",
    "        _jitsiApi = null;",
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
    "};",
    "",
    "var _meetingListenerInit = false;",
    "window.initMeetingsListener = function() {",
    "    if(_meetingListenerInit || !window.db) return;",
    "    _meetingListenerInit = true;",
    "    ",
    "    db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {",
    "        var adminList = document.getElementById('activeMeetingsListAdmin');",
    "        var empList = document.getElementById('activeMeetingsListEmp');",
    "        var listContainer = adminList || empList;",
    "        ",
    "        if(!listContainer) return;",
    "        ",
    "        var hasActive = false;",
    "        var html = '';",
    "        ",
    "        snap.forEach(function(doc) {",
    "            var data = doc.data();",
    "            ",
    "            var isCreator = data.createdBy === TG_USER.uid;",
    "            var isTarget = data.targetUid === TG_USER.uid;",
    "            var isGroup = data.isGroup;",
    "            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');",
    "            ",
    "            if(isCreator || isTarget || isGroup || isAdmin) {",
    "                hasActive = true;",
    "                ",
    "                var title = data.isGroup ? `اجتماع جماعي: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;",
    "                var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : (isTarget ? `مكالمة من: ${data.createdByName}` : `مكالمة إلى: ${data.targetName}`);",
    "                var statusText = (data.status === 'calling') ? '📞 جاري الرنين...' : '🟢 مباشر الآن';",
    "                ",
    "                var endBtn = '';",
    "                if(isCreator || isAdmin) {",
    "                    endBtn = `<button class=\"bt\" onclick=\"endCallDirectly('${doc.id}')\" style=\"background:var(--no) !important; color:#fff !important; font-size:13px; margin-right:5px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-stop\"></i> إنهاء</button>`;",
    "                }",
    "                ",
    "                var joinBtn = '';",
    "                // Hide 'Join' button for the caller if they are already in the call locally",
    "                if (!(isCreator && _currentMeetingId === doc.id)) {",
    "                    joinBtn = `<button class=\"bt\" onclick=\"joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}', ${isCreator})\" style=\"background:var(--ok) !important; color:#fff !important; font-size:13px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;\"><i class=\"fa fa-sign-in\"></i> انضمام للمكالمة</button>`;",
    "                }",
    "                ",
    "                html += `<div style=\"background:var(--bg2); border:1px solid var(--ok); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);\">",
    "                    <div>",
    "                        <div style=\"font-weight:bold; color:var(--tx); font-size:15px;\"><span style=\"color:var(--ok); font-size:10px; margin-left:5px;\">${statusText}</span> ${title}</div>",
    "                        <div style=\"font-size:12px; color:var(--tx2);\">${subtitle}</div>",
    "                    </div>",
    "                    <div style=\"display:flex; gap:5px;\">",
    "                        ${joinBtn}",
    "                        ${endBtn}",
    "                    </div>",
    "                </div>`;",
    "                ",
    "                if(isTarget && !isCreator && data.status === 'calling' && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {",
    "                     var modal = document.getElementById('incomingMeetingModal');",
    "                     if(modal && modal.style.display !== 'flex') {",
    "                         modal.style.display = 'flex';",
    "                         playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);",
    "                     }",
    "                }",
    "            }",
    "        });",
    "        ",
    "        if(!hasActive) {",
    "            listContainer.innerHTML = '<div style=\"color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;\">لا توجد اجتماعات أو مكالمات نشطة حالياً.</div>';",
    "        } else {",
    "            listContainer.innerHTML = html;",
    "        }",
    "    });",
    "};"
]

new_meetings_logic = "\n".join(meetings_lines) + "\n"

# Replace meetings block in app.js
start_idx = js.find('window.startNewMeeting = async function')
if start_idx != -1:
    js = js[:start_idx] + new_meetings_logic
    print("app.js updated successfully with embedded Jitsi layout!")
else:
    print("Could not find startNewMeeting in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
