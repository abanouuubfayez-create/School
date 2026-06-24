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

# Correct splits:
splits = {
    'src/data/database.js':          (0, 180),
    'src/domain/GradesCalculator.js': (182, 193),
    'src/core/config.js':            (194, 231),
    'src/application/auth.js':       (232, 1404),
    'src/domain/student_rules.js':   (1405, 1967),
    'src/presentation/views/ui_views.js': (1968, len(lines)-1),
}

for filepath, (start, end) in splits.items():
    content = '\n'.join(lines[start:end+1])
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content + '\n')
    
    written_lines = end - start + 1
    print(f"Wrote {filepath}: {written_lines} lines (backup lines {start}-{end})")

# Verify: concatenate all and compare to block7
concat = ""
for filepath in splits:
    with open(filepath, 'r', encoding='utf-8') as f:
        concat += f.read()

# Simple length check
print(f"\nBlock 7 length: {len(block7)} chars")
print(f"Concatenated length: {len(concat)} chars")

# Check match
block7_stripped = block7.rstrip('\n\r ')
concat_stripped = concat.rstrip('\n\r ')

if block7_stripped == concat_stripped:
    print("PERFECT MATCH!")
else:
    # Find first difference
    min_len = min(len(block7_stripped), len(concat_stripped))
    for i in range(min_len):
        if block7_stripped[i] != concat_stripped[i]:
            print(f"First difference at char {i}")
            print(f"  Backup: ...{repr(block7_stripped[max(0,i-20):i+20])}...")
            print(f"  Concat: ...{repr(concat_stripped[max(0,i-20):i+20])}...")
            break
    else:
        print(f"Content matches but lengths differ: backup={len(block7_stripped)}, concat={len(concat_stripped)}")
