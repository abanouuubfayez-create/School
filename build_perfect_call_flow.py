import re

# 1. Add outgoingMeetingModal to index.html and employee.html
outgoing_modal_html = """<!-- Outgoing Call Modal (For Caller) -->
<div id="outgoingMeetingModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.95); z-index:999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(8px); font-family:inherit;">
    <div style="text-align:center; margin-bottom:30px;">
        <div style="width:110px; height:110px; background:var(--gd); border-radius:50%; display:flex; justify-content:center; align-items:center; margin:0 auto 20px; box-shadow:0 0 35px var(--gd); animation:pulseRinging 1.5s infinite;">
            <span style="font-size:45px;">📞</span>
        </div>
        <h2 id="outgoingCallStatusText" style="color:#fff; margin-bottom:8px; font-size:24px;">جاري الاتصال...</h2>
        <p id="outgoingTargetNameText" style="color:var(--gd); font-size:18px; font-weight:bold; margin-bottom:15px;">جاري الرنين على الموظف...</p>
        <p style="color:rgba(255,255,255,0.7); font-size:13px;">يرجى الانتظار لحين موافقة الطرف الآخر على الانضمام</p>
    </div>
    
    <div style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center;">
        <a id="outgoingDirectRoomLink" href="#" target="_blank" style="background:#10b981; color:#fff; text-decoration:none; padding:12px 28px; border-radius:50px; font-size:15px; font-weight:bold; box-shadow:0 5px 15px rgba(16,185,129,0.4); display:inline-flex; align-items:center; gap:8px;">
            <span>🎥</span> دخول الغرفة مباشرة ↗
        </a>
        <button type="button" onclick="cancelOutgoingCall()" style="background:#ef4444; color:#fff; border:none; border-radius:50px; padding:12px 28px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 5px 15px rgba(239,68,68,0.4); display:inline-flex; align-items:center; gap:8px;">
            <span>✖</span> إلغاء الاتصال
        </button>
    </div>
</div>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

if 'id="outgoingMeetingModal"' not in idx_html:
    idx_html = idx_html.replace('</body>', outgoing_modal_html + '\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(idx_html)
    print("outgoingMeetingModal added to index.html!")

with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

if 'id="outgoingMeetingModal"' not in emp_html:
    emp_html = emp_html.replace('</body>', outgoing_modal_html + '\n</body>')
    with open('employee.html', 'w', encoding='utf-8') as f:
        f.write(emp_html)
    print("outgoingMeetingModal added to employee.html!")


# 2. Update acceptMeetingCall in index.html and employee.html to open tab immediately during physical click
old_accept = """        function acceptMeetingCall() {
            var modal = document.getElementById('incomingMeetingModal');
            if(modal) modal.style.display = 'none';
            stopMeetingRinging();
            
            if(window._incomingCallData) {
                if(typeof empGo === 'function') {
                    var tab = document.querySelector('.emp-tab[data-pg="livemeeting"]');
                    if(tab) empGo('livemeeting', tab);
                } else if(typeof go === 'function') {
                    go('livemeeting');
                }
                
                setTimeout(function() {
                    joinCall(window._incomingCallData.meetingId, window._incomingCallData.roomName, window._incomingCallData.topic);
                }, 500);
            }
        }"""

new_accept = """        function acceptMeetingCall() {
            var modal = document.getElementById('incomingMeetingModal');
            if(modal) modal.style.display = 'none';
            stopMeetingRinging();
            
            if(window._incomingCallData) {
                var roomUrl = `https://meet.jit.si/${window._incomingCallData.roomName}#config.prejoinPageEnabled=false`;
                
                // Open tab immediately on physical click event to bypass popup blockers
                try {
                    var win = window.open(roomUrl, 'TG_JitsiCallWindow');
                    if(win) win.focus();
                } catch(e) {}
                
                if(typeof empGo === 'function') {
                    var tab = document.querySelector('.emp-tab[data-pg="livemeeting"]');
                    if(tab) empGo('livemeeting', tab);
                } else if(typeof go === 'function') {
                    go('livemeeting');
                }
                
                joinCall(window._incomingCallData.meetingId, window._incomingCallData.roomName, window._incomingCallData.topic);
            }
        }"""

with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()
idx_html = idx_html.replace(old_accept, new_accept)
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)

with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()
emp_html = emp_html.replace(old_accept, new_accept)
with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)

print("acceptMeetingCall updated in HTML files!")


# 3. Update app.js (startNewMeeting, cancelOutgoingCall, and meeting state listener)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

calling_logic = """
window.cancelOutgoingCall = function() {
    var modal = document.getElementById('outgoingMeetingModal');
    if(modal) modal.style.display = 'none';
    
    if(window._currentMeetingId && window.db) {
        db.collection('meetings').doc(window._currentMeetingId).update({
            status: 'ended',
            endedReason: 'cancelled_by_caller'
        }).catch(function(e){});
        window._currentMeetingId = null;
    }
};

