with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The first callGemini is likely inside adminGenerateSuggestions, the second is in generateCareerPath.
# Let's be precise by using regex.
import re
content = re.sub(
    r"(window\.adminGenerateSuggestions\s*=\s*function\(\)\s*\{[\s\S]*?callGemini\(.*?), false\);",
    r"\1, true);",
    content
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done fixing isAdmin flag in adminGenerateSuggestions")
