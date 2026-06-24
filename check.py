import os
import re

scripts = [
    'public/lib/xlsx.min.js',
    'public/lib/jspdf.umd.min.js',
    'public/lib/jspdf.plugin.autotable.min.js',
    'public/lib/qrcode.min.js',
    'src/core/config.js',
    'src/application/auth.js',
    'src/core/db.js',
    'src/domain/rules.js',
    'src/domain/student_rules.js',
    'src/presentation/views/ui_views.js',
    'src/presentation/views/print_views.js',
    'src/application/excel.js',
    'src/application/deacons.js',
    'src/application/schedule.js',
    'src/application/certificate.js',
    'src/presentation/router/pageMetadata.js'
]

for s in scripts:
    if not os.path.exists(s): continue
    with open(s, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove single line comments
    content = re.sub(r'//.*', '', content)
    # Remove block comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # Remove strings
    content = re.sub(r'\"(?:[^\"\\\\]|\\\\.)*\"', '', content)
    content = re.sub(r'\'(?:[^\'\\\\]|\\\\.)*\'', '', content)
    content = re.sub(r'\`(?:[^\`\\\\]|\\\\.)*\`', '', content)
    
    open_braces = content.count('{')
    close_braces = content.count('}')
    open_parens = content.count('(')
    close_parens = content.count(')')
    
    if open_braces != close_braces or open_parens != close_parens:
        print(f'{s}: braces {open_braces}/{close_braces}, parens {open_parens}/{close_parens}')
