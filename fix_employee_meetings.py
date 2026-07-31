import re

# 1. Correct employee.html meetings container
with open('employee.html', 'r', encoding='utf-8') as f:
    html = f.read()

correct_emp_meetings = """<div class="emp-pg" id="epg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك الانضمام إلى الاجتماعات النشطة أو بدء مكالمة جديدة.</p>
        
        <!-- Active Meetings -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--pr);">🟢 الاجتماعات والمكالمات النشطة</h3>
        <div id="activeMeetingsListEmp" style="margin-bottom: 30px;">
            <!-- Active meetings will be listed here -->
        </div>

        <!-- Start New Call -->
        <h3 style="margin-top:20px; margin-bottom:10px; font-size:16px; color:var(--tx);">📞 بدء مكالمة جديدة</h3>
        <div id="callTargetListEmp" style="display: flex; flex-direction: column; gap: 10px; margin-bottom:20px;">
            <!-- Users will be listed here dynamically -->
        </div>

        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>"""

# Replace the wrong pg-livemeeting with the correct epg-livemeeting in employee.html
wrong_pattern = re.compile(r'<div class="pg" id="pg-livemeeting">.*?</div>\s*</div>\s*(?=<div class="emp-pg" id="epg-acct">)', re.DOTALL)

if wrong_pattern.search(html):
    html = wrong_pattern.sub(correct_emp_meetings + '\n', html)
    print("employee.html updated with correct epg-livemeeting container")
else:
    # Try another search just in case
    wrong_pattern_alt = re.compile(r'<div class="pg" id="pg-livemeeting">.*?</div>\s*</div>', re.DOTALL)
    html = wrong_pattern_alt.sub(correct_emp_meetings, html)
    print("employee.html updated with alt pattern")

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Add empGo wrapping to app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# We will append the empGo wrapping code at the end of the live meeting section or at the end of app.js.
# Let's find where window.go is wrapped and append it right after.
go_wrap_pattern = """// Initialize the meetings listener when the livemeeting page is opened
var oldGo = window.go;
window.go = function(id, el) {
    if(oldGo) oldGo(id, el);
    if(id === 'livemeeting') {
        initMeetingsListener();
        loadUsersForCalls();
    }
};"""

new_go_wrap = go_wrap_pattern + """

// Initialize the meetings listener when the employee opens meetings page
var oldEmpGo = window.empGo;
window.empGo = function(id, el, force) {
    if(oldEmpGo) oldEmpGo(id, el, force);
    if(id === 'livemeeting') {
        initMeetingsListener();
        loadUsersForCalls();
    }
};
"""

if go_wrap_pattern in js:
    js = js.replace(go_wrap_pattern, new_go_wrap)
    print("app.js updated with empGo wrapper")
else:
    print("Could not find the go wrap pattern in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Fix completed!")
