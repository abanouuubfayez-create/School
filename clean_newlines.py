with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace all escaped '\\n' strings with actual newlines '\n'
# But only in the meetings section
# Let's just find if it contains '\\n' and replace it
# Wait, we can replace '\\n' with '\n' in the entire file if we are careful,
# but to be extremely safe, let's just do it on the part we added.

start_idx = js.find('window.startNewMeeting = async function')
if start_idx != -1:
    meetings_part = js[start_idx:]
    # Replace the escaped \\n text with actual newlines
    meetings_part_clean = meetings_part.replace('\\n', '\n')
    js = js[:start_idx] + meetings_part_clean
    print("Cleaned up backslash-n escapes in app.js!")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