window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var myName = (window.TG_USER && (TG_USER.displayName || TG_USER.name)) ? (TG_USER.displayName || TG_USER.name) : "مستخدم";

    // 1. Busy check: Prevent calling if target or self is already in a call
    if(!isGroup && targetEmpId) {
        if (window._activeCallUsers && window._activeCallUsers.has(targetEmpId)) {
            alert(`❌ الموظف (${targetEmpName}) في مكالمة أخرى حالياً. يرجى المحاولة لاحقاً.`);
            return;
        }
        if (window._currentMeetingId) {
            alert(`❌ أنت في مكالمة بالفعل حالياً. يرجى إنهاء المكالمة الحالية أولاً.`);
            return;
        }
    }
    
    var topic = isGroup ? "اجتماع جماعي" : `مكالمة فردية مع ${targetEmpName}`;
    var roomName = "TechGo_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    var roomUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;

    // Immediately open tab on user physical click to bypass popup blocker!
    var callWin = null;
    try {
        callWin = window.open(roomUrl, 'TG_JitsiCallWindow');
        if(callWin) callWin.focus();
        _jitsiWindowRef = callWin;
    } catch(e) {}

    try {
        // Auto-end any old stuck calls between these two users before starting a new one
        if (!isGroup && window.db) {
            try {
                var oldSnap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
                oldSnap.forEach(function(oldDoc) {
                    var d = oldDoc.data();
                    if ((d.createdBy === myUid && d.targetUid === targetEmpId) ||
                        (d.createdBy === targetEmpId && d.targetUid === myUid)) {
                        db.collection('meetings').doc(oldDoc.id).update({ status: 'ended' }).catch(function(){});
                    }
                });
            } catch(err) {}
        }
        
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: isGroup,
            createdBy: myUid,
            createdByName: myName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: isGroup ? 'active' : 'calling'
        };
        
        if(!isGroup) {
            meetingData.targetUid = targetEmpId;
            meetingData.targetName = targetEmpName;
        }
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        if(!isGroup) {
            // Show Outgoing Call Modal for Caller
            var outModal = document.getElementById('outgoingMeetingModal');
            var outText = document.getElementById('outgoingCallStatusText');
            var outTarget = document.getElementById('outgoingTargetNameText');
            var outLink = document.getElementById('outgoingDirectRoomLink');
            
            if(outText) outText.innerText = "جاري الاتصال...";
            if(outTarget) outTarget.innerText = `📞 جاري الرنين على: ${targetEmpName}`;
            if(outLink) outLink.href = roomUrl;
            if(outModal) outModal.style.display = 'flex';
            
            // Listen for status changes (accepted / rejected / ended)
            if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
            window._callStatusUnsubscribe = db.collection('meetings').doc(_currentMeetingId).onSnapshot(function(doc) {
                if(!doc.exists) return;
                var d = doc.data();
                
                if(d.status === 'active') {
                    if(outText) outText.innerText = "🟢 تم قبول المكالمة!";
                    setTimeout(function() {
                        if(outModal) outModal.style.display = 'none';
                    }, 1200);
                } else if(d.status === 'rejected') {
                    if(outText) outText.innerText = "❌ تم رفض المكالمة من قبل الموظف.";
                    setTimeout(function() {
                        if(outModal) outModal.style.display = 'none';
                        endCall();
                    }, 2000);
                } else if(d.status === 'ended') {
                    if(outText) outText.innerText = "❌ تم إنهاء المكالمة.";
                    setTimeout(function() {
                        if(outModal) outModal.style.display = 'none';
                        endCall();
                    }, 1500);
                }
            });
            
            if(typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(targetEmpId, "📞 مكالمة واردة", `مكالمة واردة من ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        } else {
            if(window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin')) {
                if(typeof tgBroadcastPush === 'function') {
                    tgBroadcastPush('🎥 اجتماع مباشر', `يوجد اجتماع جماعي الآن: ${topic}. يرجى الانضمام.`, 'livemeeting', '');
                }
            }
        }
        
        startJitsiMeeting(roomName, topic, true);
        
    } catch(e) {
        console.error("Error creating meeting:", e);
        alert("حدث خطأ أثناء محاولة بدء الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};
"""

start_pos = js.find("window.startNewMeeting = async function")
end_pos = js.find("window.startJitsiMeeting = function")

if start_pos != -1 and end_pos != -1:
    js = js[:start_pos] + calling_logic + "\n\n" + js[end_pos:]
    print("app.js calling logic updated with Outgoing Call Modal & instant tab opening!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Complete!")
