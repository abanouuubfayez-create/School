import os
import glob

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'reak;case"D"' in content:
            content = content.replace('reak;case"D"', 'break;case"D"')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

base_dir = r"C:\Users\abano\OneDrive\Desktop\مدرسة"
for root, dirs, files in os.walk(base_dir):
    for name in files:
        if name.endswith('.html') or name.endswith('.js'):
            fix_file(os.path.join(root, name))
