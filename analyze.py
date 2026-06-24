import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# The backup is the ORIGINAL working monolith
# The build.py splits src/index.html + src/**/*.js into the output
# The problem is that the src/*.js files were split incorrectly from the original

# Strategy: Extract all JS from backup, then figure out correct split points

with open('برنامج مدرسة الشمامسة نهااائي.backup.html', 'r', encoding='utf-8') as f:
    backup = f.read()

# Find all script blocks
pattern = r'<script>(.*?)</script>'
scripts = re.findall(pattern, backup, re.DOTALL)

print(f"Backup has {len(scripts)} script blocks")
for i, s in enumerate(scripts):
    lines = s.count('\n')
    first_line = s.strip().split('\n')[0][:120] if s.strip() else '(empty)'
    print(f"  Block {i+1}: {lines} lines - starts with: {first_line}")

# Now read src/index.html to see what script tags point to what files
with open('src/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Find all script src references
src_refs = re.findall(r'<script src="([^"]+)">', index_html)
print(f"\nsrc/index.html references {len(src_refs)} script files:")
for r in src_refs:
    exists = os.path.exists(r.lstrip('./'))
    print(f"  {r}  {'EXISTS' if exists else 'MISSING'}")

# Find inline script blocks in index.html
inline_scripts = re.findall(r'<script>(.*?)</script>', index_html, re.DOTALL)
print(f"\nsrc/index.html has {len(inline_scripts)} inline script blocks")
for i, s in enumerate(inline_scripts):
    lines = s.count('\n')
    first_line = s.strip().split('\n')[0][:120] if s.strip() else '(empty)'
    print(f"  Inline block {i+1}: {lines} lines - starts with: {first_line}")
