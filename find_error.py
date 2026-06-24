import re

def check_balance(text, name):
    stack = []
    in_string = False
    string_char = ''
    in_line_comment = False
    in_block_comment = False
    escape = False

    for i, char in enumerate(text):
        if in_line_comment:
            if char == '\n':
                in_line_comment = False
            continue
            
        if in_block_comment:
            if char == '*' and i+1 < len(text) and text[i+1] == '/':
                in_block_comment = False
            continue

        if in_string:
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
            if char == string_char:
                in_string = False
            continue

        if char in '"\'`':
            in_string = True
            string_char = char
            continue

        if char == '/' and i+1 < len(text):
            if text[i+1] == '/':
                in_line_comment = True
                continue
            if text[i+1] == '*':
                in_block_comment = True
                continue

        if char in '{[(':
            stack.append((char, i))
        elif char in ')]}':
            if not stack:
                print(f"Error in {name}: Extra closing '{char}' at index {i}")
                return
            top, pos = stack.pop()
            expected = {'{': '}', '[': ']', '(': ')'}[top]
            if char != expected:
                print(f"Error in {name}: Mismatched '{char}' at index {i}. Expected '{expected}' to close '{top}' at {pos}")
                return

    if stack:
        top, pos = stack.pop()
        lines = text[:pos].count('\n') + 1
        print(f"Error in {name}: Unclosed '{top}' at line {lines} (index {pos})")
        return
        
    print(f"OK: {name}")


import os
import bs4

with open('برنامج مدرسة الشمامسة نهااائي.html', 'r', encoding='utf-8') as f:
    soup = bs4.BeautifulSoup(f.read(), 'html.parser')

scripts = soup.find_all('script')
for i, script in enumerate(scripts):
    if script.string:
        check_balance(script.string, f"Script block {i+1}")
