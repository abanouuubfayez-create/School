import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

# Replace jitsiAdminContainer with the new custom card
old_admin_cnt = """        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>"""

new_admin_cnt = """        <div id="jitsiAdminContainer" style="display:none; background:var(--bg2); border:1px solid var(--pr); border-radius:12px; padding:20px; text-align:center; margin-top:20px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size:40px; margin-bottom:15px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderAdmin" style="color:var(--tx); margin-bottom:10px;">جاري الاتصال...</h3>
            <p style="color:var(--tx2); font-size:14px; margin-bottom:20px;">تم فتح الاجتماع في نافذة مستقلة لتوفير أقصى جودة اتصال (مع تفعيل وضع الانتظار والموافقة التلقائي للضيوف).</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:var(--pr); color:#fff;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no); color:#fff;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

idx_html = idx_html.replace(old_admin_cnt, new_admin_cnt)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html template updated!")


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Replace jitsiEmpContainer
old_emp_cnt = """        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>"""

new_emp_cnt = """        <div id="jitsiEmpContainer" style="display:none; background:var(--bg2); border:1px solid var(--pr); border-radius:12px; padding:20px; text-align:center; margin-top:20px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <div style="font-size:40px; margin-bottom:15px; animation: pulseRinging 1.5s infinite;">📞</div>
            <h3 id="callStatusHeaderEmp" style="color:var(--tx); margin-bottom:10px;">جاري الاتصال...</h3>
            <p style="color:var(--tx2); font-size:14px; margin-bottom:20px;">تم فتح الاجتماع في نافذة مستقلة لتوفير أقصى جودة اتصال (مع تفعيل وضع الانتظار والموافقة التلقائي للضيوف).</p>
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;">
                <button class="bt" onclick="reopenJitsiWindow()" style="background:var(--pr); color:#fff;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>
                <button class="bt" onclick="endCall()" style="background:var(--no); color:#fff;"><i class="fa fa-stop"></i> إنهاء وإغلاق المكالمة</button>
            </div>
        </div>"""

emp_html = emp_html.replace(old_emp_cnt, new_emp_cnt)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html template updated!")


# 3. Update app.js (meetings logic)
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# We will replace the entire meetings block in app.js starting from window.startNewMeeting up to the end of the file or next function.
# Let's inspect what's at the end of app.js.
# Line 6652: window.initMeetingsListener = function() { ... }
# Let's view the end of app.js just to be safe.
