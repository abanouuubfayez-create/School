import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

# We want to move jitsiAdminContainer from the bottom to the top of the pg-livemeeting card
# Let's see the original order:
# <div class="pg" id="pg-livemeeting">
#     <div class="card p-4">
#         <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
#         <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
#         
#         <!-- Active Meetings -->
#         ...
#         <!-- Start New Call -->
#         ...
#         <!-- Container -->
#         <div id="jitsiAdminContainer" ...>...</div>
#     </div>
# </div>

# Let's extract jitsiAdminContainer
admin_cnt_pattern = re.compile(r'<div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative; margin-top:20px;">.*?</div>\s*</div>\s*</div>\s*(?=<div class="pg" id="pg-wkreports">)', re.DOTALL)
# Wait, the closing of jitsiAdminContainer in index.html is:
# </div>\n</div>\n</div>
# Let's inspect index.html bottom of pg-livemeeting.
# 339:         <div id="jitsiAdminContainer" ...>
# 340:             ...
# 341:         </div>
# 342:     </div>
# 343: </div>

# Let's read index.html around line 324-345.
# Let's do a safe string replacement for the layout of pg-livemeeting:
old_pg_meeting_block = """<div class="pg" id="pg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsListAdmin" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetListAdmin" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>

        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative; margin-top:20px;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>"""

# New layout with jitsiAdminContainer AT THE TOP (directly under description)
new_pg_meeting_block = """<div class="pg" id="pg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Call Screen Container (Placed at top for visibility) -->
        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:12px; display:none; overflow:hidden; position:relative; margin-top:15px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>

        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsListAdmin" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetListAdmin" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>
    </div>
</div>"""

idx_html = idx_html.replace(old_pg_meeting_block, new_pg_meeting_block)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html layout moved Jitsi screen to top!")


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

old_pg_meeting_block_emp = """<div class="emp-pg" id="epg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsListEmp" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetListEmp" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>

        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative; margin-top:20px;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>"""

new_pg_meeting_block_emp = """<div class="emp-pg" id="epg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Call Screen Container (Placed at top for visibility) -->
        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:12px; display:none; overflow:hidden; position:relative; margin-top:15px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no) !important; color:#fff !important; z-index:999; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>

        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsListEmp" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetListEmp" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>
    </div>
</div>"""

emp_html = emp_html.replace(old_pg_meeting_block_emp, new_pg_meeting_block_emp)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html layout moved Jitsi screen to top!")


