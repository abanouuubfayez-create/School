import codecs

with codecs.open('index.html', 'r', 'utf-8') as f:
    content = f.read()

target = """  window.addEventListener('beforeprint', function () {
    var b = document.getElementById('ppBar'); if (b) b.style.display = 'none';"""

# Handle crlf vs lf
target_crlf = target.replace('\n', '\r\n')

replacement = """  window.addEventListener('beforeprint', function () {
    var b = document.getElementById('ppBar'); if (b) b.style.display = 'none';
    
    // --- Save to Archive ---
    if(window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin') && window.db) {
      var activePg = document.querySelector('.pg.a');
      // don't archive pages that don't have FL (like pure settings pages)
      if(activePg && activePg.querySelector('.FL')) {
        var clone = activePg.cloneNode(true);
        var origInputs = activePg.querySelectorAll('input, textarea, select');
        var cloneInputs = clone.querySelectorAll('input, textarea, select');
        origInputs.forEach(function(el, i) {
          if(cloneInputs[i]) {
            if(el.type==='checkbox'||el.type==='radio') { if(el.checked) cloneInputs[i].setAttribute('checked','checked'); }
            else cloneInputs[i].setAttribute('value', el.value);
            if(el.tagName==='TEXTAREA') cloneInputs[i].textContent = el.value;
          }
        });
        var docTitle = 'مستند';
        var titleEl = clone.querySelector('.FL-doctype');
        if(titleEl) docTitle = titleEl.textContent.trim();
        var empName = 'غير محدد';
        var nameEl = clone.querySelector('input[data-fid="name"], input[placeholder*="اسم"]');
        if(nameEl && nameEl.value) empName = nameEl.value;
        else {
            var lineLbls = clone.querySelectorAll('.FL-line-lbl');
            for(var j=0; j<lineLbls.length; j++){
                if(lineLbls[j].textContent.indexOf('الاسم') > -1 || lineLbls[j].textContent.indexOf('الموظف') > -1) {
                    var nVal = lineLbls[j].nextElementSibling;
                    if(nVal && nVal.textContent) { empName = nVal.textContent.trim(); break; }
                }
            }
        }
        var fullHtml = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><link rel="stylesheet" href="styles.css"></head><body style="background:#fff;padding:20px;">' + clone.innerHTML + '</body></html>';
        db.collection('docArchive').add({
          docTitle: docTitle,
          employeeName: empName,
          htmlContent: fullHtml,
          createdAt: new Date(),
          savedBy: TG_USER.uid
        }).catch(function(e){ console.error('Archive err:', e); });
      }
    }
    // -----------------------"""

replacement_crlf = replacement.replace('\n', '\r\n')

if target in content:
    content = content.replace(target, replacement)
    print("Replaced LF")
elif target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf)
    print("Replaced CRLF")
else:
    print("Target not found!")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(content)
