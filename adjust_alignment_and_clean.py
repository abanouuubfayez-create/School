with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Let's clean up any duplicate Jitsi variables and declarations at lines 6480-6493
# Specifically, we want to find:
# function loadJitsiScript() { ... }
# var _jitsiApi = null;
# var _currentMeetingId = null;
# which were the old declarations.

# Let's inspect the code before loadUsersForCalls
start_idx = js.find('window.loadUsersForCalls = async function')
if start_idx != -1:
    header = js[:start_idx]
    
    # Remove any occurrences of loadJitsiScript, _jitsiApi, _currentMeetingId in the header
    # to avoid duplication.
    # Actually, we can just replace the entire header from where loadJitsiScript starts.
    # Let's find the first loadJitsiScript in the file
    first_jitsi_script = header.find('function loadJitsiScript()')
    if first_jitsi_script != -1:
        header = header[:first_jitsi_script]
        
    # Now rebuild the file:
    # Header + clean Jitsi script + meetings logic (which has loadUsersForCalls, startNewMeeting, etc.)
    meetings_logic = js[start_idx:]
    
    # We will define the clean Jitsi helper script at the top of the meetings section:
    jitsi_helpers = """function loadJitsiScript() {
    return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) { resolve(); return; }
        var script = document.createElement('script');
        script.src = 'https://jitsi.belnet.be/external_api.js';
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
}
var _jitsiApi = null;
var _currentMeetingId = null;

"""
    js = header + jitsi_helpers + meetings_logic
    print("Cleaned up duplicate declarations in app.js!")

# 2. Update loadUsersForCalls to use justify-content: flex-start; gap: 20px;
js = js.replace(
    'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;',
    'display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px;'
)

# 3. Update active meetings list card to use justify-content: flex-start; gap: 20px;
js = js.replace(
    'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);',
    'display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid var(--ok);'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js updated successfully with alignment and clean header!")
