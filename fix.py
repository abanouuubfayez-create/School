import codecs

with codecs.open('app.js', 'r', 'utf-8') as f:
    content = f.read()

target = """    fetch('styles.css?v='+Date.now()).then(function(res){return res.text();}).then(function(css){
        var doc=ifr.contentWindow.document;
        doc.open();
        doc.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'+
            (docTitle ? '<title>'+docTitle+'</title>' : '') +
            '<style>'+css+'</style></head><body>'+bodyHtml+'</body></html>');
        doc.close();"""

# Handle crlf vs lf
target_crlf = target.replace('\n', '\r\n')

replacement = """    fetch('styles.css?v='+Date.now()).then(function(res){return res.text();}).then(function(css){
        var doc=ifr.contentWindow.document;
        var fullHtml = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'+
            (docTitle ? '<title>'+docTitle+'</title>' : '') +
            '<style>'+css+'</style></head><body>'+bodyHtml+'</body></html>';
            
        if(window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin')) {
            var tmp = document.createElement('div');
            tmp.innerHTML = bodyHtml;
            var empName = 'غير محدد';
            var nFld = tmp.querySelector('input[data-fid="name"]');
            if(nFld && nFld.value) empName = nFld.value;
            else {
                var lineLbls = tmp.querySelectorAll('.FL-line-lbl');
                for(var i=0; i<lineLbls.length; i++){
                    if(lineLbls[i].textContent.indexOf('الاسم') > -1 || lineLbls[i].textContent.indexOf('الموظف') > -1) {
                        var nVal = lineLbls[i].nextElementSibling;
                        if(nVal && nVal.textContent) { empName = nVal.textContent.trim(); break; }
                    }
                }
            }
            db.collection('docArchive').add({
                docTitle: docTitle || 'مستند',
                employeeName: empName,
                htmlContent: fullHtml,
                createdAt: new Date(),
                savedBy: TG_USER.uid
            }).catch(function(e){ console.error('Archive err:', e); });
        }

        doc.open();
        doc.write(fullHtml);
        doc.close();"""

replacement_crlf = replacement.replace('\n', '\r\n')

if target in content:
    content = content.replace(target, replacement)
    print("Replaced LF")
elif target_crlf in content:
    content = content.replace(target_crlf, replacement_crlf)
    print("Replaced CRLF")
else:
    print("Target not found!")

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(content)
