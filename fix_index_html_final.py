import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's clean up the FIRST (broken) modal in index.html (the one inside the javascript template)
# The template is: var fullHtml = '<!DOCTYPE html>...[broken modal]...</body>\n</html>\';
# We will match the entire fullHtml assignment and replace it with a clean single line.

clean_full_html = "var fullHtml = '<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\"><link rel=\"stylesheet\" href=\"styles.css\"></head><body style=\"background:#fff;padding:20px;\">' + clone.innerHTML + '</body></html>';"

# Find: var fullHtml = '<!DOCTYPE html>... up to: </html>';
# We can use regex with re.DOTALL, but let's be careful.
pattern = re.compile(r"var fullHtml = '<!DOCTYPE html>.*?</html>';", re.DOTALL)
if pattern.search(html):
    html = pattern.sub(clean_full_html, html)
    print("Cleaned up broken modal inside JS string literal.")
else:
    print("Could not match the fullHtml block.")

# Now, let's clean up any multiple/duplicate modal instances at the end of index.html
# We will find where the ACTUAL html ends.
# The index.html should end with:
# <!-- Incoming Meeting Call Modal -->
# ...
# </body>
# </html>
# Let's remove any other instances of `incomingMeetingModal` that might be lingering.

# Let's split the file at the LAST '<!-- Incoming Meeting Call Modal -->'
parts = html.split('<!-- Incoming Meeting Call Modal -->')
if len(parts) > 1:
    # Keep everything before the first '<!-- Incoming Meeting Call Modal -->'
    # and we will append a single clean modal at the end.
    base_html = parts[0]
    
    # We need to make sure base_html ends with whatever was before the modal (which is probably some script or closing tags, let's check)
    # Actually, the original index.html ended with:
    # </body>
    # </html>
    # So base_html should end with </body>\n</html> if we completely stripped the modal.
    # But wait, did we strip the actual closing tags?
    # Let's make sure base_html has the correct closing tags.
    if not base_html.strip().endswith('</html>'):
        # If it doesn't end with </html>, we might have cut it inside.
        # Let's clean it up by finding the closing tags in the last part and restoring them.
        pass
    
    # Actually, let's do a simpler approach:
    # Find all occurrences of the modal and remove them, leaving the original index.html.
    # Then append it exactly before the last </body>
    
# Let's just do a clean replacement of index.html from a backup or clean structure.
# Wait, can we read the original index.html file?
# We have git! We can run `git checkout index.html` to restore it to the last commit,
# but the last commit also had the broken modal inside the JS template.
# Let's restore index.html to a clean state by checking it out from a commit BEFORE we introduced this.
# Which commit? Let's check `git log index.html` to see the history.
