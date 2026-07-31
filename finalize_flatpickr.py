import os
import re

# 1. Update theme.js to use local flatpickr files
with open('theme.js', 'r', encoding='utf-8') as f:
    theme_js = f.read()

theme_js = theme_js.replace("https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css", "flatpickr.min.css")
theme_js = theme_js.replace("https://cdn.jsdelivr.net/npm/flatpickr", "flatpickr.min.js")

with open('theme.js', 'w', encoding='utf-8') as f:
    f.write(theme_js)
print("Updated theme.js for local flatpickr")

# 2. Add theme.js to attendance.html if missing
with open('attendance.html', 'r', encoding='utf-8') as f:
    att_html = f.read()

if 'theme.js' not in att_html:
    att_html = att_html.replace('</body>', '    <script src="theme.js?v=3"></script>\n</body>')
    with open('attendance.html', 'w', encoding='utf-8') as f:
        f.write(att_html)
    print("Added theme.js to attendance.html")

# 3. Add flatpickr to sw.js cache
with open('sw.js', 'r', encoding='utf-8') as f:
    sw_js = f.read()

if 'flatpickr.min.js' not in sw_js:
    sw_js = sw_js.replace("'./manifest.json'", "'./manifest.json',\n    './flatpickr.min.css',\n    './flatpickr.min.js'")
    # Update cache version
    sw_js = re.sub(r"CACHE_NAME = 'techgo-v\d+'", "CACHE_NAME = 'techgo-v8'", sw_js)
    with open('sw.js', 'w', encoding='utf-8') as f:
        f.write(sw_js)
    print("Updated sw.js")

# 4. Update cache busters in html files
import time
ts = str(int(time.time()))
for html_file in ['index.html', 'employee.html', 'login.html', 'setup.html', 'attendance.html']:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = re.sub(r'theme\.js\?v=\d+', f'theme.js?v={ts}', content)
        new_content = re.sub(r'app\.js\?v=\d+', f'app.js?v={ts}', new_content)
        new_content = re.sub(r'formsend\.js\?v=\d+', f'formsend.js?v={ts}', new_content)
        new_content = re.sub(r'auth\.js\?v=\d+', f'auth.js?v={ts}', new_content)
        
        if new_content != content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated cache busters in {html_file}")
