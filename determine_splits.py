import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read backup
with open('برنامج مدرسة الشمامسة نهااائي.backup.html', 'r', encoding='utf-8') as f:
    backup = f.read()

pattern = r'<script>(.*?)</script>'
all_scripts = re.findall(pattern, backup, re.DOTALL)
block7 = all_scripts[6]
lines = block7.split('\n')

# We know from the analysis:
# database.js: 0-180
# GradesCalculator.js: 182-193
# config.js: 194-231
# auth.js: 232 - ???
# student_rules.js: ??? - ???  (starts with function applyTeacherMode at line 1405)
# ui_views.js: ??? - end

# Now we need to find where auth.js should end.
# The current auth.js has 1367 lines and starts at line 232
# So auth.js covers lines 232 to 232+1367-1 = 1598
# But that's wrong because it includes code that belongs to student_rules.js

# student_rules.js currently starts with 'function applyTeacherMode()' at line 1405
# Let's look at what auth.js SHOULD end at.
# The current (broken) student_rules.js starts at line 1405

# What comes right before line 1405?
print("Lines around the auth.js/student_rules.js boundary (1400-1410):")
for i in range(1400, min(1412, len(lines))):
    print(f"  {i}: {lines[i].rstrip()[:120]}")

# Find where student_rules.js should end
# student_rules.js currently ends at line 1967 with "// ADMIN CONFIRM GATE"
# That's at block7 line 1967
print(f"\nLines around student_rules.js end (1960-1970):")
for i in range(1960, min(1972, len(lines))):
    print(f"  {i}: {lines[i].rstrip()[:120]}")

# So ui_views.js starts at line 1968
print(f"\nLines starting ui_views.js (1968-1980):")
for i in range(1968, min(1982, len(lines))):
    print(f"  {i}: {lines[i].rstrip()[:120]}")

# Summary of correct split:
print(f"\n=== CORRECT SPLIT ===")
print(f"database.js:        lines 0-180 ({181} lines)")
print(f"GradesCalculator.js: lines 182-193 ({12} lines)")
print(f"config.js:          lines 194-231 ({38} lines)")
print(f"auth.js:            lines 232-1404 ({1173} lines)")
print(f"student_rules.js:   lines 1405-1967 ({563} lines)")
print(f"ui_views.js:        lines 1968-{len(lines)-1} ({len(lines)-1968} lines)")
print(f"Total:              {len(lines)} lines")
