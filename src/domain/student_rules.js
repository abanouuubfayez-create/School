        function applyTeacherMode() {
            document.getElementById('app').style.display = 'block';
            const ta = document.getElementById('teacher-app');
            if (ta) ta.style.display = 'none';

            const allowed = new Set(['absence', 'teacher-profile']);
            if (TEACHER_PERMS.exams) allowed.add('exams');
            if (TEACHER_PERMS.students) allowed.add('students');
            if (TEACHER_PERMS.results) { allowed.add('results'); }
            if (TEACHER_PERMS.graduation) { allowed.add('graduation-certs'); }

            document.querySelectorAll('.nav-item[data-perm], .nav-section').forEach(el => {
                if (el.classList.contains('nav-section')) { el.style.display = ''; return; }
                const perm = el.getAttribute('data-perm');
                const onclick = el.getAttribute('onclick') || '';
                if (perm === 'admin') {
                    // شهادات التخرج
                    if (onclick.includes("'graduation-certs'") && TEACHER_PERMS.graduation) { el.style.display = ''; }
                    // شهادة التخرج النهائية
                    else if (onclick.includes("'final-cert'") && TEACHER_PERMS.graduation) { el.style.display = ''; }
                    // صفحة الخريجين
                    else if (onclick.includes("'graduates'") && TEACHER_PERMS.graduation) { el.style.display = ''; }
                    // كتب المدرسة
                    else if (onclick.includes("'books'") && TEACHER_PERMS.books) { el.style.display = ''; }
                    // جدول الحصص التفصيلي
                    else if (onclick.includes("'schedule-detail'") && TEACHER_PERMS.scheduleDetail) { el.style.display = ''; }
                    // ملفات الامتحانات
                    else if (onclick.includes("'exam-files'") && TEACHER_PERMS.examFiles) { el.style.display = ''; }
                    // الصور والوسائط
                    else if (onclick.includes("'media'") && TEACHER_PERMS.media) { el.style.display = ''; }
                    else { el.style.display = 'none'; }
                } else if (perm === 'deacons') {
                    el.style.display = TEACHER_PERMS.deacons ? '' : 'none';
                } else if (perm === 'dashboard') {
                    el.style.display = 'none';
                } else if (perm === 'teacher-profile') {
                    el.style.display = ''; // always show for teacher
                } else {
                    el.style.display = allowed.has(perm) ? '' : 'none';
                }
            });

            // Hide empty nav-sections
            document.querySelectorAll('.nav-section').forEach(sec => {
                let next = sec.nextElementSibling;
                let hasVisible = false;
                while (next && !next.classList.contains('nav-section')) {
                    if (next.classList.contains('nav-item') && next.style.display !== 'none') { hasVisible = true; break; }
                    next = next.nextElementSibling;
                }
                sec.style.display = hasVisible ? '' : 'none';
            });

            navigate('teacher-profile');
        }
        async function changeCredentials() {
            if (!IS_EDIT_MODE) { showToast('⚠️ وضع عرض فقط'); return; }
            const errEl = document.getElementById('creds-err');
            const currentPass = document.getElementById('current-password').value;
            const u = document.getElementById('new-username').value.trim();
            const p = document.getElementById('new-password').value;
            if (errEl) errEl.textContent = '';
            // تحقق من كلمة المرور الحالية أولاً
            if (!currentPass) {
                if (errEl) errEl.textContent = '❌ أدخل كلمة المرور الحالية للتأكيد';
                return;
            }
            const creds = await getCredentials();
            if (currentPass !== creds.password) {
                if (errEl) errEl.textContent = '❌ كلمة المرور الحالية غير صحيحة';
                document.getElementById('current-password').value = '';
                return;
            }
            if (!u || !p) { showToast('⚠️ أدخل اسم المستخدم وكلمة المرور الجديدة'); return; }
            await storeSave(CRED_KEY, JSON.stringify({ username: u, password: p }));
            showToast('✅ تم تحديث بيانات الدخول بنجاح');
            document.getElementById('current-password').value = '';
            document.getElementById('new-username').value = '';
            document.getElementById('new-password').value = '';
            if (errEl) errEl.textContent = '';
        }

        // =========================================================
        // DB
        // =========================================================
        function initSubjects() {
            const s = {};
            const def = [{ name: 'طقس', behavior: 10, oral: 30, attendance: 10, written: 0 }, { name: 'ألحان', behavior: 10, oral: 30, attendance: 10, written: 0 }, { name: 'قبطي', behavior: 10, oral: 10, attendance: 10, written: 20 }];
            STAGES.forEach(st => { s[st] = JSON.parse(JSON.stringify(def)); });
            return s;
        }
        function newDB() {
            return {
                students: [], subjects: initSubjects(), grades: {}, absence: {}, notes: {},
                registeredTeachers: [], teacherNotifs: [], teacherLog: [],
                settings: { passPct: 50, exPct: 90, vgPct: 80, gPct: 65, accPct: 50, bdayDays: 7, customStages: null },
                schoolYear: '2025/2026', nextId: 1, codeCounters: {}
            };
        }
        async function saveDB() {
            const ok = await storeSave(DB_KEY, JSON.stringify(DB));
            // تحديث مؤشر الحفظ في الشريط
            try {
                const si = document.getElementById('_save_indicator');
                if (si) { si.textContent = ok ? '💾 محفوظ ✅' : '⚠️ فشل الحفظ!'; si.style.color = ok ? '#1a5c2a' : '#c0392b'; clearTimeout(si._t); si._t = setTimeout(() => { si.textContent = ''; }, 3000); }
            } catch (e) { }
            return ok;
        }
        async function loadDB() {
            const raw = await storeLoad(DB_KEY);
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
            return newDB();
        }

        // =========================================================
        // STUDENT PERMANENT CODE SYSTEM (v32+)
        // الكود الدائم للطالب: المرحلة + السنة + تسلسلي
        // مثال: P-26-001 ، M-26-014 ، S-25-003 ، KG-26-007
        // - ثابت من الالتحاق حتى التخرج (لا يتغيّر بالترقية)
        // - لا يتكرّر أبداً مع أي طالب آخر
        // =========================================================
        function stagePrefix(stage) {
            const s = String(stage || '');
            if (s.indexOf('حضانة') !== -1) return 'KG';
            if (s.indexOf('ابتدائي') !== -1) return 'P';
            if (s.indexOf('إعدادي') !== -1 || s.indexOf('اعدادي') !== -1) return 'M';
            if (s.indexOf('ثانوي') !== -1) return 'S';
            return 'X';
        }
        function shortYear(year) {
            const y = String(year || (DB && DB.schoolYear) || '');
            const m = y.match(/(\d{4})/g);
            if (m && m.length) {
                const yy = m[m.length - 1];
                return yy.slice(-2);
            }
            const m2 = y.match(/\d{2}/);
            return m2 ? m2[0] : '00';
        }
        function _existingCodesSet() {
            const set = new Set();
            (DB.students || []).forEach(s => { if (s && s.code) set.add(s.code); });
            return set;
        }
        function generateStudentCode(stage, year) {
            if (!DB.codeCounters) DB.codeCounters = {};
            const pre = stagePrefix(stage);
            const yy = shortYear(year);
            const key = pre + '-' + yy;
            const used = _existingCodesSet();
            let n = (DB.codeCounters[key] || 0) + 1;
            let code;
            // ابحث عن أول رقم تسلسلي غير مستخدم
            while (true) {
                code = pre + '-' + yy + '-' + String(n).padStart(3, '0');
                if (!used.has(code)) break;
                n++;
            }
            DB.codeCounters[key] = n;
            return code;
        }
        // Migration: توليد كود لكل طالب قديم بدون كود + ضبط العدّادات
        function migrateStudentCodes() {
            if (!DB || !Array.isArray(DB.students)) return;
            if (!DB.codeCounters) DB.codeCounters = {};
            // أولاً: امسح أعلى تسلسلي مستخدم فعلياً لكل (بادئة+سنة) من الأكواد الموجودة
            DB.students.forEach(s => {
                if (s && s.code) {
                    const m = String(s.code).match(/^([A-Z]+)-(\d{2})-(\d+)$/);
                    if (m) {
                        const key = m[1] + '-' + m[2];
                        const num = parseInt(m[3], 10);
                        if (!DB.codeCounters[key] || DB.codeCounters[key] < num) {
                            DB.codeCounters[key] = num;
                        }
                    }
                }
            });
            // ثانياً: ولّد كوداً لكل طالب بدون كود + ثبّت enrollmentStage/Year
            DB.students.forEach(s => {
                if (!s) return;
                if (!s.enrollmentStage) s.enrollmentStage = s.stage;
                if (!s.enrollmentYear) s.enrollmentYear = s.year || DB.schoolYear;
                if (!s.code) {
                    s.code = generateStudentCode(s.enrollmentStage, s.enrollmentYear);
                }
            });
        }


        // YEAR ARCHIVE
        function getYrDBKey(yr) { return 'school_yr_' + yr.replace(/\//g, '_'); }
        async function getYrIdx() {
            const raw = await storeLoad('school_yrs_idx');
            if (raw) { try { return JSON.parse(raw); } catch (e) { } }
            return [];
        }
        async function addYrIdx(y) {
            const idx = await getYrIdx();
            if (!idx.includes(y)) { idx.push(y); await storeSave('school_yrs_idx', JSON.stringify(idx)); }
        }

        // =========================================================
        // LOGO
        // =========================================================
        function applyLogo() {
            ['header-logo', 'sidebar-logo', 'logo-preview'].forEach(id => {
                const el = document.getElementById(id); if (!el) return;
                if (LOGO_B64) { el.src = LOGO_B64; el.style.display = (id === 'logo-preview') ? 'block' : 'inline-block'; }
                else { el.src = ''; el.style.display = 'none'; }
            });
            // Teacher app header logo
            const taLogo = document.getElementById('ta-header-logo');
            const taIcon = document.getElementById('ta-header-icon');
            if (taLogo && taIcon) {
                if (LOGO_B64) { taLogo.src = LOGO_B64; taLogo.style.display = 'inline-block'; taIcon.style.display = 'none'; }
                else { taLogo.style.display = 'none'; taIcon.style.display = 'inline-block'; }
            }
            // Logo placeholder in settings
            const ph = document.getElementById('logo-placeholder');
            if (ph) ph.style.display = LOGO_B64 ? 'none' : 'flex';
            // Update PWA manifest with new icon
            updatePWAManifest();
        }
        function uploadLogo() {
            if (!IS_EDIT_MODE) { showToast('⚠️ وضع عرض فقط'); return; }
            if (IS_TEACHER_MODE) { showToast('⚠️ غير مسموح — للأدمن فقط'); return; }
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
            inp.onchange = e => {
                const f = e.target.files[0]; if (!f) return;
                const r = new FileReader();
                r.onload = ev => {
                    const img = new Image();
                    img.onload = async () => {
                        // ✅ ضغط اللوجو — max 400px، جودة 0.85
                        const MAX = 400;
                        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.round(img.width * scale);
                        canvas.height = Math.round(img.height * scale);
                        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                        const b64 = canvas.toDataURL('image/jpeg', 0.85);
                        // ✅ معاينة فورية فقط (لا يُحفظ base64 في القاعدة)
                        LOGO_B64 = b64; applyLogo();
                        // ☁️ رفع على Cloudinary — الرابط فقط يُحفظ
                        showToast('⏳ جاري رفع اللوجو على السحابة...');
                        canvas.toBlob(async blob => {
                            const url = await uploadToCloudinary(blob);
                            if (url) {
                                LOGO_B64 = url; storeSave(LOGO_KEY, url); applyLogo();
                                showToast('✅ تم رفع اللوجو على السحابة');
                            } else {
                                LOGO_B64 = ''; applyLogo();
                                showToast('❌ فشل رفع اللوجو — لم يُحفظ. أعد المحاولة');
                            }
                        }, 'image/jpeg', 0.85);
                    };
                    img.src = ev.target.result;
                };
                r.readAsDataURL(f);
            };
            inp.click();
        }
        function removeLogo() { if (!IS_EDIT_MODE) return; if (IS_TEACHER_MODE) { showToast('⚠️ غير مسموح — للأدمن فقط'); return; } LOGO_B64 = ''; storeRemove(LOGO_KEY); applyLogo(); showToast('🗑️ تم حذف اللوجو'); }

        // =========================================================
        // ترحيل الصور القديمة المخزّنة base64 → روابط Cloudinary (مرة واحدة)
        // =========================================================
        async function cleanupBase64Images(silent) {
            if (typeof DB === 'undefined' || !DB || !DB.students) return;
            const targets = DB.students.filter(st => st.photo && typeof st.photo === 'string' && st.photo.startsWith('data:image'));
            const logoIsB64 = LOGO_B64 && LOGO_B64.startsWith('data:image');
            const total = targets.length + (logoIsB64 ? 1 : 0);
            if (!total) { if (!silent) showToast('✅ لا توجد صور قديمة بحاجة للترحيل'); try { localStorage.setItem('bsh_img_migrated_v1', '1'); } catch (e) { } return; }
            if (!silent) showToast('⏳ جاري ترحيل ' + total + ' صورة إلى السحابة...');
            let done = 0, failed = 0;
            for (const st of targets) {
                try {
                    const blob = await (await fetch(st.photo)).blob();
                    const url = await uploadToCloudinary(blob);
                    if (url) { st.photo = url; done++; } else { failed++; }
                } catch (e) { failed++; }
            }
            if (logoIsB64) {
                try {
                    const blob = await (await fetch(LOGO_B64)).blob();
                    const url = await uploadToCloudinary(blob);
                    if (url) { LOGO_B64 = url; storeSave(LOGO_KEY, url); applyLogo(); done++; } else { failed++; }
                } catch (e) { failed++; }
            }
            if (done) { try { await saveDB(); } catch (e) { } try { renderStudents(); } catch (e) { } }
            if (!failed) { try { localStorage.setItem('bsh_img_migrated_v1', '1'); } catch (e) { } }
            if (!silent) showToast('✅ تم ترحيل ' + done + ' صورة' + (failed ? ' — تعذّر ' + failed + ' (أعد المحاولة)' : ''));
        }
        window.cleanupBase64Images = cleanupBase64Images;

        // =========================================================
        // CLOUDINARY — رفع الصور المجاني (25GB مجاناً)
        // =========================================================
        async function uploadToCloudinary(blob) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const fd = new FormData();
                    fd.append('file', blob, 'photo.jpg');
                    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 30000);
                    const res = await fetch(
                        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                        { method: 'POST', body: fd, signal: controller.signal }
                    );
                    clearTimeout(timer);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const data = await res.json();
                    return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
                } catch (err) {
                    console.error('🔴 Cloudinary upload error (attempt ' + attempt + '):', err);
                    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
                }
            }
            return null;
        }

        // رفع ملفات PDF / Word / أي ملف
        async function uploadFileToCloudinary(file, onProgress) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    fd.append('resource_type', 'auto');
                    if (onProgress) onProgress(10);
                    const res = await fetch(
                        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
                        { method: 'POST', body: fd }
                    );
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const data = await res.json();
                    if (onProgress) onProgress(100);
                    return data.secure_url;
                } catch (err) {
                    console.error('🔴 Cloudinary file upload error (attempt ' + attempt + '):', err);
                    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
                }
            }
            return null;
        }

        // =========================================================
        // STUDENT PHOTO
        // =========================================================
        function triggerStudentPhotoUpload() {
            document.getElementById('student-photo-input').click();
        }
        function handleStudentPhoto(e) {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = ev => {
                const img = new Image();
                img.onload = async () => {
                    // ✅ ضغط الصورة — max 200px، جودة 0.72
                    const MAX = 200;
                    const scale = Math.min(MAX / img.width, MAX / img.height, 1);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    const b64 = canvas.toDataURL('image/jpeg', 0.72);
                    // ✅ معاينة فورية فقط — لا يُحفظ base64 في القاعدة إطلاقاً
                    const prev = document.getElementById('student-photo-preview');
                    const wrap = document.getElementById('student-photo-preview-wrap');
                    const ph = document.getElementById('student-photo-placeholder');
                    prev.src = b64; wrap.style.display = 'block'; ph.style.display = 'none';
                    // أفرغ الحقل المحفوظ حتى ينجح الرفع على السحابة
                    document.getElementById('s-photo').value = '';
                    window._photoUploading = true;
                    // ☁️ رفع على Cloudinary بعد الضغط — الرابط فقط يُحفظ
                    showToast('⏳ جاري رفع الصورة على السحابة...');
                    canvas.toBlob(async blob => {
                        const url = await uploadToCloudinary(blob);
                        window._photoUploading = false;
                        if (url) {
                            document.getElementById('s-photo').value = url;
                            prev.src = url;
                            showToast('✅ تم رفع صورة الطالب على السحابة');
                        } else {
                            showToast('❌ فشل رفع الصورة — أعد اختيارها (لن تُحفظ بدون رفع)');
                        }
                    }, 'image/jpeg', 0.72);
                };
                img.src = ev.target.result;
            };
            r.readAsDataURL(f);
            e.target.value = '';
        }
        function removeStudentPhoto() {
            document.getElementById('s-photo').value = '';
            document.getElementById('student-photo-preview-wrap').style.display = 'none';
            document.getElementById('student-photo-placeholder').style.display = 'flex';
        }
        function resetStudentPhotoUI(photo) {
            const prev = document.getElementById('student-photo-preview');
            const wrap = document.getElementById('student-photo-preview-wrap');
            const ph = document.getElementById('student-photo-placeholder');
            if (photo) { prev.src = photo; wrap.style.display = 'block'; ph.style.display = 'none'; }
            else { wrap.style.display = 'none'; ph.style.display = 'flex'; }
            document.getElementById('s-photo').value = photo || '';
        }

        // =========================================================
        // NAVIGATION
        // =========================================================
        function navigate(page) {
            document.getElementById("main-content")?.scrollTo(0, 0); window.scrollTo(0, 0);
            // Teacher mode: check page permission
            if (IS_TEACHER_MODE) {
                const allowed = new Set(['absence', 'teacher-profile']);
                if (TEACHER_PERMS.exams) allowed.add('exams');
                if (TEACHER_PERMS.students) allowed.add('students');
                if (TEACHER_PERMS.results) { allowed.add('certificates'); allowed.add('annual'); allowed.add('total'); allowed.add('top'); allowed.add('print'); allowed.add('grades-report'); }
                if (TEACHER_PERMS.graduation) { allowed.add('graduation-certs'); allowed.add('final-cert'); allowed.add('graduates'); }
                if (TEACHER_PERMS.books) allowed.add('books');
                if (TEACHER_PERMS.scheduleDetail) allowed.add('schedule-detail');
                if (TEACHER_PERMS.examFiles) allowed.add('exam-files');
                if (TEACHER_PERMS.media) allowed.add('media');
                if (TEACHER_PERMS.deacons) { allowed.add('deacons'); allowed.add('deacons-attendance'); allowed.add('deacons-services'); }
                if (!allowed.has(page)) { showToast('⚠️ غير مسموح لك بهذه الصفحة'); return; }
                // تتبع زيارات الصفحات الحساسة من المدرس
                try {
                    const trackedPages = {
                        'certificates': 'فتح شهادات الترم',
                        'annual': 'فتح الشهادات السنوية',
                        'top': 'فتح شهادات الأوائل',
                        'graduation-certs': 'فتح شهادات التخرج',
                        'final-cert': 'فتح الشهادة النهائية',
                        'graduates': 'فتح صفحة الخريجين',
                        'print': 'فتح صفحة الطباعة',
                        'grades-report': 'فتح كشوف الدرجات',
                        'exams': 'فتح صفحة رصد الدرجات',
                        'students': 'فتح صفحة الطلاب',
                        'absence': 'فتح صفحة الغياب',
                        'media': 'فتح معرض الصور',
                        'books': 'فتح ملفات الكتب',
                        'exam-files': 'فتح ملفات الامتحانات'
                    };
                    if (trackedPages[page] && window._lastNavLogged !== page) {
                        window._lastNavLogged = page;
                        logTeacherActivity('تصفح', trackedPages[page]);
                    }
                } catch (e) { }
            }
            closeSidebar();
            // ✅ Scroll to top on every page navigation
            window.scrollTo({ top: 0, behavior: 'instant' });
            document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'instant' });
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            const pg = document.getElementById('page-' + page);
            if (!pg) { showToast('⚠️ الصفحة غير موجودة'); return; }
            pg.classList.add('active');
            document.querySelectorAll('.nav-item').forEach(n => { if ((n.getAttribute('onclick') || '').includes("'" + page + "'")) n.classList.add('active'); });
            if (page === 'dashboard') renderDashboard();
            if (page === 'students') { populateSel('filter-stage', true); renderStudents(); }
            if (page === 'subjects') { populateSel('subj-stage-sel'); populateSel('new-teacher-stage'); renderSubjects(); renderSubjPageTeachers(); }
            if (page === 'exams') { populateSel('exam-stage-sel'); renderExamsTable(); }
            if (page === 'certificates') { populateSel('cert-stage-sel'); try{populateCertStudentsSelector();}catch(_){} renderCertificates(); }
            if (page === 'annual') { populateSel('annual-stage-sel'); renderAnnual(); }
            if (page === 'total') { populateSel('total-stage-sel'); renderTotal(); }
            if (page === 'absence') { populateSel('abs-stage-sel'); absStageChanged(); }
            if (page === 'top') { populateSel('top-stage-sel', true); renderTopStudents(); }
            if (page === 'print') populatePrintSelects();
            if (page === 'settings') { loadSettingsForm(); checkStorageStatus(); updateBackupUI(); renderRegisteredTeachers(); }
            if (page === 'yearhistory') renderYearHistory();
            if (page === 'promote') initPromotePage();
            if (page === 'media') { renderMediaGallery(); _applyTeacherFileView('media'); }
            if (page === 'graduation-certs') { populateGradCertSelects(); renderGradCertTopList(); }
            if (page === 'final-cert') populateFinalCertSelect();
            if (page === 'graduates') initGraduatesPage();
            if (page === 'teacher-log') { switchTeacherLogTab(_activeTeacherLogTab || 'overview'); }
            if (page === 'teacher-profile') { renderTeacherProfile(); }
            if (page === 'books') {
                populateBookSelects();
                const bc = document.getElementById('books-container');
                if (bc) bc.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px;margin-bottom:10px">⏳</div><div style="font-size:13px;font-weight:700">جاري تحميل الكتب...</div></div>';
                loadBooksList().then(() => { renderBooks(); _applyTeacherFileView('books'); }).catch(() => { renderBooks(); _applyTeacherFileView('books'); });
            }
            if (page === 'exam-files') {
                populateExamFileSelects();
                const ec = document.getElementById('exam-files-container');
                if (ec) ec.innerHTML = '<div style="text-align:center;padding:32px;color:var(--muted)"><div style="font-size:32px;margin-bottom:10px">⏳</div><div style="font-size:13px;font-weight:700">جاري تحميل الملفات...</div></div>';
                loadExamFilesList().then(() => { renderExamFiles(); _applyTeacherFileView('exam-files'); }).catch(() => { renderExamFiles(); _applyTeacherFileView('exam-files'); });
            }
            if (page === 'schedule-detail') renderDetailedSchedule();
            if (page === 'teacher-schedule') renderTeacherSchedule();
            if (page === 'install-guide') {
                const wrap = document.getElementById('install-guide-btn-wrap');
                if (wrap && deferredPrompt) wrap.style.display = 'block';
            }
            if (page === 'grades-report') {
                const examTerm = document.getElementById('exam-term-sel')?.value;
                if (examTerm) document.getElementById('report-term-sel').value = examTerm;
                renderGradesReport();
            }
        }
        function getTeacherAllowedStages() {
            if (!IS_TEACHER_MODE) return STAGES;
            // المدرس يشوف مراحله هو فقط — بدون أي fallback لكل المدرسة
            const stages = (CURRENT_TEACHER.stages || []).filter(s => STAGES.includes(s));
            return stages;
        }
        function populateSel(id, withAll) {
            const el = document.getElementById(id); if (!el) return;
            const cur = el.value;
            const stagesList = IS_TEACHER_MODE ? getTeacherAllowedStages() : STAGES;
            el.innerHTML = (withAll ? '<option value="">كل المراحل</option>' : '') + stagesList.map(s => `<option value="${s}">${s}</option>`).join('');
            if (cur && stagesList.includes(cur)) el.value = cur;
        }

        // =========================================================
        // BIRTHDAY
        // =========================================================
        function _parseDobLocal(dob) {
            // ✅ تفسير التاريخ كـ local timezone لتجنب off-by-one
            if (!dob) return null;
            try {
                const parts = String(dob).split('-');
                if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
                const d = new Date(dob); return isNaN(d) ? null : d;
            } catch (e) { return null; }
        }
        function checkBirthdays() {
            const days = DB.settings.bdayDays || 7;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // منتصف الليل local
            const alerts = [];
            DB.students.forEach(s => {
                if (!s.dob) return;
                try {
                    const d = _parseDobLocal(s.dob); if (!d) return;
                    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                    if (next < today) next.setFullYear(today.getFullYear() + 1);
                    const diff = Math.round((next - today) / 86400000);
                    if (diff <= days && diff >= 0) alerts.push({ name: s.name, stage: s.stage, days: diff });
                } catch (e) { }
            });
            const c = document.getElementById('bday-alerts-container'); if (!c) return;
            c.innerHTML = alerts.map(a => `<div class="bday-alert"><div style="font-size:34px">🎂</div><div><h3>${a.days === 0 ? '🎉 عيد ميلاد اليوم!' : 'قُرب عيد الميلاد'}</h3><p><strong>${a.name}</strong> (${a.stage}) — ${a.days === 0 ? 'اليوم 🎊' : a.days === 1 ? 'غداً' : 'بعد ' + a.days + ' أيام'}</p></div></div>`).join('');
        }
        function getDaysUntilBirthday(dob) {
            if (!dob) return null;
            try {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const d = _parseDobLocal(dob); if (!d) return null;
                const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                if (next < today) next.setFullYear(today.getFullYear() + 1);
                return Math.round((next - today) / 86400000);
            } catch (e) { return null; }
        }

        // =========================================================
        // =========================================================
        // ADMIN CONFIRM GATE — يحمي الأرشفة وتغيير العام
