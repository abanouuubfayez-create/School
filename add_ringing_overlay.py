import re

# 1. Update app.js
# We need to pass the caller name and meeting details to playMeetingRinging
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_ringing_trigger = """                // Ringing logic for incoming individual calls
                if(isTarget && !isCreator && typeof playMeetingRinging === 'function' && !window._meetingJoined) {
                     var modal = document.getElementById('incomingMeetingModal');
                     if(modal && modal.style.display !== 'flex') {
                         modal.style.display = 'flex';
                         playMeetingRinging();
                     }
                }"""

new_ringing_trigger = """                // Ringing logic for incoming individual calls
                if(isTarget && !isCreator && typeof playMeetingRinging === 'function' && !window._meetingJoined) {
                     var modal = document.getElementById('incomingMeetingModal');
                     if(modal && modal.style.display !== 'flex') {
                         modal.style.display = 'flex';
                         playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                     }
                }"""

if old_ringing_trigger in js:
    js = js.replace(old_ringing_trigger, new_ringing_trigger)
    print("app.js trigger updated successfully!")
else:
    print("Could not find the old ringing trigger in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Replace the entire modal block at employee.html (from `<!-- Incoming Meeting Call Modal -->` up to `</div>\n\n<div class="emp-topbar">`)
old_emp_modal_regex = re.compile(r'<!-- Incoming Meeting Call Modal -->.*?</div>\s*<!-- Incoming Meeting Call Modal -->.*?</div>\s*(?=<div class="emp-topbar">)', re.DOTALL)
# Wait, let's inspect the actual block in employee.html.
# In previous view_file:
# 149: <!-- Incoming Meeting Call Modal -->
# 150: <div id="incomingMeetingModal" ...>
# ...
# 246: </div>
# 247: 
# 248: <div class="emp-topbar">

old_emp_modal_string = re.search(r'<!-- Incoming Meeting Call Modal -->.*?</div>\r?\n\r?\n(?=<div class="emp-topbar">)', emp_html, re.DOTALL)

new_modal_html = """<!-- Incoming Meeting Call Modal -->
<div id="incomingMeetingModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(27,42,74,0.95); z-index:999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(8px); font-family:inherit;">
    <div style="text-align:center; animation:pulseRinging 1.5s infinite; margin-bottom:40px;">
        <div style="width:120px; height:120px; background:var(--gd); border-radius:50%; display:flex; justify-content:center; align-items:center; margin:0 auto 20px; box-shadow:0 0 30px var(--gd);">
            <span style="font-size:50px;">📞</span>
        </div>
        <h2 style="color:#fff; margin-bottom:10px; font-size:28px;">مكالمة واردة جديدة</h2>
        <p id="incomingCallerNameText" style="color:var(--gd); margin-bottom:10px; font-size:22px; font-weight:bold;">جاري الاتصال...</p>
    </div>
    <div style="display:flex; gap:30px;">
        <button onclick="acceptMeetingCall()" style="background:var(--ok); color:#fff; border:none; border-radius:50px; padding:15px 40px; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 10px 20px rgba(16,185,129,0.4); display:flex; align-items:center; gap:10px; transition:transform 0.2s;">
            <span>📞</span> انضمام الآن
        </button>
        <button onclick="declineMeetingCall()" style="background:var(--no); color:#fff; border:none; border-radius:50px; padding:15px 40px; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 10px 20px rgba(239,68,68,0.4); display:flex; align-items:center; gap:10px; transition:transform 0.2s;">
            <span>✖</span> رفض
        </button>
    </div>
    
    <audio id="meetingRingtoneAudio" loop preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3" type="audio/mpeg">
    </audio>
    <style>
        @keyframes pulseRinging {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,162,39, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(201,162,39, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,162,39, 0); }
        }
    </style>
    <script>
        window._nativeCallNotif = null;
        window._incomingCallData = null;
        
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        function playMeetingRinging(callerName, meetingId, roomName, topic) {
            window._incomingCallData = { meetingId: meetingId, roomName: roomName, topic: topic };
            
            var nameEl = document.getElementById('incomingCallerNameText');
            if(nameEl) nameEl.textContent = callerName;
            
            var audio = document.getElementById('meetingRingtoneAudio');
            if(audio) {
                audio.currentTime = 0;
                audio.play().catch(function(e){console.warn('Audio auto-play prevented', e)});
            }
            
            if ("Notification" in window && Notification.permission === "granted") {
                if(!window._nativeCallNotif) {
                    window._nativeCallNotif = new Notification("📞 مكالمة واردة جديدة", {
                        body: "اتصال من: " + callerName + ". اضغط هنا للانضمام.",
                        icon: "icon-192.png",
                        requireInteraction: true
                    });
                    window._nativeCallNotif.onclick = function() {
                        window.focus();
                        acceptMeetingCall();
                        this.close();
                    };
                }
            }
        }

        function stopMeetingRinging() {
            var audio = document.getElementById('meetingRingtoneAudio');
            if(audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            if(window._nativeCallNotif) {
                window._nativeCallNotif.close();
                window._nativeCallNotif = null;
            }
        }

        function acceptMeetingCall() {
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
        }
        
        function declineMeetingCall() {
            var modal = document.getElementById('incomingMeetingModal');
            if(modal) modal.style.display = 'none';
            stopMeetingRinging();
            window._declinedMeeting = true;
        }
    </script>
</div>
"""

if old_emp_modal_string:
    emp_html = emp_html.replace(old_emp_modal_string.group(0), new_modal_html + "\n")
    print("employee.html modal updated!")
else:
    # Backup replace just in case of whitespaces
    emp_html = re.sub(r'<!-- Incoming Meeting Call Modal -->.*?</div>\s*<!-- Incoming Meeting Call Modal -->.*?</div>\s*(?=<div class="emp-topbar">)', new_modal_html + "\n", emp_html, flags=re.DOTALL)
    print("employee.html modal replaced with regex fallback")

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)


# 3. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Insert new_modal_html right before `</body>` in index.html
if "incomingMeetingModal" not in index_html:
    index_html = index_html.replace('</body>', new_modal_html + '\n</body>')
    print("index.html modal inserted!")
else:
    print("index.html already has the modal!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Modal integrations complete!")
