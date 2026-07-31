import re

# 1. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the broken wrapper blocks from the end of app.js
# We need to look for:
# // Initialize the meetings listener when the livemeeting page is opened ... to the end of file
broken_wrappers_pattern = re.compile(r'// Initialize the meetings listener when the livemeeting page is opened.*', re.DOTALL)
js = broken_wrappers_pattern.sub('', js)

# Now, modify the window.go wrapper around line 5739 in app.js
old_go_wrapper = """// Attach datalist when pages change
var oldGo = go;
window.go = function(id, nav, force) {
    oldGo(id, nav, force);
    setTimeout(tgAttachDatalistToInputs, 300);
};"""

new_go_wrapper = """// Attach datalist when pages change
var oldGo = go;
window.go = function(id, nav, force) {
    oldGo(id, nav, force);
    setTimeout(tgAttachDatalistToInputs, 300);
    if(id === 'livemeeting') {
        if(typeof initMeetingsListener === 'function') initMeetingsListener();
        if(typeof loadUsersForCalls === 'function') loadUsersForCalls();
    }
};"""

if old_go_wrapper in js:
    js = js.replace(old_go_wrapper, new_go_wrapper)
    print("app.js window.go wrapper updated successfully!")
else:
    print("Could not find the original window.go wrapper in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Let's inspect the empGo function in employee.html
# We want to insert the meetings trigger inside the empGo function body.
# Let's find:
# function empGo(id, el, force) {
#     // ...
# }
# and insert at the end of the function body.

emp_go_pattern = re.compile(r'(function empGo\(id, el, force\) \{.*?\n)(==========|\s*// Reset global table filter)', re.DOTALL)

# Let's look at lines 582-620 of employee.html to see exact code.
# 582: function empGo(id, el, force) {
# 583:     // تم إزالة فحص النص غير المحفوظ لتجنب الإزعاج
# 584:     document.querySelectorAll('.emp-tab').forEach(function(t){t.classList.remove('a');});
# 585:     document.querySelectorAll('.emp-pg').forEach(function(p){p.classList.remove('a');});
# 586:     if(el)el.classList.add('a');
# 587:     var epg = document.getElementById('epg-'+id);
# 588:     if(epg) epg.classList.add('a');
# 589:     
# 590:     // Reset global table filter

old_emp_go = """function empGo(id, el, force) {
    // تم إزالة فحص النص غير المحفوظ لتجنب الإزعاج
    document.querySelectorAll('.emp-tab').forEach(function(t){t.classList.remove('a');});
    document.querySelectorAll('.emp-pg').forEach(function(p){p.classList.remove('a');});
    if(el)el.classList.add('a');
    var epg = document.getElementById('epg-'+id);
    if(epg) epg.classList.add('a');"""

new_emp_go = """function empGo(id, el, force) {
    // تم إزالة فحص النص غير المحفوظ لتجنب الإزعاج
    document.querySelectorAll('.emp-tab').forEach(function(t){t.classList.remove('a');});
    document.querySelectorAll('.emp-pg').forEach(function(p){p.classList.remove('a');});
    if(el)el.classList.add('a');
    var epg = document.getElementById('epg-'+id);
    if(epg) epg.classList.add('a');
    
    if(id === 'livemeeting') {
        if(typeof initMeetingsListener === 'function') initMeetingsListener();
        if(typeof loadUsersForCalls === 'function') loadUsersForCalls();
    }"""

if old_emp_go in emp_html:
    emp_html = emp_html.replace(old_emp_go, new_emp_go)
    print("employee.html empGo updated successfully!")
else:
    print("Could not find the target empGo block in employee.html")

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)

print("Scoping fixes completed!")
