const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Replace font import
css = css.replace(/@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Cairo.*?display=swap'\);/, `@import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');`);

// Replace variables
css = css.replace(/:root\s*\{[\s\S]*?\}/, `:root {
    --nv: #0f172a;
    --nv2: #1e293b;
    --nv3: #020617;
    --gd: #f59e0b;
    --gd2: #d97706;
    --gdl: #fef3c7;
    --gdl2: #fde68a;
    --bg: #f8fafc;
    --w: #ffffff;
    --tx: #0f172a;
    --tx2: #334155;
    --tx3: #64748b;
    --bd: #e2e8f0;
    --bd2: #cbd5e1;
    --ok: #10b981;
    --no: #ef4444;
    --wn: #eab308;
    --inf: #3b82f6;
    --r: 12px;
    --sb: 260px;
    --sh-sm: 0 4px 12px rgba(15, 23, 42, 0.04);
    --sh-md: 0 10px 30px rgba(15, 23, 42, 0.08);
    --sh-lg: 0 20px 50px rgba(15, 23, 42, 0.12);
    --tr: all .3s cubic-bezier(.4,0,.2,1);
}`);

// Replace 'Cairo' usages
css = css.replace(/'Cairo'/g, `'Alexandria', 'Inter'`);

// Make .bt more dynamic
css = css.replace(/\.bt:active \{.*?\}/, `.bt:active { transform: scale(.95); }`);

fs.writeFileSync('styles.css', css);
console.log('styles.css updated');
