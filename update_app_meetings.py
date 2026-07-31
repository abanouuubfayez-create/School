import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the whole live meeting section from "// ==================== LIVE MEETING LOGIC (JITSI) ===================="
# to the end of that block.
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
var _isGroupCall = false;

window.openStartCallModal = async function(isGroup) {
    _isGroupCall = isGroup;
    var modal = document.getElementById('startCallModal');
    var selectContainer = document.getElementById('callEmpSelectContainer');
    var select = document.getElementById('callTargetEmp');
    
    if(!isGroup) {
        selectContainer.style.display = 'block';
        select.innerHTML = '<option value="">-- جارٍ تحميل قائمة الموظفين --</option>';
        try {
            var usersSnap = await db.collection('users').get();
            var html = '<option value="">-- اختر الموظف --</option>';
            usersSnap.forEach(doc => {
                if(doc.id !== TG_USER.uid) { // Don't include self
                    var data = doc.data();
                    html += `<option value="${doc.id}">${data.name} (${data.role === 'admin' ? 'إدارة' : 'موظف'})</option>`;
                }
            });
            select.innerHTML = html;
        } catch(e) {
            console.error("Error loading users for calls:", e);
            select.innerHTML = '<option value="">فشل في تحميل الموظفين</option>';
        }
    } else {
        selectContainer.style.display = 'none';
        select.innerHTML = '';
    }
    
    document.getElementById('callTopic').value = '';
    modal.style.display = 'flex';
};

window.confirmStartCall = async function() {
    var targetEmpId = null;
    var targetEmpName = "";
    
    if(!_isGroupCall) {
        var select = document.getElementById('callTargetEmp');
        targetEmpId = select.value;
        if(!targetEmpId) {
            alert("الرجاء اختيار الموظف أولاً.");
            return;
        }
        targetEmpName = select.options[select.selectedIndex].text;
    }
    
    var topic = document.getElementById('callTopic').value || (_isGroupCall ? "اجتماع جماعي" : "مكالمة فردية");
    
    document.getElementById('startCallModal').style.display = 'none';
    
    var roomName = "TechGo_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    
    try {
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: _isGroupCall,
            createdBy: TG_USER.uid,
            createdByName: TG_USER.displayName || TG_USER.name || "مستخدم",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        };
        
        if(!_isGroupCall) {
            meetingData.targetUid = targetEmpId;
            meetingData.targetName = targetEmpName;
        }
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Notify targeted employees
        if(!_isGroupCall) {
            tgSendNotification(targetEmpId, "📞 مكالمة واردة", `مكالمة واردة من ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
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
        alert("حدث خطأ أثناء محاولة بدء الاجتماع.");
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
                
                html += `<div style="background:var(--bg2); border:1px solid var(--bd); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <div style="font-weight:bold; color:var(--tx);">${title}</div>
                        <div style="font-size:12px; color:var(--tx2);">${subtitle}</div>
                    </div>
                    <button class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}')" style="background:var(--ok); color:#fff;"><i class="fa fa-sign-in"></i> انضمام</button>
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
            listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px;">لا توجد اجتماعات أو مكالمات نشطة حالياً.</div>';
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
    }
};

"""

if old_logic_pattern.search(js):
    js = old_logic_pattern.sub(new_logic, js)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("app.js updated successfully!")
else:
    print("Could not find the old live meeting logic pattern in app.js")
