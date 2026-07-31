# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()

# Replace button color and ringtone source
idx_html = idx_html.replace(
    '<button class="bt" onclick="reopenJitsiWindow()" style="background:var(--pr); color:#fff;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>',
    '<button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>'
)

idx_html = idx_html.replace(
    'https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print("index.html updated successfully!")


# 2. Update employee.html
with open('employee.html', 'r', encoding='utf-8') as f:
    emp_html = f.read()

# Replace button color and ringtone source
emp_html = emp_html.replace(
    '<button class="bt" onclick="reopenJitsiWindow()" style="background:var(--pr); color:#fff;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>',
    '<button class="bt" onclick="reopenJitsiWindow()" style="background:#10b981 !important; color:#fff !important; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;"><i class="fa fa-external-link"></i> إظهار نافذة الاجتماع</button>'
)

emp_html = emp_html.replace(
    'https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'
)

with open('employee.html', 'w', encoding='utf-8') as f:
    f.write(emp_html)
print("employee.html updated successfully!")
