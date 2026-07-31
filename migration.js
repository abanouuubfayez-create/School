// Migration Script to add jobTitles to names globally
window.tgMigrateNames = function() {
    if(!confirm('هل أنت متأكد من تشغيل سكريبت دمج المسميات الوظيفية؟ (يجب أن يتم مرة واحدة فقط)')) return;
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1b2a4a;color:#fff;padding:14px 28px;border-radius:10px;z-index:99999;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    msg.textContent = '⏳ جاري الدمج (تحديث الموظفين)...';
    document.body.appendChild(msg);

    var usersMap = {};

    // 1. Update all users
    db.collection('users').get().then(function(snap) {
        var batch = db.batch();
        var count = 0;
        snap.forEach(function(doc) {
            var data = doc.data();
            var jobTitle = data.jobTitle || '';
            var baseName = data.baseName || data.name || '';
            
            // Clean up if it already has parenthesis
            if (baseName.includes(' (')) {
                baseName = baseName.split(' (')[0].trim();
            }
            
            var finalName = jobTitle ? baseName + ' (' + jobTitle + ')' : baseName;
            
            usersMap[doc.id] = finalName;
            
            batch.update(doc.ref, {
                baseName: baseName,
                name: finalName
            });
            count++;
        });
        
        return batch.commit().then(function() {
            msg.textContent = '⏳ تم تحديث الموظفين (' + count + '). جاري تحديث المهام والمشاريع...';
            return migrateTasksAndProjects(usersMap);
        });
    }).then(function() {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        alert('✅ تم الانتهاء من تحديث جميع الأسماء والمهام والمشاريع في النظام بنجاح!');
        location.reload();
    }).catch(function(err) {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        alert('❌ حدث خطأ: ' + err.message);
    });

    function migrateTasksAndProjects(uMap) {
        var promises = [];
        
        // Update Tasks
        var p1 = db.collection('tasks').get().then(function(snap) {
            var batch = db.batch();
            snap.forEach(function(doc) {
                var d = doc.data();
                var updates = {};
                var changed = false;
                if (d.assignedTo && uMap[d.assignedTo] && d.assignedToName !== uMap[d.assignedTo]) {
                    updates.assignedToName = uMap[d.assignedTo];
                    changed = true;
                }
                if (d.createdByUid && uMap[d.createdByUid] && d.createdBy !== uMap[d.createdByUid]) {
                    updates.createdBy = uMap[d.createdByUid];
                    changed = true;
                }
                if (changed) batch.update(doc.ref, updates);
            });
            return batch.commit();
        });
        promises.push(p1);

        // Update Projects
        var p2 = db.collection('projects').get().then(function(snap) {
            var batch = db.batch();
            snap.forEach(function(doc) {
                var d = doc.data();
                var updates = {};
                var changed = false;
                if (d.assignedTo && uMap[d.assignedTo] && d.assignedToName !== uMap[d.assignedTo]) {
                    updates.assignedToName = uMap[d.assignedTo];
                    changed = true;
                }
                if (d.createdByUid && uMap[d.createdByUid] && d.createdBy !== uMap[d.createdByUid]) {
                    updates.createdBy = uMap[d.createdByUid];
                    changed = true;
                }
                if (changed) batch.update(doc.ref, updates);
            });
            return batch.commit();
        });
        promises.push(p2);

        return Promise.all(promises);
    }
};
