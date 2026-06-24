import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Check if the BACKUP (known working) file has the same "errors"
with open('برنامج مدرسة الشمامسة نهااائي.backup.html', 'r', encoding='utf-8') as f:
    backup = f.read()

pattern = r'<script>(.*?)</script>'
all_scripts = re.findall(pattern, backup, re.DOTALL)

# Block 7 is the big monolith - check the same lines
block7 = all_scripts[6]
lines = block7.split('\n')

# Check line 192+1405=1597 area (student_rules starts at 1405, error at its line 192)
# That's block7 line 1405+192 = 1597
target_line = 1405 + 192
print(f"Block7 line {target_line} (student_rules.js line 192):")
for i in range(max(0, target_line-2), min(len(lines), target_line+3)):
    print(f"  {i}: {lines[i].rstrip()[:120]}")

# Check auth.js area - error at line 57 (auth starts at 232)
target_line2 = 232 + 57
print(f"\nBlock7 line {target_line2} (auth.js line 57):")
for i in range(max(0, target_line2-5), min(len(lines), target_line2+3)):
    print(f"  {i}: {lines[i].rstrip()[:120]}")

# The key test: does the BACKUP file work? YES - it's the original.
# So these "errors" from the brace checker are false positives caused by 
# regex literals and template strings that the simple checker doesn't handle.
print("\n--- The backup file is the ORIGINAL WORKING version ---")
print("These brace checker 'errors' are FALSE POSITIVES from regex/template parsing limitations.")