# 3. Update app.js (meetings logic, scrolling, duplicate ringing, and emoji fix)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Let's replace the meetings_lines blocks in app.js with the updated ones
# We'll redefine meetings_lines to fix:
# - Emojis removed from statusLabel to avoid duplicate dots.
# - Stale calls ignored (older than 5 mins).
# - Rings prevented if _currentMeetingId is already active.
# - Smooth scrolling to wrapper when starting/joining.

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
    "        // Smoothly scroll the screen to the Jitsi meeting container",
    "        setTimeout(() => {",
    "            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });",
    "        }, 100);",
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
    "            // Ignore meetings older than 5 minutes to avoid stale ringing",
    "            var createdAt = data.createdAt ? data.createdAt.toDate() : null;",
    "            if(createdAt && (Date.now() - createdAt.getTime() > 300000)) {",
    "                return;",
    "            }",
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
    "                html += `<div style=\"background:var(--bg2); border:1px solid var(--ok); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid var(--ok);\">",
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
    "                // Ringing logic: only ring if target, not creator, status is calling, and we are NOT currently in a call!",
    "                if(isTarget && !isCreator && data.status === 'calling' && !_currentMeetingId && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {",
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
    "};",
    "",
    "function getRelativeTimeArabic(date) {",
    "    var seconds = Math.floor((new Date() - date) / 1000);",
    "    if (seconds < 60) return \"منذ ثوانٍ\";",
    "    var minutes = Math.floor(seconds / 60);",
    "    if (minutes < 60) return \"منذ \" + minutes + \" د\";",
    "    var hours = Math.floor(minutes / 60);",
    "    if (hours < 24) return \"منذ \" + hours + \" س\";",
    "    var days = Math.floor(hours / 24);",
    "    return \"منذ \" + days + \" يوم\";",
    "}",
    "",
    "window.loadUsersForCalls = function() {",
    "    var adminList = document.getElementById('callTargetListAdmin');",
    "    var empList = document.getElementById('callTargetListEmp');",
    "    var listContainer = adminList || empList;",
    "    ",
    "    if(!listContainer || !window.db) return;",
    "    ",
    "    if(window._callUsersUnsubscribe) {",
    "        window._callUsersUnsubscribe();",
    "    }",
    "    ",
    "    window._callUsersUnsubscribe = db.collection('users').onSnapshot(function(usersSnap) {",
    "        var html = `",
    "        <!-- Group Call Row -->",
    "        <div style=\"background:var(--bg2); border:1px solid var(--bd); padding:15px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:15px; box-shadow:var(--sh-sm);\">",
    "            <div style=\"display:flex; align-items:center; gap:12px;\">",
    "                <div style=\"width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:18px;\">🏢</div>",
    "                <div>",
    "                    <div style=\"font-weight:bold; color:var(--tx); font-size:14px;\">الشركة بأكملها (اجتماع عام)</div>",
    "                    <div style=\"font-size:11px; color:var(--tx2); margin-top:2px;\">بدء اجتماع مباشر لجميع موظفي الشركة</div>",
    "                </div>",
    "            </div>",
    "            <button class=\"bt\" onclick=\"startNewMeeting(null, 'اجتماع الشركة العام', true)\" style=\"background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);\"><i class=\"fa fa-users\"></i> بدء اجتماع</button>",
    "        </div>",
    "        `;",
    "        ",
    "        usersSnap.forEach(doc => {",
    "            if(doc.id !== TG_USER.uid) { // Don't include self",
    "                var data = doc.data();",
    "                var roleName = data.role === 'admin' ? 'الإدارة' : (data.role === 'tech_admin' ? 'دعم فني' : 'موظف');",
    "                ",
    "                var lastActive = data.lastActive ? data.lastActive.toDate() : null;",
    "                var isOnline = false;",
    "                ",
    "                if (lastActive) {",
    "                    var diffMs = Date.now() - lastActive.getTime();",
    "                    if (diffMs < 120000) { // Active in last 2 mins",
    "                        isOnline = true;",
    "                    }",
    "                }",
    "                ",
    "                // Emojis removed from statusLabel to avoid double dots next to CSS colored dots",
    "                var statusLabel = isOnline ? 'متصل الآن' : (lastActive ? 'نشط ' + getRelativeTimeArabic(lastActive) : 'غير متصل');",
    "                var dotColor = isOnline ? '#10b981' : '#9ca3af';",
    "                var badgeBg = isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)';",
    "                ",
    "                var initial = (data.name || '?').trim().slice(0, 1);",
    "                ",
    "                html += `",
    "                <div style=\"background:var(--bg2); border:1px solid var(--bd); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:10px; box-shadow:var(--sh-sm); transition:all 0.2s;\">",
    "                    <!-- Right side: Avatar and Name -->",
    "                    <div style=\"display:flex; align-items:center; gap:12px;\">",
    "                        <div style=\"width:40px; height:40px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-transform:uppercase;\">",
    "                            ${initial}",
    "                        </div>",
    "                        <div>",
    "                            <div style=\"font-weight:bold; color:var(--tx); font-size:14px;\">",
    "                                👤 ${data.name}",
    "                            </div>",
    "                            <div style=\"font-size:11px; color:var(--tx2); margin-top:2px;\">",
    "                                ${roleName}",
    "                            </div>",
    "                        </div>",
    "                    </div>",
    "                    ",
    "                    <!-- Left side: Status badge and Call Button -->",
    "                    <div style=\"display:flex; align-items:center; gap:15px;\">",
    "                        <span style=\"font-size:11px; padding:4px 10px; border-radius:20px; background:${badgeBg}; color:${dotColor}; font-weight:bold; display:inline-flex; align-items:center; gap:5px;\">",
    "                            <span style=\"display:inline-block; width:6px; height:6px; border-radius:50%; background:${dotColor};\"></span>",
    "                            ${statusLabel}",
    "                        </span>",
    "                        <button class=\"bt\" onclick=\"startNewMeeting('${doc.id}', '${data.name}', false)\" style=\"background:var(--ok) !important; color:#fff !important; font-size:12px; padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:6px; box-shadow:0 2px 5px rgba(16,185,129,0.2);\"><i class=\"fa fa-phone\"></i> بدء مكالمة</button>",
    "                    </div>",
    "                </div>",
    "                `;",
    "            }",
    "        });",
    "        listContainer.innerHTML = html;",
    "    }, function(e) {",
    "        console.error(\"Error loading users for calls:\", e);",
    "        listContainer.innerHTML = '<div style=\"color:var(--no); padding:10px;\">فشل في تحميل قائمة الموظفين.</div>';",
    "    });",
    "};"
]

new_meetings_logic = "\n".join(meetings_lines) + "\n"

# Let's replace startNewMeeting block in app.js
start_idx = js.find('function loadJitsiScript() {')
if start_idx == -1:
    start_idx = js.find('window.startNewMeeting = async function')

if start_idx != -1:
    js = js[:start_idx] + new_meetings_logic
    print("app.js updated successfully with aligned and deduplicated layout!")
else:
    print("Could not find startNewMeeting block in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Alignment script complete!")
