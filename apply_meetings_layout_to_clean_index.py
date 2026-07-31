import re

# Read clean index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace pg-livemeeting block
old_block_pattern = re.compile(r'<div class="pg" id="pg-livemeeting">.*?</div>\s*</div>\s*(?=<div class="pg" id="pg-wkreports">)', re.DOTALL)

new_layout = """<div class="pg" id="pg-livemeeting">
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

        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>
"""

if old_block_pattern.search(html):
    html = old_block_pattern.sub(new_layout + "\n", html)
    print("pg-livemeeting layout replaced successfully in index.html!")
else:
    print("Could not find the target livemeeting block in index.html")

# Append the modal to the absolute end of the file.
modal_html = """
<!-- Incoming Meeting Call Modal -->
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

# Replace the absolute end of the file safely.
# Look for </body> and </html> at the end of the file.
actual_end_pattern = re.compile(r'</body>\s*</html>\s*$', re.DOTALL)
if actual_end_pattern.search(html):
    html = actual_end_pattern.sub(modal_html + "\n</body>\n</html>", html)
    print("Modal successfully appended to the end of index.html!")
else:
    print("Could not find body/html closing tags at the end of index.html")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html apply complete!")
