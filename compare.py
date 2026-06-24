import re
import os

# Extract all script blocks from both files and compare
def extract_scripts(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all inline script blocks
    pattern = r'<script>\s*(.*?)\s*</script>'
    scripts = re.findall(pattern, content, re.DOTALL)
    return scripts, content

backup_scripts, backup_html = extract_scripts('برنامج مدرسة الشمامسة نهااائي.backup.html')
built_scripts, built_html = extract_scripts('برنامج مدرسة الشمامسة نهااائي.html')

print(f"Backup: {len(backup_scripts)} script blocks")
print(f"Built:  {len(built_scripts)} script blocks")
print()

# Compare sizes
for i, (b, n) in enumerate(zip(backup_scripts, built_scripts)):
    b_lines = b.count('\n')
    n_lines = n.count('\n')
    diff = n_lines - b_lines
    if abs(diff) > 2:
        print(f"Script block {i+1}: backup={b_lines} lines, built={n_lines} lines, DIFF={diff:+d}")
        # Show first 80 chars
        print(f"  Backup starts: {b[:80].strip()}")
        print(f"  Built  starts: {n[:80].strip()}")
        print()

# Check if there are extra or missing script blocks
if len(backup_scripts) != len(built_scripts):
    print(f"\nDIFFERENT NUMBER OF SCRIPT BLOCKS!")
    if len(built_scripts) > len(backup_scripts):
        for i in range(len(backup_scripts), len(built_scripts)):
            print(f"  Extra block {i+1}: {built_scripts[i][:100].strip()}")
    else:
        for i in range(len(built_scripts), len(backup_scripts)):
            print(f"  Missing block {i+1}: {backup_scripts[i][:100].strip()}")
