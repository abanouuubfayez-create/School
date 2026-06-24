import os
import esprima

scripts = [
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
    
    try:
        esprima.parseScript(content)
        print(f"OK: {s}")
    except Exception as e:
        print(f"ERROR in {s}: {e}")
