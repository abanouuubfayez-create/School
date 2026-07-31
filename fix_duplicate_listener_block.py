# Read app.js
with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove lines 6768 to 6775 (1-based lines, which correspond to indices 6767 to 6774)
# Let's inspect the lines around there to be completely sure:
# lines[6766] = "    });\n"
# lines[6767] = "        \n"
# lines[6768] = "        if(!hasActive) {\n"
# lines[6769] = "            listContainer.innerHTML = '<div style=\"color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;\">لا توجد اجتماعات أو مكالمات نشطة حالياً.</div>';\n"
# lines[6770] = "        } else {\n"
# lines[6771] = "            listContainer.innerHTML = html;\n"
# lines[6772] = "        }\n"
# lines[6773] = "    });\n"
# lines[6774] = "};\n"

# Let's print out what we see at those lines to make sure
start_del = 6767 # 0-indexed line 6768
end_del = 6775   # 0-indexed line 6776

print("Lines to delete:")
for i in range(start_del, end_del):
    print(f"{i+1}: {lines[i]}")

# Delete the lines
del lines[start_del:end_del]

# Write back
with open('app.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Duplicate lines removed successfully!")
