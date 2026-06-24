import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read backup - the ORIGINAL working file
with open('برنامج مدرسة الشمامسة نهااائي.backup.html', 'r', encoding='utf-8') as f:
    backup = f.read()

# Extract ALL script blocks
pattern = r'<script>(.*?)</script>'
all_scripts = re.findall(pattern, backup, re.DOTALL)

print(f"Backup has {len(all_scripts)} script blocks")

# The build.py maps these script files:
# Block 1 = public/lib/xlsx.min.js
# Block 2 = public/lib/html2canvas.min.js
# Block 3 = public/lib/jspdf.min.js (jspdf.umd.min.js)
# Block 4 = public/lib/qrcode.min.js
# Block 5 = src/core/fontPatcher.js
# Block 6 = src/domain/mercyBanner.js
# Block 7 = THE BIG ONE (database.js + GradesCalculator.js + config.js + auth.js + student_rules.js + ui_views.js)
# Block 8 = src/application/globalSearch.js
# Block 9 = src/data/autoBackup.js  (or something else?)
# Block 10 = src/application/schedule.js
# Block 11 = src/application/certificate.js

# The problem is Block 7 was ONE script block but is now being split into:
# - src/data/database.js
# - src/domain/GradesCalculator.js
# - src/core/config.js
# - src/application/auth.js
# - src/domain/student_rules.js
# - src/presentation/views/ui_views.js
# That's 6 files from 1 block.

# But these 6 files share the same scope (closures, variables etc.)
# So they CANNOT be in separate <script> tags!
# The build.py is putting each into its own <script> tag, which breaks variable scoping.

# SOLUTION: Concatenate them into a SINGLE script file and reference it as one <script>

block7 = all_scripts[6]
lines = block7.split('\n')
print(f"\nBlock 7: {len(lines)} lines")

# Let's verify: read all 6 "sub-files" and concatenate them
sub_files = [
    'src/data/database.js',
    'src/domain/GradesCalculator.js',
    'src/core/config.js',
    'src/application/auth.js',
    'src/domain/student_rules.js',
    'src/presentation/views/ui_views.js',
]

total_lines = 0
for sf in sub_files:
    if os.path.exists(sf):
        with open(sf, 'r', encoding='utf-8') as f:
            content = f.read()
        lc = content.count('\n') + 1
        total_lines += lc
        print(f"  {sf}: {lc} lines")
    else:
        print(f"  {sf}: MISSING")

print(f"\nTotal lines in sub-files: {total_lines}")
print(f"Block 7 lines: {len(lines)}")
print(f"Difference: {total_lines - len(lines)}")

# Now check: does the concatenation of these 6 files match block7?
concat = ""
for sf in sub_files:
    if os.path.exists(sf):
        with open(sf, 'r', encoding='utf-8') as f:
            concat += f.read()

# Normalize whitespace for comparison
def normalize(s):
    return re.sub(r'\s+', ' ', s).strip()

b7_norm = normalize(block7)
concat_norm = normalize(concat)

# Find first difference
min_len = min(len(b7_norm), len(concat_norm))
first_diff = -1
for i in range(min_len):
    if b7_norm[i] != concat_norm[i]:
        first_diff = i
        break

if first_diff == -1 and len(b7_norm) == len(concat_norm):
    print("\nPERFECT MATCH: Concatenation of sub-files matches Block 7!")
else:
    print(f"\nMISMATCH at position {first_diff}")
    if first_diff >= 0:
        print(f"  Backup: ...{b7_norm[max(0,first_diff-40):first_diff+40]}...")
        print(f"  Concat: ...{concat_norm[max(0,first_diff-40):first_diff+40]}...")
