const fs = require('fs');
let content = fs.readFileSync('styles.css', 'utf8');

content = content.replace(
    '.notif-panel {',
    '.notif-panel {\n    z-index: 9999;'
);

fs.writeFileSync('styles.css', content, 'utf8');
