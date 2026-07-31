import re

# 1. Update app.js (Change meet.jit.si to meet.ffmuc.net)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace meet.jit.si script and domain
js = js.replace("script.src = 'https://meet.jit.si/external_api.js';", "script.src = 'https://meet.ffmuc.net/external_api.js';")
js = js.replace("var domain = 'meet.jit.si';", "var domain = 'meet.ffmuc.net';")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js updated Jitsi domain to meet.ffmuc.net")


# 2. Revert index.html syntax error and place modal correctly
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Let's clean up the broken fullHtml line.
# We will search for the broken fullHtml block.
# It starts with: var fullHtml = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><link rel="stylesheet" href="styles.css"></head><body style="background:#fff;padding:20px;">' + clone.innerHTML + '<!-- Incoming Meeting Call Modal -->
# and ends around: </body></html>';

broken_pattern = re.compile(r"var fullHtml = '<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body style=\"background:#fff;padding:20px;\">\' \+ clone\.innerHTML \+ \'<!-- Incoming Meeting Call Modal -->.*?</body></html>\';", re.DOTALL)

clean_full_html = "var fullHtml = '<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body style=\"background:#fff;padding:20px;\">' + clone.innerHTML + '</body></html>';"

if broken_pattern.search(index_html):
    index_html = broken_pattern.sub(clean_full_html, index_html)
    print("index.html broken string literal fixed!")
else:
    # Let's try matching with regex search on fullHtml lines
    print("Could not find the exact broken pattern in index.html, doing alternative match")
    # Let's view the block and replace manually
    alt_pattern = re.compile(r"var fullHtml = '<!DOCTYPE html>.*?</body></html>\';", re.DOTALL)
    if alt_pattern.search(index_html):
        index_html = alt_pattern.sub(clean_full_html, index_html)
        print("index.html fixed with alt pattern!")

# Now check if the modal is already at the end of index.html
modal_html = """<!-- Incoming Meeting Call Modal -->
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
</div>"""

# Remove any duplicated incomingMeetingModal from index.html body (excluding the one at the end if it's there)
# To be safe, let's remove any instances of <!-- Incoming Meeting Call Modal -->...</div> in the body and then append it to the absolute end.

modal_pattern_clean = re.compile(r'<!-- Incoming Meeting Call Modal -->.*?</div>\s*</div>\s*(?=</body>)', re.DOTALL)
# Wait, let's just strip out any incomingMeetingModal that was added before the actual body end, and then add it cleanly.
index_html = re.sub(r'<!-- Incoming Meeting Call Modal -->.*?</div>\s*</div>\s*</div>\s*</div>\s*', '', index_html, flags=re.DOTALL) # clean potential nesting

# Now search for </body>\s*</html> and replace it with modal_html + \n</body>\n</html>
index_html = re.sub(r'</body>\s*</html>', modal_html + '\n</body>\n</html>', index_html)
print("index.html clean modal added at the absolute end!")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Scoping and Jitsi fixes complete!")
