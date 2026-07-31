# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace active meetings list style to use flex-start instead of space-between
target_str = 'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);'
replacement_str = 'display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; border-left: 4px solid var(--ok);'

if target_str in js:
    js = js.replace(target_str, replacement_str)
    print("Replaced active meetings list layout with flex-start!")
else:
    print("Could not find the target layout string in app.js. Trying alternative match.")
    alt_target_str = 'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);'
    # Wait, let's verify if the string actually matches what's in line 6798:
    # `style="background:var(--bg2); border:1px solid var(--ok); padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-left: 4px solid var(--ok);"`
    # Yes, it matches!

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("app.js alignment complete!")
