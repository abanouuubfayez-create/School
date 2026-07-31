import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# New meeting handlers with auto-cleanup of previous calls & 45s timeout
new_meetings_code = """var _jitsiWindowRef = null;
var _currentRoomUrl = '';

window.reopenJitsiWindow = function() {
    if(_currentRoomUrl) {
        _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');
        if(_jitsiWindowRef) _jitsiWindowRef.focus();
    }
};

window.cleanupStuckMeetings = async function() {
    if(!window.db) return;
    try {
        var snap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
        snap.forEach(function(doc) {
            db.collection('meetings').doc(doc.id).update({ status: 'ended' }).catch(function(){});
        });
        if(typeof initMeetingsListener === 'function') {
            initMeetingsListener();
        }
    } catch(e) {
        console.error("Error cleaning up meetings:", e);
    }
};

window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {
    var topic = isGroup ? "اجتماع جماعي" : `مكالمة فردية مع ${targetEmpName}`;
    var roomName = "TechGo_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    
    try {
        // Auto-end any old calls between these two users before starting a new one
        if (!isGroup && window.db) {
            try {
                var oldSnap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
                oldSnap.forEach(function(oldDoc) {
                    var d = oldDoc.data();
                    if ((d.createdBy === TG_USER.uid && d.targetUid === targetEmpId) ||
                        (d.createdBy === targetEmpId && d.targetUid === TG_USER.uid)) {
                        db.collection('meetings').doc(oldDoc.id).update({ status: 'ended' }).catch(function(){});
                    }
                });
            } catch(err) {
                console.warn("Error cleaning old pair calls:", err);
            }
        }
        
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: isGroup,
            createdBy: TG_USER.uid,
            createdByName: TG_USER.displayName || TG_USER.name || "مستخدم",
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
            if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
            window._callStatusUnsubscribe = db.collection('meetings').doc(_currentMeetingId).onSnapshot(function(doc) {
                if(!doc.exists) return;
                var d = doc.data();
                
                if(d.status === 'rejected') {
                    alert("تم رفض المكالمة من قبل الطرف الآخر.");
                    endCall();
                } else if(d.status === 'ended') {
                    endCall();
                }
            });
        }
        
        if(!isGroup) {
            if(typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(targetEmpId, "📞 مكالمة واردة", `مكالمة واردة من ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        } else {
            if(TG_USER.role === 'admin' || TG_USER.role === 'tech_admin') {
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

window.startJitsiMeeting = function(roomName, subject, isCreator) {
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
};

window.joinCall = async function(meetingId, roomName, topic, isCreator) {
    _currentMeetingId = meetingId;
    
    if(!isCreator && window.db) {
        db.collection('meetings').doc(meetingId).update({
            status: 'active'
        }).catch(function(e){console.error(e)});
    }
    
    if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
    window._callStatusUnsubscribe = db.collection('meetings').doc(meetingId).onSnapshot(function(doc) {
        if(!doc.exists) return;
        var d = doc.data();
        if(d.status === 'ended') {
            endCall();
        } else if(d.status === 'rejected') {
            endCall();
        }
    });
    
    startJitsiMeeting(roomName, topic, isCreator);
};

window.endCall = async function() {
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

window.endCallDirectly = async function(meetingId) {
    if(confirm("هل أنت متأكد من إنهاء وإغلاق هذه المكالمة؟")) {
        try {
            await db.collection('meetings').doc(meetingId).update({
                status: 'ended',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            if(_currentMeetingId === meetingId) {
                endCall();
            }
        } catch(e) {
            console.error("Error ending meeting:", e);
        }
    }
};

var _meetingListenerInit = false;
window.initMeetingsListener = function() {
    if(_meetingListenerInit || !window.db) return;
    _meetingListenerInit = true;
    
    db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {
        var adminList = document.getElementById('activeMeetingsListAdmin');
        var empList = document.getElementById('activeMeetingsListEmp');
        var listContainer = adminList || empList;
        
        if(!listContainer) return;
        
        // Reset active call users set
        window._activeCallUsers.clear();
        
        var hasActive = false;
        var html = '';
        
        snap.forEach(function(doc) {
            var data = doc.data();
            var createdAt = data.createdAt ? data.createdAt.toDate() : null;
            
            // Auto-end unanswered calls after 45 seconds to avoid duplicate cards
            if (data.status === 'calling' && createdAt && (Date.now() - createdAt.getTime() > 45000)) {
                db.collection('meetings').doc(doc.id).update({ status: 'ended' }).catch(function(){});
                return;
            }
            
            // Ignore meetings older than 5 minutes
            if(createdAt && (Date.now() - createdAt.getTime() > 300000)) {
                return;
            }
            
            // Track active participants for real-time status badges in employee list
            if (data.createdBy) window._activeCallUsers.add(data.createdBy);
            if (data.targetUid) window._activeCallUsers.add(data.targetUid);
            
            // Hide from list if this is the CURRENT call user is already inside locally
            if (_currentMeetingId === doc.id) {
                return;
            }
            
            hasActive = true; // Mark that an active call exists in the company
            
            var isCreator = data.createdBy === TG_USER.uid;
            var isTarget = data.targetUid === TG_USER.uid;
            var isGroup = data.isGroup;
            var isAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
            var isParticipant = isCreator || isTarget || isGroup || isAdmin;
            
            var title = data.isGroup ? `اجتماع جماعي: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;
            var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : `مكالمة بين: ${data.createdByName} و ${data.targetName || 'موظف'}`;
            var statusText = (data.status === 'calling') ? '📞 جاري الرنين...' : '🟢 مباشر الآن';
            
            var endBtn = '';
            if(isCreator || isAdmin) {
                endBtn = `<button class="bt" onclick="endCallDirectly('${doc.id}')" style="background:var(--no) !important; color:#fff !important; font-size:13px; margin-right:5px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء</button>`;
            }
            
            var joinBtn = '';
            if (isParticipant) {
                joinBtn = `<button class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${data.topic || ''}', ${isCreator})" style="background:var(--ok) !important; color:#fff !important; font-size:13px; border:none; padding:5px 12px; border-radius:5px; cursor:pointer;"><i class="fa fa-sign-in"></i> انضمام للمكالمة</button>`;
            } else {
                joinBtn = `<span style="background:rgba(156,163,175,0.15); color:var(--tx2); font-size:12px; padding:5px 12px; border-radius:5px; font-weight:bold;"><i class="fa fa-lock"></i> مكالمة ثنائية خاصة</span>`;
            }
            
            html += `<div style="background:var(--bg2); border:1px solid ${isParticipant ? 'var(--ok)' : 'var(--bd)'}; padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid ${isParticipant ? 'var(--ok)' : 'var(--tx2)'};">
                <div>
                    <div style="font-weight:bold; color:var(--tx); font-size:15px;"><span style="color:${isParticipant ? 'var(--ok)' : 'var(--tx2)'}; font-size:10px; margin-left:5px;">${statusText}</span> ${title}</div>
                    <div style="font-size:12px; color:var(--tx2);">${subtitle}</div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    ${joinBtn}
                    ${endBtn}
                </div>
            </div>`;
            
            // Ringing logic: only ring if target, not creator, status is calling, and we are NOT currently in a call!
            if(isTarget && !isCreator && data.status === 'calling' && !_currentMeetingId && typeof playMeetingRinging === 'function' && !window._declinedMeeting) {
                 var modal = document.getElementById('incomingMeetingModal');
                 if(modal && modal.style.display !== 'flex') {
                     modal.style.display = 'flex';
                     playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                 }
            }
        });
        
        if(!hasActive) {
            listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;">لا توجد اجتماعات أو مكالمات نشطة حالياً في الشركة.</div>';
        } else {
            listContainer.innerHTML = html;
        }
        
        // Re-render user status badges in real-time based on the updated window._activeCallUsers
        if (typeof window.renderUsersList === 'function' && window._lastUsersSnap) {
            window.renderUsersList(window._lastUsersSnap);
        }
    });
};"""

start_pos = js.find("var _jitsiWindowRef = null;")
if start_pos == -1:
    start_pos = js.find("window.reopenJitsiWindow = function")

end_pos = js.find("function getRelativeTimeArabic(date) {")

if start_pos != -1 and end_pos != -1:
    js = js[:start_pos] + new_meetings_code + "\n\n" + js[end_pos:]
    print("app.js deduplication & auto-timeout logic updated successfully!")
else:
    print("Could not locate boundaries in app.js!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
