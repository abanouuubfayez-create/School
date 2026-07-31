const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(
    'var empCount=res[0].size, projCount=res[1].size;',
    'var empCount=res[0].size, projCount=res[1].size;\n        var tpd = document.getElementById("tpd");\n        if(tpd) {\n            tpd.textContent = projCount;\n            tpd.style.display = "inline-flex";\n        }'
);

content = content.replace(
    'document.addEventListener(\'keydown\',unlock);',
    'document.addEventListener(\'keydown\',unlock);\n\n    document.addEventListener(\'mousedown\', function(e) {\n        var panel = document.getElementById(\'tgChatPanel\');\n        var bubble = document.getElementById(\'tgChatBubble\');\n        var emoji = document.getElementById(\'tgEmojiWrap\');\n        if (_chatWidgetOpen && panel && bubble && !panel.contains(e.target) && !bubble.contains(e.target)) {\n            if (emoji && emoji.contains(e.target)) return;\n            tgChatToggle(false);\n        }\n    });'
);

fs.writeFileSync('app.js', content, 'utf8');
