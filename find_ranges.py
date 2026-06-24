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

# We know the correct splits based on what the sub-files should contain.
# Let's find the exact boundaries by looking at the content of each sub-file
# that is CORRECT (matches the backup).

# database.js: lines 0 to ? in block7
# Read database.js to find where it ends
with open('src/data/database.js', 'r', encoding='utf-8') as f:
    db_content = f.read()
db_lines = db_content.split('\n')

# GradesCalculator.js
with open('src/domain/GradesCalculator.js', 'r', encoding='utf-8') as f:
    gc_content = f.read()
gc_lines = gc_content.split('\n')

# config.js
with open('src/core/config.js', 'r', encoding='utf-8') as f:
    cfg_content = f.read()

# We need to find the exact line ranges in block7 for each file
# database.js starts at line 0 of block7
# Let's verify by checking match

def find_exact_range(block_lines, file_content):
    """Find start/end indices in block_lines that match file_content exactly"""
    file_lines = file_content.rstrip('\n').split('\n')
    first = file_lines[0].strip()
    
    for start in range(len(block_lines)):
        if block_lines[start].strip() == first:
            # Check if remaining lines match
            match = True
            for j, fl in enumerate(file_lines):
                if start + j >= len(block_lines):
                    match = False
                    break
                if block_lines[start + j].rstrip('\r\n') != fl.rstrip('\r\n'):
                    match = False
                    break
            if match:
                return start, start + len(file_lines) - 1
    return None, None

# Find database.js range
db_start, db_end = find_exact_range(lines, db_content)
print(f"database.js: lines {db_start}-{db_end}")

# Find GradesCalculator.js range  
gc_start, gc_end = find_exact_range(lines, gc_content)
print(f"GradesCalculator.js: lines {gc_start}-{gc_end}")

# Find config.js range
cfg_start, cfg_end = find_exact_range(lines, cfg_content)
print(f"config.js: lines {cfg_start}-{cfg_end}")

# So auth.js should start right after config.js
auth_start = cfg_end + 1 if cfg_end is not None else None
print(f"auth.js should start at: {auth_start}")
if auth_start:
    print(f"  Line content: {lines[auth_start].rstrip()[:100]}")

# And student_rules.js starts with 'function applyTeacherMode'
for i in range(len(lines)):
    if 'function applyTeacherMode()' in lines[i]:
        print(f"\napplyTeacherMode found at line {i}: {lines[i].strip()[:80]}")
        break

# Find all major section markers
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('// ===') and len(stripped) > 20:
        # Check the next non-empty line for context
        context = ""
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip():
                context = lines[j].strip()[:80]
                break
        if i < 50 or 'ADMIN CONFIRM' in stripped or 'FIREBASE' in context or 'function' in context:
            print(f"  Section at line {i}: {stripped[:80]} -> {context}")
