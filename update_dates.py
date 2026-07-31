import os
import re

count = 0
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith(('.html', '.js')):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Use regex to add lang="en-GB" to any <input type="date">
            # Ensure it doesn't already have lang="en-GB"
            
            # Simple replace:
            new_content = content.replace('type="date"', 'type="date" lang="en-GB"')
            # Since HTML might already have it from previous run, let's dedup if any:
            new_content = new_content.replace('lang="en-GB" lang="en-GB"', 'lang="en-GB"')
            
            # Also catch single quotes type='date'
            new_content = new_content.replace("type='date'", "type='date' lang='en-GB'")
            new_content = new_content.replace("lang='en-GB' lang='en-GB'", "lang='en-GB'")
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Updated {filepath}")
                count += 1

print(f"Total files updated: {count}")
