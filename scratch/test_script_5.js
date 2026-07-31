
        window._outgoingAudioCtx = null;
        window._outgoingOsc1 = null;
        window._outgoingOsc2 = null;
        window._outgoingGainNode = null;
        window._outgoingInterval = null;

        function playOutgoingRinging() {
            stopOutgoingRinging();
            
            // Web Audio API International Dual-Tone Ringback Tone (440Hz + 480Hz - Authentic Telephone Sound "tuuuuoot...")
            try {
                var AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                
                window._outgoingAudioCtx = new AudioCtx();
                var ctx = window._outgoingAudioCtx;
                
                window._outgoingOsc1 = ctx.createOscillator();
                window._outgoingOsc2 = ctx.createOscillator();
                window._outgoingOsc1.type = 'sine';
                window._outgoingOsc2.type = 'sine';
                window._outgoingOsc1.frequency.setValueAtTime(440, ctx.currentTime);
                window._outgoingOsc2.frequency.setValueAtTime(480, ctx.currentTime);
                
                window._outgoingGainNode = ctx.createGain();
                window._outgoingGainNode.gain.setValueAtTime(0, ctx.currentTime);
                
                window._outgoingOsc1.connect(window._outgoingGainNode);
                window._outgoingOsc2.connect(window._outgoingGainNode);
                window._outgoingGainNode.connect(ctx.destination);
                
                window._outgoingOsc1.start();
                window._outgoingOsc2.start();
                
                function ringPulse() {
                    if (!window._outgoingAudioCtx || !window._outgoingGainNode) return;
                    var now = window._outgoingAudioCtx.currentTime;
                    window._outgoingGainNode.gain.cancelScheduledValues(now);
                    window._outgoingGainNode.gain.setValueAtTime(0, now);
                    window._outgoingGainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
                    window._outgoingGainNode.gain.setValueAtTime(0.12, now + 1.8);
                    window._outgoingGainNode.gain.linearRampToValueAtTime(0, now + 1.9);
                }
                
                ringPulse();
                window._outgoingInterval = setInterval(ringPulse, 4000);
            } catch(e) {
                console.warn("Web Audio playOutgoingRinging error:", e);
            }
        }

        function stopOutgoingRinging() {
            if (window._outgoingInterval) {
                clearInterval(window._outgoingInterval);
                window._outgoingInterval = null;
            }
            try {
                if (window._outgoingOsc1) { window._outgoingOsc1.stop(); window._outgoingOsc1.disconnect(); window._outgoingOsc1 = null; }
                if (window._outgoingOsc2) { window._outgoingOsc2.stop(); window._outgoingOsc2.disconnect(); window._outgoingOsc2 = null; }
                if (window._outgoingAudioCtx) { window._outgoingAudioCtx.close(); window._outgoingAudioCtx = null; }
            } catch(e) {}
        }
    