import re
import os

def update_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace the buttons container and active meetings container with the new layout
    old_meeting_pg = re.search(r'<div class="(?:pg|emp-pg)" id="(?:pg-livemeeting|epg-livemeeting)">.*?<div id="jitsi(?:Admin|Emp)Container"', html, re.DOTALL)
    
    if old_meeting_pg:
        is_admin = 'pg-livemeeting' in old_meeting_pg.group(0)
        prefix = 'Admin' if is_admin else 'Emp'
        pg_class = 'pg' if is_admin else 'emp-pg'
        pg_id = 'pg-livemeeting' if is_admin else 'epg-livemeeting'
        
        new_layout = f"""<div class="{pg_class}" id="{pg_id}">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsList{prefix}" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetList{prefix}" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>

        <div id="jitsi{prefix}Container\""""
        
        html = html.replace(old_meeting_pg.group(0), new_layout)
    
    # Remove the startCallModal
    modal_regex = re.compile(r'<!-- Call Modal -->.*?</div>\n</div>\n', re.DOTALL)
    html = modal_regex.sub('', html)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)


update_html('index.html')
update_html('employee.html')

# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_logic_pattern = re.compile(r'// ==================== LIVE MEETING LOGIC \(JITSI\) ====================.*?(?=(// ==================== [A-Z ]+ ====================|$))', re.DOTALL)

