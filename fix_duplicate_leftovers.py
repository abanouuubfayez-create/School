# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's inspect the lines around index 6891 (line 6892, 1-based is index 6891)
# lines[6891] = " color:${dotColor}; font-weight:bold; display:inline-flex; align-items:center; gap:5px;\">\n"
# We delete from index 6891 to 6907 (index 6907 is line 6908, 1-based, which is empty or end of file)
start_del = 6891
end_del = 6907

print("Deleting leftover lines:")
for i in range(start_del, min(end_del, len(lines))):
    print(f"{i+1}: {lines[i]}")

del lines[start_del:end_del]

with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Leftover lines deleted successfully!")
