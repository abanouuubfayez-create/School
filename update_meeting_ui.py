import re
import os

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the existing pg-livemeeting with the new meetings UI in index.html
old_meeting_html = re.search(r'<div class="pg" id="pg-livemeeting">.*?</div>\n</div>', html, re.DOTALL)
new_meeting_admin = """<div class="pg" id="pg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك هنا بدء اجتماع مباشر مع الموظفين أو مكالمة فردية.</p>
        
        <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="bt" onclick="openStartCallModal(true)" style="background:var(--ok); color:#fff;"><i class="fa fa-users"></i> مكالمة جماعية / اجتماع</button>
            <button class="bt" onclick="openStartCallModal(false)" style="background:var(--pr); color:#fff;"><i class="fa fa-user"></i> مكالمة فردية مع موظف</button>
        </div>

        <div id="activeMeetingsListAdmin" style="margin-bottom: 20px;">
            <!-- Active meetings will be listed here -->
        </div>

        <div id="jitsiAdminContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiAdminInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>"""

if old_meeting_html:
    html = html.replace(old_meeting_html.group(0), new_meeting_admin)
else:
    print("Could not find pg-livemeeting in index.html")

# Also add the modal for starting a call
modal_html = """
<!-- Call Modal -->
<div id="startCallModal" class="tg-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999; align-items:center; justify-content:center;">
    <div class="tg-modal-content" style="background:var(--bg); padding:20px; border-radius:12px; width:400px; max-width:90%;">
        <h3 id="startCallTitle" style="margin-top:0;">بدء مكالمة</h3>
        
        <div id="callEmpSelectContainer" class="fg" style="margin-top:15px; display:none;">
            <label>اختر الموظف للاتصال به</label>
            <select id="callTargetEmp" style="width:100%; padding:8px; border-radius:4px; border:1px solid var(--bd); background:var(--bg2); color:var(--tx);">
                <option value="">-- اختر الموظف --</option>
            </select>
        </div>

        <div class="fg" style="margin-top:15px;">
            <label>موضوع المكالمة / الاجتماع (اختياري)</label>
            <input type="text" id="callTopic" placeholder="مثال: نقاش المشروع الجديد..." style="width:100%; padding:8px; border-radius:4px; border:1px solid var(--bd); background:var(--bg2); color:var(--tx);">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button class="bt bt-o" onclick="document.getElementById('startCallModal').style.display='none'">إلغاء</button>
            <button class="bt bt-p" onclick="confirmStartCall()">بدء الاتصال 📞</button>
        </div>
    </div>
</div>
"""
if "startCallModal" not in html:
    html = html.replace('</body>', modal_html + '\n</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Replace the existing epg-livemeeting
old_emp_meeting = re.search(r'<div class="emp-pg" id="epg-livemeeting">.*?</div>\n</div>', emp_html, re.DOTALL)
new_emp_meeting = """<div class="emp-pg" id="epg-livemeeting">
    <div class="card p-4">
        <h2 style="margin-bottom:10px; color:var(--tx); border-bottom:1px solid var(--bd); padding-bottom:10px;">الاجتماعات والمكالمات (Jitsi)</h2>
        <p style="color:var(--tx2); margin-bottom:15px; font-size:14px;">يمكنك بدء مكالمة مع أي موظف أو الانضمام لاجتماع مفتوح.</p>
        
        <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="bt" onclick="openStartCallModal(true)" style="background:var(--ok); color:#fff;"><i class="fa fa-users"></i> مكالمة جماعية / اجتماع</button>
            <button class="bt" onclick="openStartCallModal(false)" style="background:var(--pr); color:#fff;"><i class="fa fa-user"></i> مكالمة فردية مع موظف</button>
        </div>

        <div id="activeMeetingsListEmp" style="margin-bottom: 20px;">
            <!-- Active meetings will be listed here -->
        </div>

        <div id="jitsiEmpContainer" style="width:100%; height:600px; background:#000; border-radius:8px; display:none; overflow:hidden; position:relative;">
            <button class="bt" onclick="endCall()" style="position:absolute; top:10px; right:10px; background:var(--no); color:#fff; z-index:999;">إنهاء وإغلاق المكالمة</button>
            <div id="jitsiEmpInner" style="width:100%; height:100%;"></div>
        </div>
    </div>
</div>"""
if old_emp_meeting:
    emp_html = emp_html.replace(old_emp_meeting.group(0), new_emp_meeting)
else:
    print("Could not find epg-livemeeting in employee.html")

if "startCallModal" not in emp_html:
    emp_html = emp_html.replace('</body>', modal_html + '\n</body>')

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)

print("HTML files updated successfully!")
