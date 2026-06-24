import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read backup
with open('برنامج مدرسة الشمامسة نهااائي.backup.html', 'r', encoding='utf-8') as f:
    backup = f.read()

# Extract Block 7 - the big monolith script (12647 lines)
pattern = r'<script>(.*?)</script>'
scripts = re.findall(pattern, backup, re.DOTALL)

block7 = scripts[6]  # 0-indexed, Block 7
lines = block7.split('\n')
print(f"Block 7 has {len(lines)} lines")

# Now let's find the split points that the original refactoring used
# by looking at what each src file starts with
src_files = [
    'src/core/config.js',
    'src/application/auth.js', 
    'src/domain/student_rules.js',
    'src/presentation/views/ui_views.js',
]

for sf in src_files:
    if not os.path.exists(sf):
        print(f"MISSING: {sf}")
        continue
    with open(sf, 'r', encoding='utf-8') as f:
        content = f.read()
    first_lines = content.strip().split('\n')
    last_lines = content.strip().split('\n')
    
    # Find where this content appears in block7
    first_line = first_lines[0].strip()
    last_line = last_lines[-1].strip()
    
    # Search for first line in block7
    found_start = -1
    found_end = -1
    for i, line in enumerate(lines):
        if line.strip() == first_line and found_start == -1:
            found_start = i
        if line.strip() == last_line:
            found_end = i
    
    print(f"\n{sf}: {len(first_lines)} lines in file")
    print(f"  First line: '{first_line[:80]}'")
    print(f"  Found at backup line: {found_start}")
    print(f"  Last line: '{last_line[:80]}'")
    print(f"  Found at backup line: {found_end}")
