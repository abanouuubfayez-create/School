
        // ══════════════════════════════════════════════════════════
        // ⏱️ نظام النسخ الاحتياطي التلقائي
        // ══════════════════════════════════════════════════════════
        const AUTO_BACKUP_KEY = 'school_auto_backups_v1';
        const AUTO_BACKUP_SETTINGS = 'school_backup_settings_v1';
        let _backupTimer = null, _backupNextAt = 0, _backupCountdownTimer = null;

        function getStoredBackups() { try { return JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY) || '[]'); } catch (e) { return []; } }
        function saveStoredBackups(arr) { try { localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(arr)); } catch (e) { showToast('⚠️ فشل حفظ النسخة — المساحة ممتلئة'); } }

        function takeManualBackup() {
            if (!DB) { showToast('⚠️ البيانات غير محملة بعد'); return; }
            const keep = parseInt(document.getElementById('backup-keep-sel')?.value || '5');
            const backups = getStoredBackups();
            backups.unshift({ ts: Date.now(), label: new Date().toLocaleString('ar-EG'), manual: true, students: (DB.students || []).length, year: DB.schoolYear || '', data: JSON.stringify(DB) });
            while (backups.length > keep) backups.pop();
            saveStoredBackups(backups);
            renderBackupSlots();
            showToast('✅ تم حفظ نسخة احتياطية — ' + new Date().toLocaleString('ar-EG'));
        }

        function takeAutoBackup() {
            if (!DB) return;
            const keep = parseInt(document.getElementById('backup-keep-sel')?.value || '5');
            const backups = getStoredBackups();
            const manuals = backups.filter(b => b.manual), autos = backups.filter(b => !b.manual);
            autos.unshift({ ts: Date.now(), label: new Date().toLocaleString('ar-EG'), manual: false, students: (DB.students || []).length, year: DB.schoolYear || '', data: JSON.stringify(DB) });
            const keepAuto = Math.max(1, keep - manuals.length);
            while (autos.length > keepAuto) autos.pop();
            saveStoredBackups([...manuals, ...autos].sort((a, b) => b.ts - a.ts));
            renderBackupSlots();
            showToast('💾 نسخة تلقائية — ' + new Date().toLocaleTimeString('ar-EG'));
        }

        function restoreFromBackup(ts) {
            const snap = getStoredBackups().find(b => b.ts === ts);
            if (!snap) { showToast('⚠️ لم أجد النسخة'); return; }
            if (!confirm('استعادة النسخة من ' + snap.label + '؟\nسيتم استبدال البيانات الحالية.')) return;
            try {
                DB = JSON.parse(snap.data); try { migrateStudentCodes(); } catch(e){}
                saveDB().then(() => { typeof renderStudents === 'function' && renderStudents(); typeof renderDashboard === 'function' && renderDashboard(); showToast('✅ تم الاستعادة من ' + snap.label); });
            } catch (e) { showToast('❌ خطأ في الاستعادة: ' + e.message); }
        }

        function deleteBackup(ts) {
            saveStoredBackups(getStoredBackups().filter(b => b.ts !== ts));
            renderBackupSlots();
        }

        function renderBackupSlots() {
            const el = document.getElementById('backup-slots-list'); if (!el) return;
            const backups = getStoredBackups();
            if (!backups.length) { el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:12px">لا توجد نسخ احتياطية بعد</div>'; return; }
            el.innerHTML = backups.map(b => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;border:1px solid var(--border);background:var(--bg);margin-bottom:7px;font-size:11px;transition:all .2s" onmouseover="this.style.background='#fff';this.style.boxShadow='0 3px 10px rgba(0,0,0,.07)'" onmouseout="this.style.background='var(--bg)';this.style.boxShadow=''">
      <div style="width:32px;height:32px;border-radius:9px;background:${b.manual ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)'};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${b.manual ? '🟢' : '🔵'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;color:var(--navy);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.label}</div>
        <div style="display:flex;gap:6px;margin-top:2px;align-items:center">
          <span style="font-size:9px;color:var(--muted)">👦 ${b.students} طالب</span>
          <span style="font-size:9px;color:var(--muted)">📅 ${b.year}</span>
          <span style="font-size:9px;font-weight:900;padding:1px 7px;border-radius:8px;background:${b.manual ? '#d1fae5' : '#dbeafe'};color:${b.manual ? '#065f46' : '#1e40af'}">${b.manual ? 'يدوي' : 'تلقائي'}</span>
        </div>
      </div>
      <button onclick="restoreFromBackup(${b.ts})" class="btn btn-sm btn-success" style="font-size:10px;padding:4px 9px" title="استعادة">↩️</button>
      <button onclick="deleteBackup(${b.ts})" class="btn btn-sm btn-danger" style="font-size:10px;padding:4px 9px" title="حذف">🗑️</button>
    </div>`).join('');
        }

        function updateAutoBackup() {
            if (_backupTimer) { clearInterval(_backupTimer); _backupTimer = null; }
            if (_backupCountdownTimer) { clearInterval(_backupCountdownTimer); _backupCountdownTimer = null; }
            const mins = parseInt(document.getElementById('backup-interval-sel')?.value || '0');
            const badge = document.getElementById('auto-backup-badge');
            const nextEl = document.getElementById('auto-backup-next');
            try { localStorage.setItem(AUTO_BACKUP_SETTINGS, JSON.stringify({ interval: mins, keep: parseInt(document.getElementById('backup-keep-sel')?.value || '5') })); } catch (e) { }
            if (mins === 0) {
                if (badge) { badge.textContent = 'متوقف'; badge.style.background = '#fef3c7'; badge.style.color = '#92400e'; }
                if (nextEl) nextEl.style.display = 'none';
                return;
            }
            if (badge) { badge.textContent = 'مفعّل ✅'; badge.style.background = '#d1fae5'; badge.style.color = '#065f46'; }
            if (nextEl) nextEl.style.display = 'block';
            const ms = mins * 60000;
            _backupNextAt = Date.now() + ms;
            _backupTimer = setInterval(() => { takeAutoBackup(); _backupNextAt = Date.now() + ms; }, ms);
            _backupCountdownTimer = setInterval(() => {
                const rem = Math.max(0, Math.round((_backupNextAt - Date.now()) / 1000));
                const el = document.getElementById('backup-countdown');
                if (el) el.textContent = (rem >= 60 ? Math.floor(rem / 60) + 'د ' : '') + rem % 60 + 'ث';
            }, 1000);
        }

        function initAutoBackup() {
            try {
                const s = JSON.parse(localStorage.getItem(AUTO_BACKUP_SETTINGS) || '{}');
                if (s.interval) { const sel = document.getElementById('backup-interval-sel'); if (sel) sel.value = s.interval; }
                if (s.keep) { const ksel = document.getElementById('backup-keep-sel'); if (ksel) ksel.value = s.keep; }
                if (s.interval > 0) updateAutoBackup();
            } catch (e) { }
            renderBackupSlots();
        }


        document.addEventListener('DOMContentLoaded', () => setTimeout(initAutoBackup, 1500));
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => { try { if (!localStorage.getItem('bsh_img_migrated_v1') && typeof IS_EDIT_MODE !== 'undefined' && IS_EDIT_MODE) cleanupBase64Images(true); } catch (e) { } }, 5000));
    