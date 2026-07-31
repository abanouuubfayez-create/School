const fs = require('fs');
const files = ['index.html', 'employee.html', 'login.html', 'setup.html', 'attendance.html'];
const v = Date.now().toString().slice(-6);

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    
    content = content.replace(/styles\.css(\?v=\d+)?/g, `styles.css?v=${v}`);
    content = content.replace(/theme\.js(\?v=\d+)?/g, `theme.js?v=${v}`);
    content = content.replace(/app\.js(\?v=\d+)?/g, `app.js?v=${v}`);
    content = content.replace(/auth\.js(\?v=\d+)?/g, `auth.js?v=${v}`);
    
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated cache buster in ${f}`);
});
