
        window._nativeCallNotif = null;
        window._incomingCallData = null;
        window._declinedMeetingsSet = window._declinedMeetingsSet || new Set();
        
        // Web Audio Context Variables for Receiver Ringtone
        window._incomingAudioCtx = null;
        window._incomingInterval = null;

        // Service Worker Call Actions Listener for Windows Notification Clicks
        if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function(event) {
            console.log('ServiceWorker message received:', event.data);
            if (!event.data) return;
            var payload = event.data;
            var messageType = payload.type || payload.action;
            console.log('Message type:', messageType);
            var info = payload.data ? payload.data : payload;
            if ((messageType === 'ACCEPT_CALL' || messageType === 'accept_call') && info.meetingId) {
                console.log('Handling accept call for meeting', info.meetingId);
                window._incomingCallData = { meetingId: info.meetingId, roomName: info.roomName, topic: info.topic };
                if (typeof stopMeetingRinging === 'function') stopMeetingRinging();
                if (typeof acceptMeetingCall === 'function') acceptMeetingCall();
            } else if ((messageType === 'DECLINE_CALL' || messageType === 'decline_call') && info.meetingId) {
                console.log('Handling decline call for meeting', info.meetingId);
                if (typeof stopMeetingRinging === 'function') stopMeetingRinging();
                if (typeof declineMeetingCall === 'function') declineMeetingCall();
            }
        });
        }

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        function stopMeetingRingingAudioCtx() {
            if (window._incomingInterval) {
                clearInterval(window._incomingInterval);
                window._incomingInterval = null;
            }
            try {
                if (window._incomingAudioCtx) {
                    window._incomingAudioCtx.close();
                    window._incomingAudioCtx = null;
                }
            } catch(e) {}
        }

        function playMeetingRinging(callerName, meetingId, roomName, topic) {
            if (window._declinedMeetingsSet && window._declinedMeetingsSet.has(meetingId)) return;
            
            window._incomingCallData = { meetingId: meetingId, roomName: roomName, topic: topic };
            var modal = document.getElementById('incomingMeetingModal');
            if (modal) {
                modal.setAttribute('data-meeting-id', meetingId || '');
                modal.setAttribute('data-room-name', roomName || '');
                modal.setAttribute('data-topic', topic || '');
                modal.dataset.meetingId = meetingId || '';
                modal.dataset.roomName = roomName || '';
                modal.dataset.topic = topic || '';
                modal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(16,185,129,0.2) 0%, rgba(15,23,42,0.98) 100%); z-index:9999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(16px); font-family:inherit;';
            }
            
            var nameEl = document.getElementById('incomingCallerNameText');
            if(nameEl) nameEl.textContent = callerName;

            // Pure Clean Web Audio Telephone Ringing Tone ("تووووت... تووووت...")
            stopMeetingRingingAudioCtx();
            try {
                var AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    window._incomingAudioCtx = new AudioCtx();
                    var ctx = window._incomingAudioCtx;
                    
                    window._incomingOsc1 = ctx.createOscillator();
                    window._incomingOsc2 = ctx.createOscillator();
                    window._incomingOsc1.type = 'sine';
                    window._incomingOsc2.type = 'sine';
                    window._incomingOsc1.frequency.setValueAtTime(440, ctx.currentTime);
                    window._incomingOsc2.frequency.setValueAtTime(480, ctx.currentTime);
                    
                    window._incomingGainNode = ctx.createGain();
                    window._incomingGainNode.gain.setValueAtTime(0, ctx.currentTime);
                    
                    window._incomingOsc1.connect(window._incomingGainNode);
                    window._incomingOsc2.connect(window._incomingGainNode);
                    window._incomingGainNode.connect(ctx.destination);
                    
                    window._incomingOsc1.start();
                    window._incomingOsc2.start();
                    
                    function ringPulse() {
                        if (!window._incomingAudioCtx || !window._incomingGainNode) return;
                        var now = window._incomingAudioCtx.currentTime;
                        window._incomingGainNode.gain.cancelScheduledValues(now);
                        window._incomingGainNode.gain.setValueAtTime(0, now);
                        window._incomingGainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
                        window._incomingGainNode.gain.setValueAtTime(0.12, now + 1.5);
                        window._incomingGainNode.gain.linearRampToValueAtTime(0, now + 1.6);
                    }
                    
                    ringPulse();
                    window._incomingInterval = setInterval(ringPulse, 3500);
                }
            } catch(e){}
            
            if ("Notification" in window) {
                if (Notification.permission === "default") {
                    Notification.requestPermission();
                }
                if (Notification.permission === "granted") {
                    if (typeof tgShowNotification === 'function') {
                        tgShowNotification("📞 مكالمة / اجتماع جديد وارد 🔔", "اتصال مباشر من: " + callerName + ". اضغط للانضمام فوراً! 🚀", {
                            isCall: true,
                            tag: 'meeting-call-' + (meetingId || Date.now()),
                            requireInteraction: true,
                            renotify: true,
                            meetingId: meetingId || '',
                            roomName: roomName || '',
                            topic: topic || ''
                        });
                    } else if (!window._nativeCallNotif) {
                        try {
                            window._nativeCallNotif = new Notification("📞 مكالمة / اجتماع جديد وارد 🔔", {
                                body: "اتصال مباشر من: " + callerName + ". اضغط للانضمام فوراً! 🚀",
                                icon: "icon-192.png",
                                requireInteraction: true,
                                renotify: true,
                                tag: 'meeting-call-' + (meetingId || Date.now())
                            });
                            window._nativeCallNotif.onclick = function() {
                                window.focus();
                                if (typeof acceptMeetingCall === 'function') acceptMeetingCall();
                                this.close();
                            };
                        } catch(e){}
                    }
                }
            }
        }

        function stopMeetingRinging() {
            stopMeetingRingingAudioCtx();
            if(window._nativeCallNotif) {
                window._nativeCallNotif.close();
                window._nativeCallNotif = null;
            }
        }

        function acceptMeetingCall(btnEl) {
            if (typeof window.acceptMeetingCall === 'function') {
                window.acceptMeetingCall(btnEl);
            }
        }

        function declineMeetingCall(btnEl) {
            if (typeof window.declineMeetingCall === 'function') {
                window.declineMeetingCall(btnEl);
            }
        }
    