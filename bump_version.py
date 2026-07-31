import re
import os

new_version = "?v=181818"

for filename in ['index.html', 'employee.html', 'login.html']:
    if not os.path.exists(filename):
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace ?v=xxxxxx with ?v=181818
    content = re.sub(r'\?v=\d+', new_version, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print("Bumped version to 181818")
