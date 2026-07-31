# 1. Update auth.js to use Web Worker to bypass tab/minimize throttling
with open('auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

old_presence = """    // Periodically update user online status
    function updatePresence() {
        if (window.db && firebase.auth().currentUser) {
            var uid = firebase.auth().currentUser.uid;
            db.collection('users').doc(uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(e) {});
        }
    }
    setTimeout(updatePresence, 3000);
    setInterval(updatePresence, 60000);"""

new_presence = """    // Periodically update user online status (Using Web Worker to bypass page/tab minimize throttling)
    function updatePresence() {
        if (window.db && firebase.auth().currentUser) {
            var uid = firebase.auth().currentUser.uid;
            db.collection('users').doc(uid).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(e) {});
        }
    }
    
    // Initial updates
    setTimeout(updatePresence, 2000);
    setTimeout(updatePresence, 10000);
    
    // Background worker for steady updates even when minimized or hidden
    try {
        var workerBlob = new Blob([
            "setInterval(function() { postMessage('tick'); }, 30000);"
        ], { type: 'application/javascript' });
        var worker = new Worker(URL.createObjectURL(workerBlob));
        worker.onmessage = function() {
            updatePresence();
        };
        console.log("Web Worker active-presence tracking successfully initialized.");
    } catch(e) {
        console.warn("Web Worker blocked or unsupported, falling back to standard interval.");
        setInterval(updatePresence, 35000);
    }"""

auth_js = auth_js.replace(old_presence, new_presence)

with open('auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
print("auth.js updated with unthrottled presence worker!")


# 2. Update app.js online threshold to 3 minutes (180,000 ms)
with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

app_js = app_js.replace(
    'if (diffMs < 120000) { // Active in last 2 mins',
    'if (diffMs < 180000) { // Active in last 3 mins'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
print("app.js threshold updated to 3 minutes!")
