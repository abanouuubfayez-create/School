import os
import time
import re

ts = str(int(time.time()))

for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # replace ?v=d+ with ?v=TIMESTAMP
            new_content = re.sub(r'\?v=\d+', f'?v={ts}', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated cache buster in {filepath}")
