import os

with open('theme.js', 'r', encoding='utf-8') as f:
    content = f.read()

fallback_code = """
    // Aggressive fallback to catch any date inputs that escape the observer
    setInterval(function() {
        if (typeof flatpickr !== 'undefined') {
            var dateInputs = document.querySelectorAll('input[type="date"]');
            for (var i = 0; i < dateInputs.length; i++) {
                if (!dateInputs[i]._flatpickr) {
                    applyFlatpickr(dateInputs[i]);
                }
            }
        }
    }, 500);
"""

if 'setInterval' not in content:
    content = content.replace('observer.observe(document.body, { childList: true, subtree: true });', 
                              'observer.observe(document.body, { childList: true, subtree: true });\n' + fallback_code)
    
    with open('theme.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Added setInterval fallback to theme.js')
