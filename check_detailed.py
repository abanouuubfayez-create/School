import os

def check_balance(text, name):
    stack = []
    in_string = False
    string_char = ''
    in_line_comment = False
    in_block_comment = False
    escape = False
    in_regex = False
    prev_significant = ''

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
            if string_char == '`' and char == '$' and i+1 < len(text) and text[i+1] == '{':
                # template literal expression - skip the $
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
                line = text[:i].count('\n') + 1
                col = i - text.rfind('\n', 0, i)
                ctx = text[max(0,i-40):i+40].replace('\n', '\\n')
                print(f"  ERROR: Extra closing '{char}' at line {line}, col {col}")
                print(f"    Context: ...{ctx}...")
                return False
            top, pos = stack.pop()
            expected = {'{': '}', '[': ']', '(': ')'}[top]
            if char != expected:
                line = text[:i].count('\n') + 1
                open_line = text[:pos].count('\n') + 1
                print(f"  ERROR: Mismatched '{char}' at line {line}. Expected '{expected}' to close '{top}' opened at line {open_line}")
                return False

    if stack:
        top, pos = stack[-1]
        line = text[:pos].count('\n') + 1
        print(f"  ERROR: Unclosed '{top}' at line {line} (and {len(stack)-1} more unclosed)")
        # Show the last few unclosed
        for j in range(max(0, len(stack)-5), len(stack)):
            ch, p = stack[j]
            ln = text[:p].count('\n') + 1
            ctx_start = text.rfind('\n', 0, p)
            ctx_end = text.find('\n', p)
            if ctx_start == -1: ctx_start = 0
            if ctx_end == -1: ctx_end = len(text)
            line_text = text[ctx_start:ctx_end].strip()
            if len(line_text) > 100: line_text = line_text[:100] + '...'
            print(f"    Unclosed '{ch}' at line {ln}: {line_text}")
        return False
        
    return True


scripts = [
    'src/core/config.js',
    'src/application/auth.js',
    'src/domain/student_rules.js',
    'src/presentation/views/ui_views.js',
    'src/presentation/views/print_views.js',
    'src/application/excel.js',
    'src/application/deacons.js',
    'src/application/schedule.js',
    'src/application/certificate.js',
    'src/application/globalSearch.js',
    'src/presentation/router/pageMetadata.js'
]

for s in scripts:
    if not os.path.exists(s):
        continue
    with open(s, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"\nChecking {s} ({len(content)} bytes, {content.count(chr(10))} lines)...")
    ok = check_balance(content, s)
    if ok:
        print(f"  OK")