new_logic = """// ==================== LIVE MEETING LOGIC (JITSI) ====================
function loadJitsiScript() {
    return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        var script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

var _jitsiApi = null;
var _currentMeetingId = null;

window.loadUsersForCalls = async function() {
    var adminList = document.getElementById('callTargetListAdmin');
    var empList = document.getElementById('callTargetListEmp');
    var listContainer = adminList || empList;
    
    if(!listContainer || !window.db) return;
    
    try {
        var usersSnap = await db.collection('users').get();
        var html = `
        <div style="background:var(--bg2); border:1px solid var(--bd); padding:12px 15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <div style="font-weight:bold; color:var(--tx); font-size:14px;">🏢 الشركة بأكملها (اجتماع عام)</div>
                <div style="font-size:11px; color:var(--tx2);">بدء اجتماع مباشر لجميع موظفي الشركة</div>
            </div>
            <button class="bt" onclick="startNewMeeting(null, 'اجتماع الشركة العام', true)" style="background:var(--ok); color:#fff; font-size:12px; padding:6px 12px;"><i class="fa fa-users"></i> بدء اجتماع</button>
        </div>
        `;
        
        usersSnap.forEach(doc => {
            if(doc.id !== TG_USER.uid) { // Don't include self
                var data = doc.data();
                var roleName = data.role === 'admin' ? 'الإدارة' : (data.role === 'tech_admin' ? 'دعم فني' : 'موظف');
                html += `
                <div style="background:var(--bg2); border:1px solid var(--bd); padding:10px 15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <div style="font-weight:bold; color:var(--tx); font-size:14px;">👤 ${data.name}</div>
                        <div style="font-size:11px; color:var(--tx2);">${roleName}</div>
                    </div>
                    <button class="bt bt-o" onclick="startNewMeeting('${doc.id}', '${data.name}', false)" style="border-color:var(--pr); color:var(--pr); font-size:12px; padding:6px 12px;"><i class="fa fa-phone"></i> بدء مكالمة</button>
                </div>
                `;
            }
        });
        listContainer.innerHTML = html;
    } catch(e) {
        console.error("Error loading users for calls:", e);
        listContainer.innerHTML = '<div style="color:var(--no); padding:10px;">فشل في تحميل قائمة الموظفين.</div>';
    }
};

window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {
    var topic = isGroup ? "اجتماع جماعي" : `مكالمة فردية مع ${targetEmpName}`;
    var roomName = "TechGo_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    
    try {
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: isGroup,
            createdBy: TG_USER.uid,
            createdByName: TG_USER.displayName || TG_USER.name || "مستخدم",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        if(!isGroup) {
            meetingData.targetUid = targetEmpId;
            meetingData.targetName = targetEmpName;
        }
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Notify targeted employees
        if(!isGroup) {
            if(typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(targetEmpId, "📞 مكالمة واردة", `مكالمة واردة من ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        } else {
            // Group call - send broadcast if it's admin
            if(TG_USER.role === 'admin' || TG_USER.role === 'tech_admin') {
                if(typeof tgBroadcastPush === 'function') {
                    tgBroadcastPush('🎥 اجتماع مباشر', `يوجد اجتماع جماعي الآن: ${topic}. يرجى الانضمام.`, 'livemeeting', '');
                }
            }
        }
        
        startJitsiMeeting(roomName, topic);
        
    } catch(e) {
        console.error("Error creating meeting:", e);
        alert("حدث خطأ أثناء محاولة بدء الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};

window.startJitsiMeeting = async function(roomName, subject) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    
    var container = adminContainer ? document.getElementById('jitsiAdminInner') : document.getElementById('jitsiEmpInner');
    var wrapper = adminContainer || empContainer;
    
    if(wrapper) wrapper.style.display = 'block';
    
    await loadJitsiScript();
    
    if(_jitsiApi) {
        _jitsiApi.dispose();
    }
    
    var domain = 'meet.jit.si';
    var options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
            displayName: TG_USER.displayName || TG_USER.name || "مستخدم"
        },
        configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            subject: subject
        }
    };
    
    _jitsiApi = new JitsiMeetExternalAPI(domain, options);
    
    _jitsiApi.addEventListeners({
        videoConferenceLeft: function() {
            endCall();
        }
    });
};

window.joinCall = async function(meetingId, roomName, topic) {
    _currentMeetingId = meetingId;
    startJitsiMeeting(roomName, topic);
};

window.endCall = async function() {
    if(_jitsiApi) {
        _jitsiApi.dispose();
        _jitsiApi = null;
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
};

// Listen to active meetings
var _meetingListenerInit = false;
window.initMeetingsListener = function() {
    if(_meetingListenerInit || !window.db) return;
    _meetingListenerInit = true;
    
    db.collection('meetings').where('status', '==', 'active').onSnapshot(function(snap) {
        var adminList = document.getElementById('activeMeetingsListAdmin');
        var empList = document.getElementById('activeMeetingsListEmp');
        var listContainer = adminList || empList;
        
        if(!listContainer) return;
        
        var hasActive = false;
        var html = '';
        
        snap.forEach(function(doc) {
            var data = doc.data();
            
            // Check if user is allowed to see this meeting
            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isGroup = data.isGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            
            if(isCreator || isTarget || isGroup || isAdmin) {
                hasActive = true;
                
                var title = data.isGroup ? `مكالمة جماعية: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;
                var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : (isTarget ? `مكالمة من: ${data.createdByName}` : `مكالمة إلى: ${data.targetName}`);
                
                html += `<div style="background:var(--bg2); border:1px solid var(--ok); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);">
                    <div>
                        <div style="font-weight:bold; color:var(--tx); font-size:15px;"><span style="color:var(--ok); font-size:10px; margin-left:5px;">⏺ مباشر</span> ${title}</div>
                        <div style="font-size:12px; color:var(--tx2);">${subtitle}</div>
                    </div>
                    <button class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}')" style="background:var(--ok); color:#fff; font-size:13px;"><i class="fa fa-sign-in"></i> انضمام للمكالمة</button>
                </div>`;
                
                // Ringing logic for incoming individual calls
                if(isTarget && !isCreator && typeof playMeetingRinging === 'function' && !window._meetingJoined) {
                     var modal = document.getElementById('incomingMeetingModal');
                     if(modal && modal.style.display !== 'flex') {
                         modal.style.display = 'flex';
                         playMeetingRinging();
                     }
                }
            }
        });
        
        if(!hasActive) {
            listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;">لا توجد اجتماعات أو مكالمات نشطة حالياً.</div>';
        } else {
            listContainer.innerHTML = html;
        }
    });
};

// Initialize the meetings listener when the livemeeting page is opened
var oldGo = window.go;
window.go = function(id, el) {
    if(oldGo) oldGo(id, el);
    if(id === 'livemeeting') {
        initMeetingsListener();
        loadUsersForCalls();
    }
};

"""

if old_logic_pattern.search(js):
    js = old_logic_pattern.sub(new_logic, js)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Files updated successfully!")
else:
    print("Could not find the old live meeting logic pattern in app.js")

