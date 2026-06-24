        async function doLogin() {
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value;
            const creds = await getCredentials();
            if (u === creds.username && p === creds.password) {
                IS_EDIT_MODE = true;
                IS_TEACHER_MODE = false;
                lsSet('school_session', 'edit');
                storeSave('school_session', 'edit');
                startApp(true);
            } else {
                document.getElementById('login-err').textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
            }
        }
        async function doTeacherLogin() {
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value;
            const creds = await getTeacherCredentials();
            if (u === creds.username && p === creds.password) {
                IS_EDIT_MODE = true;
                IS_TEACHER_MODE = true;
                storeSave('school_session', 'teacher');
                startApp(true);
            } else {
                document.getElementById('login-err').textContent = '❌ بيانات المدرس غير صحيحة';
            }
        }
        // ──────────────────────────────────────────
        // خطوة تعريف المدرس
        // ──────────────────────────────────────────
        let _teacherSubjChips = [];
        let _teacherStageChips = [];


        function _showTeacherPicker() {
            // أخفي كل شاشات الدخول
            const mlb = document.getElementById('main-lock-box');
            if (mlb) mlb.style.display = 'none';
            const tib = document.getElementById('teacher-identity-box');
            if (tib) tib.style.display = 'none';
            const old = document.getElementById('teacher-picker-box');
            if (old) old.remove();

            const teachers = DB.registeredTeachers || [];
            const html = `<div id="teacher-picker-box" class="lock-box" style="max-width:560px;width:92%;margin:0 auto;padding:22px 24px;max-height:88vh;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0d5c8a,#1a7abf);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:2px solid rgba(201,162,39,.4)">👨‍🏫</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Amiri',serif;font-size:17px;color:var(--gold-light);font-weight:700">من أنت؟</div>
        <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:2px">اختر اسمك أو سجّل كمدرس جديد</div>
      </div>
      <div style="background:rgba(13,92,138,.3);border:1px solid rgba(13,122,191,.4);color:#fff;border-radius:20px;padding:4px 11px;font-size:11px;font-weight:700;flex-shrink:0">${teachers.length}</div>
    </div>
    ${teachers.length > 4 ? `<input type="search" id="teacher-picker-search" placeholder="🔎 ابحث باسمك..." oninput="_filterTeacherPicker(this.value)" style="width:100%;padding:9px 12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Cairo',sans-serif;font-size:13px;margin-bottom:10px;flex-shrink:0" />` : ''}
    <div id="teacher-picker-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:7px;margin-bottom:12px;overflow-y:auto;flex:1;min-height:0;padding-left:4px">
      ${teachers.map(r => `
      <button data-teacher-name="${r.name.toLowerCase()}" onclick="_askTeacherPin('${r.name.replace(/'/g, "\'")}')"
        style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(13,92,138,.25);border:1.5px solid rgba(13,122,191,.4);border-radius:12px;cursor:pointer;transition:all .2s;text-align:right;width:100%"
        onmouseover="this.style.background='rgba(13,92,138,.45)'" onmouseout="this.style.background='rgba(13,92,138,.25)'">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0d5c8a,#1a7abf);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#fff;flex-shrink:0">${r.name[0]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:900;color:#fff">${r.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:1px">${(r.subjects || []).join('، ') || '—'}${r.stages && r.stages.length ? ' · ' + (r.stages || []).join('، ') : ''}</div>
        </div>
        <span style="color:rgba(255,255,255,.3);font-size:18px">←</span>
      </button>`).join('')}
    </div>
    <button onclick="_openTeacherForm()"
      style="width:100%;padding:11px;background:rgba(255,255,255,.07);border:1.5px dashed rgba(255,255,255,.2);color:rgba(255,255,255,.65);border-radius:11px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px"
      onmouseover="this.style.background='rgba(255,255,255,.13)'" onmouseout="this.style.background='rgba(255,255,255,.07)'">
      ➕ أنا مدرس جديد
    </button>
    <button onclick="document.getElementById('teacher-picker-box').remove();document.getElementById('main-lock-box').style.display='block'"
      style="width:100%;padding:8px;background:transparent;border:none;color:rgba(255,255,255,.3);font-family:'Cairo',sans-serif;font-size:12px;cursor:pointer">↩️ رجوع</button>
  </div>`;
            const overlay = document.getElementById('lock-overlay');
            if (overlay) overlay.insertAdjacentHTML('beforeend', html);
        }

        function _filterTeacherPicker(q) {
            q = (q || '').trim().toLowerCase();
            document.querySelectorAll('#teacher-picker-list [data-teacher-name]').forEach(btn => {
                const n = btn.getAttribute('data-teacher-name') || '';
                btn.style.display = (!q || n.includes(q)) ? '' : 'none';
            });
        }

        function _openTeacherForm() {
            const picker = document.getElementById('teacher-picker-box');
            if (picker) picker.remove();
            const mlb = document.getElementById('main-lock-box');
            if (mlb) mlb.style.display = 'none';
            const tib = document.getElementById('teacher-identity-box');
            if (tib) {
                tib.style.display = 'block';
                document.getElementById('teacher-id-name').value = '';
                const pinEl = document.getElementById('teacher-id-pin');
                const pinEl2 = document.getElementById('teacher-id-pin2');
                if (pinEl) pinEl.value = '';
                if (pinEl2) pinEl2.value = '';
                _teacherSubjChips = [];
                _teacherStageChips = [];
                renderTeacherSubjChips();
                renderTeacherStageChips();
                const sel = document.getElementById('teacher-id-stage-sel');
                if (sel) sel.innerHTML = '<option value="">-- اختر مرحلة --</option>' + STAGES.map(s => `<option value="${s}">${s}</option>`).join('');
                document.getElementById('teacher-id-name').focus();
            }
        }

        function _askTeacherPin(name) {
            // إزالة أي dialog سابق
            const old = document.getElementById('pin-verify-box');
            if (old) old.remove();

            const rec = (DB.registeredTeachers || []).find(r => r.name === name);
            if (!rec) return;

            // لو المدرس مش عنده PIN (مسجل قبل التحديث) — ادخله مباشرة وطلب منه تحديد PIN
            if (!rec.pin) {
                _enterAsTeacherAndSetPin(name);
                return;
            }

            const initials = (name || '؟').split(' ').slice(0, 2).map(w => w[0] || '').join('');
            const colors = _teacherAvatarColor(name);

            const html = `<div id="pin-verify-box" class="lock-box" style="max-width:340px;padding:26px 28px;text-align:center">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.12)">
      <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,${colors[0]},${colors[1]});display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;color:#fff;flex-shrink:0;font-family:'Cairo',sans-serif">${initials || '؟'}</div>
      <div style="text-align:right;flex:1">
        <div style="font-family:'Amiri',serif;font-size:16px;color:var(--gold-light);font-weight:700">${name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:2px">أدخل رقمك السري للدخول</div>
      </div>
    </div>
    <div style="font-size:32px;margin-bottom:14px">🔑</div>
    <input type="password" id="pin-single-input" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="off"
      placeholder="● ● ● ●"
      style="width:100%;padding:16px;border:2px solid rgba(201,162,39,.4);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font-family:'Cairo',sans-serif;font-size:28px;font-weight:900;outline:none;text-align:center;letter-spacing:12px;box-sizing:border-box;margin-bottom:6px;transition:border-color .2s"
      onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='rgba(201,162,39,.4)'"
      oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,4)"
      onkeydown="if(event.key==='Enter')_verifyPin('${name.replace(/'/g, "\\'")}')">
    <div id="pin-verify-err" style="color:#ff6b6b;font-size:12px;font-weight:700;min-height:18px;margin-bottom:12px;margin-top:6px"></div>
    <button onclick="_verifyPin('${name.replace(/'/g, "\\'")}')"
      style="width:100%;padding:13px;background:linear-gradient(135deg,#0d5c8a,#1a7abf);color:#fff;border:none;border-radius:11px;font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer;margin-bottom:8px;transition:opacity .2s"
      onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
      ✅ دخول
    </button>
    <button onclick="document.getElementById('pin-verify-box').remove();_showTeacherPicker()"
      style="width:100%;padding:9px;background:transparent;border:none;color:rgba(255,255,255,.35);font-family:'Cairo',sans-serif;font-size:12px;cursor:pointer">↩️ رجوع للقائمة</button>
  </div>`;

            const overlay = document.getElementById('lock-overlay');
            const picker = document.getElementById('teacher-picker-box');
            if (picker) picker.style.display = 'none';
            if (overlay) { overlay.insertAdjacentHTML('beforeend', html); }
            setTimeout(() => { const d = document.getElementById('pin-single-input'); if (d) d.focus(); }, 80);
        }

        function _onPinInput(name, idx) {
            // kept for backward compatibility but no longer used
        }

        function _verifyPin(name) {
            const pinEl = document.getElementById('pin-single-input');
            const pin = (pinEl || {}).value || '';
            const rec = (DB.registeredTeachers || []).find(r => r.name === name);
            const errEl = document.getElementById('pin-verify-err');
            if (!rec) { if (errEl) errEl.textContent = '❌ خطأ غير متوقع'; return; }
            if (pin.length < 4) { if (errEl) errEl.textContent = '⚠️ أدخل الـ 4 أرقام كاملة'; return; }
            if (_hashPin(pin) !== rec.pin) {
                if (errEl) errEl.textContent = '❌ الرقم السري غير صحيح — حاول مرة تانية';
                if (pinEl) { pinEl.value = ''; pinEl.style.borderColor = '#ff6b6b'; pinEl.focus(); }
                setTimeout(() => { if (pinEl) pinEl.style.borderColor = 'rgba(201,162,39,.4)'; }, 1200);
                return;
            }
            document.getElementById('pin-verify-box')?.remove();
            _enterAsTeacher(name);
        }

        function _enterAsTeacherAndSetPin(name) {
            // مدرس قديم بدون PIN — ادخله وطلب منه تعيين PIN
            const old = document.getElementById('pin-verify-box');
            if (old) old.remove();
            const picker = document.getElementById('teacher-picker-box');
            if (picker) picker.style.display = 'none';

            const rec = (DB.registeredTeachers || []).find(r => r.name === name);
            if (!rec) return;

            const html = `<div id="pin-verify-box" class="lock-box" style="max-width:360px;padding:26px 28px;text-align:center">
    <div style="font-size:36px;margin-bottom:10px">🔐</div>
    <div style="font-family:'Amiri',serif;font-size:17px;color:var(--gold-light);font-weight:700;margin-bottom:6px">مرحباً ${name}!</div>
    <div style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:20px">ضبط رقم سري جديد لحماية حسابك</div>
    <input type="password" id="new-pin-1" placeholder="رقم سري جديد (4 أرقام)" maxlength="4" inputmode="numeric"
      style="width:100%;padding:12px 14px;border:2px solid rgba(201,162,39,.4);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font-family:'Cairo',sans-serif;font-size:18px;font-weight:900;text-align:center;letter-spacing:8px;outline:none;box-sizing:border-box;margin-bottom:10px"
      oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,4)">
    <input type="password" id="new-pin-2" placeholder="تأكيد الرقم السري" maxlength="4" inputmode="numeric"
      style="width:100%;padding:12px 14px;border:2px solid rgba(201,162,39,.4);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;font-family:'Cairo',sans-serif;font-size:18px;font-weight:900;text-align:center;letter-spacing:8px;outline:none;box-sizing:border-box;margin-bottom:6px"
      oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,4)">
    <div id="new-pin-err" style="color:#ff6b6b;font-size:12px;font-weight:700;min-height:18px;margin-bottom:12px"></div>
    <button onclick="_saveNewPinAndEnter('${name.replace(/'/g, "\\'")}');"
      style="width:100%;padding:13px;background:linear-gradient(135deg,#1a5c2a,#237a38);color:#fff;border:none;border-radius:11px;font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer">
      ✅ حفظ والدخول
    </button>
  </div>`;
            const overlay = document.getElementById('lock-overlay');
            if (overlay) overlay.insertAdjacentHTML('beforeend', html);
            setTimeout(() => document.getElementById('new-pin-1')?.focus(), 80);
        }

        function _saveNewPinAndEnter(name) {
            const p1 = (document.getElementById('new-pin-1') || {}).value || '';
            const p2 = (document.getElementById('new-pin-2') || {}).value || '';
            const errEl = document.getElementById('new-pin-err');
            if (p1.length < 4) { if (errEl) errEl.textContent = '⚠️ الرقم السري 4 أرقام'; return; }
            if (p1 !== p2) { if (errEl) errEl.textContent = '⚠️ الرقمان غير متطابقان'; return; }
            const rec = (DB.registeredTeachers || []).find(r => r.name === name);
            if (!rec) { return; }
            rec.pin = _hashPin(p1);
            const regKey = 'school_registered_teachers_v1';
            localStorage.setItem(regKey, JSON.stringify(DB.registeredTeachers));
            saveDB();
            document.getElementById('pin-verify-box')?.remove();
            _enterAsTeacher(name);
        }

        function _enterAsTeacher(name) {
            const picker = document.getElementById('teacher-picker-box');
            if (picker) picker.remove();
            const rec = (DB.registeredTeachers || []).find(r => r.name === name);
            if (!rec) return;
            CURRENT_TEACHER = {
                name: rec.name,
                subjects: [...(rec.subjects || [])],
                stages: [...(rec.stages || [])],
                scopeAll: false,
            };
            _teacherSubjChips = [...(rec.subjects || [])];
            _teacherStageChips = [...(rec.stages || [])];
            lsSet('school_current_teacher', JSON.stringify(CURRENT_TEACHER));
            storeSave('school_current_teacher', JSON.stringify(CURRENT_TEACHER));
            IS_EDIT_MODE = true;
            IS_TEACHER_MODE = true;
            lsSet('school_session', 'teacher');
            storeSave('school_session', 'teacher');
            _linkTeacherToSubjects();
            logTeacherActivity('دخول', 'تسجيل دخول: ' + rec.name);
            startApp(true);
        }

        async function showTeacherIdentityStep() {
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value;
            const errEl = document.getElementById('login-err');
            errEl.textContent = '';

            // تحقق من الـ credentials العامة
            const generalCreds = await getTeacherCredentials();
            if (u !== generalCreds.username || p !== generalCreds.password) {
                errEl.textContent = '❌ بيانات المدرس غير صحيحة';
                return;
            }

            // دمج المدرسين المسجلين
            if (!DB.registeredTeachers) DB.registeredTeachers = [];
            const regKey = 'school_registered_teachers_v1';
            let lsReg = [];
            try { lsReg = JSON.parse(localStorage.getItem(regKey) || '[]'); } catch (e) { }
            lsReg.forEach(lr => { if (!DB.registeredTeachers.find(r => r.name === lr.name)) DB.registeredTeachers.push(lr); });

            // لو في مدرسين مسجلين — اعرض قائمة اختيار
            if (DB.registeredTeachers.length > 0) {
                _showTeacherPicker();
                return;
            }

            // مدرس جديد — شاشة التسجيل مباشرة
            _openTeacherForm();
        }
        function backToLogin() {
            document.getElementById('teacher-identity-box').style.display = 'none';
            document.getElementById('teacher-id-err').textContent = '';
            if (DB.registeredTeachers && DB.registeredTeachers.length > 0) {
                _showTeacherPicker();
            } else {
                const mlb = document.getElementById('main-lock-box');
                if (mlb) mlb.style.display = 'block';
            }
        }
        function renderTeacherSubjChips() {
            const cont = document.getElementById('teacher-id-subj-chips');
            if (!cont) return;
            if (!_teacherSubjChips.length) { cont.innerHTML = ''; return; }
            cont.innerHTML = _teacherSubjChips.map((s, i) => `
    <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(13,92,138,.4);border:1px solid rgba(13,122,191,.6);color:#7dd3fc;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">
      📚 ${s}
      <button onclick="_teacherSubjChips.splice(${i},1);renderTeacherSubjChips()" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:13px;padding:0;line-height:1">×</button>
    </span>`).join('');
        }
        function renderTeacherStageChips() {
            const cont = document.getElementById('teacher-id-stage-chips');
            if (!cont) return;
            if (!_teacherStageChips.length) { cont.innerHTML = ''; return; }
            cont.innerHTML = _teacherStageChips.map((s, i) => `
    <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(26,92,42,.4);border:1px solid rgba(35,122,56,.6);color:#86efac;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">
      🏫 ${s}
      <button onclick="_teacherStageChips.splice(${i},1);renderTeacherStageChips()" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:13px;padding:0;line-height:1">×</button>
    </span>`).join('');
        }
        function addTeacherSubjChip() {
            const inp = document.getElementById('teacher-id-subj');
            const val = inp.value.trim();
            if (!val) return;
            // تحقق أن المادة موجودة في النظام
            const src = (DB && DB.subjects) ? DB.subjects : {};
            const allSubjs = [];
            const seen = new Set();
            Object.values(src).forEach(arr => (arr || []).forEach(s => {
                const name = (s.name || '').trim();
                const key = _arKey(name);
                if (name && !seen.has(key)) { seen.add(key); allSubjs.push(name); }
            }));
            const match = allSubjs.find(s => _arKey(s) === _arKey(val));
            if (!match) {
                const hintEl = document.getElementById('subj-hint');
                if (hintEl) { hintEl.style.color = '#ff6b6b'; hintEl.textContent = '⚠️ يرجى الاختيار من المواد الموجودة في النظام فقط'; setTimeout(() => { hintEl.style.color = 'rgba(255,255,255,.35)'; hintEl.textContent = '💡 اختر من المواد الموجودة في النظام فقط'; }, 2500); }
                return;
            }
            if (!_teacherSubjChips.includes(match)) _teacherSubjChips.push(match);
            inp.value = '';
            renderTeacherSubjChips();
            hideSubjSuggestions();
        }
        /* تطبيع الحروف العربية للمقارنة — يوحّد كل أشكال الألف والتاء والياء */
        function _arKey(str) {
            return (str || '').trim()
                .normalize('NFC')
                .replace(/[أإآٱ]/g, 'ا')   // كل أشكال الألف → الف عادية
                .replace(/ة/g, 'ه')          // تاء مربوطة → هاء
                .replace(/ى/g, 'ي')          // ألف مقصورة → ياء
                .replace(/\s+/g, ' ')
                .toLowerCase();
        }
        function addTeacherStageChip() {
            const sel = document.getElementById('teacher-id-stage-sel');
            if (!sel || !sel.value) return;
            if (!_teacherStageChips.includes(sel.value)) _teacherStageChips.push(sel.value);
            sel.value = '';
            renderTeacherStageChips();
        }
        function showSubjSuggestions() {
            const inp = document.getElementById('teacher-id-subj');
            const q = inp ? _arKey(inp.value) : '';
            const box = document.getElementById('teacher-id-suggestions');
            if (!box) return;
            // جمع المواد الفريدة من DB — dedup بتطبيع عربي قوي
            const seen = new Set();
            const allSubjs = [];
            const src = (DB && DB.subjects) ? DB.subjects : {};
            Object.values(src).forEach(arr => (arr || []).forEach(s => {
                const name = (s.name || '').trim();
                const key = _arKey(name);
                if (name && !seen.has(key)) { seen.add(key); allSubjs.push(name); }
            }));
            allSubjs.sort();
            if (!allSubjs.length) {
                box.style.display = 'block';
                box.innerHTML = '<div style="padding:10px 14px;color:rgba(255,255,255,.5);font-size:12px;text-align:center">لا توجد مواد في النظام بعد — أضف مواد من إدارة المواد</div>';
                return;
            }
            const filtered = allSubjs.filter(s =>
                (!q || _arKey(s).includes(q)) &&
                !_teacherSubjChips.map(_arKey).includes(_arKey(s))
            );
            if (!filtered.length) { box.style.display = 'none'; return; }
            box.style.display = 'block';
            box.innerHTML = filtered.map(s => `
    <div onclick="if(!_teacherSubjChips.includes('${s.replace(/'/g, "\\'")}'))_teacherSubjChips.push('${s.replace(/'/g, "\\'")}');document.getElementById('teacher-id-subj').value='';renderTeacherSubjChips();hideSubjSuggestions()"
      style="padding:9px 14px;cursor:pointer;color:#fff;font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:8px"
      onmouseover="this.style.background='rgba(201,162,39,.18)'" onmouseout="this.style.background=''">
      📚 ${s}
    </div>`).join('');
        }
        function hideSubjSuggestions() {
            const box = document.getElementById('teacher-id-suggestions');
            if (box) box.style.display = 'none';
        }
        function _hashPin(pin) { return btoa('pp_' + pin + '_school'); }

        async function confirmTeacherIdentity() {
            const name = document.getElementById('teacher-id-name').value.trim();
            const errEl = document.getElementById('teacher-id-err');
            if (!name) { errEl.textContent = '⚠️ أدخل اسمك الكامل'; return; }

            const pin1 = (document.getElementById('teacher-id-pin') || {}).value || '';
            const pin2 = (document.getElementById('teacher-id-pin2') || {}).value || '';
            if (!pin1 || pin1.length < 4) { errEl.textContent = '⚠️ أدخل رقم سري مكون من 4 أرقام'; return; }
            if (pin1 !== pin2) { errEl.textContent = '⚠️ الرقم السري غير متطابق — أعد الكتابة'; return; }

            errEl.textContent = '';

            const regKey = 'school_registered_teachers_v1';
            if (!DB.registeredTeachers) DB.registeredTeachers = [];
            // دمج من localStorage للتأكد من عدم ضياع أي مدرس
            let lsReg = [];
            try { lsReg = JSON.parse(localStorage.getItem(regKey) || '[]'); } catch (e) { }
            lsReg.forEach(lr => { if (!DB.registeredTeachers.find(r => r.name === lr.name)) DB.registeredTeachers.push(lr); });

            let rec = DB.registeredTeachers.find(r => r.name === name);
            if (!rec) {
                rec = {
                    name,
                    pin: _hashPin(pin1),
                    subjects: [..._teacherSubjChips],
                    stages: [..._teacherStageChips],
                    registeredAt: new Date().toLocaleString('ar-EG'),
                };
                DB.registeredTeachers.push(rec);
            } else {
                rec.subjects = [..._teacherSubjChips];
                rec.stages = [..._teacherStageChips];
            }

            CURRENT_TEACHER = {
                name: rec.name,
                subjects: [...(rec.subjects || [])],
                stages: [...(rec.stages || [])],
                scopeAll: false,
            };
            await storeSave('school_current_teacher', JSON.stringify(CURRENT_TEACHER));
            lsSet('school_current_teacher', JSON.stringify(CURRENT_TEACHER));

            IS_EDIT_MODE = true;
            IS_TEACHER_MODE = true;
            lsSet('school_session', 'teacher');
            await storeSave('school_session', 'teacher');
            _linkTeacherToSubjects();

            // لو مدرس جديد — نسجل انضمامه ونعلم الأدمن
            // ✅ FIX: تحقق من isNew أولاً ثم ادمج كل البيانات في حفظ واحد فقط (تجنب race condition)
            const isNew = !DB.registeredTeachers.find(r => r.name === name && r._logged);
            if (isNew) {
                if (rec) rec._logged = true;
                DB.registeredTeachers = DB.registeredTeachers.map(r => r.name === name ? { ...r, _logged: true } : r);
                if (!DB.teacherNotifs) DB.teacherNotifs = [];
                const notifId = Date.now(); // معرّف فريد للإشعار لمنع التكرار
                DB.teacherNotifs.unshift({
                    id: notifId,
                    name,
                    subjects: _teacherSubjChips.join('، ') || '—',
                    stages: _teacherStageChips.join('، ') || '—',
                    time: new Date().toLocaleString('ar-EG'),
                    read: false,
                });
                if (DB.teacherNotifs.length > 50) DB.teacherNotifs.splice(50);
                // ✅ حفظ واحد فقط بعد إضافة كل البيانات (يشمل الإشعار + _logged)
                localStorage.setItem(regKey, JSON.stringify(DB.registeredTeachers));
                await saveDB();
                // إشعار localStorage للتابات الأخرى على نفس الجهاز
                try { localStorage.setItem('school_new_teacher_notif', JSON.stringify({ id: notifId, name, subjects: _teacherSubjChips.join('، ') || '—', stages: _teacherStageChips.join('، ') || '—', t: notifId })); } catch (e) { }
                logTeacherActivity('انضمام', `انضم مدرس جديد: ${name} | المواد: ${_teacherSubjChips.join('، ') || '—'} | المراحل: ${_teacherStageChips.join('، ') || '—'}`);
            } else {
                // ✅ حفظ متزامن للمدرس العائد
                localStorage.setItem(regKey, JSON.stringify(DB.registeredTeachers));
                await saveDB();
                logTeacherActivity('دخول', `تسجيل دخول: ${name}`);
            }
            startApp(true);
        }
        function _linkTeacherToSubjects() {
            // لو المدرس حدد مواد ومراحل، نربط اسمه بالمادة في DB
            if (!CURRENT_TEACHER.subjects.length) return;
            let changed = false;
            const stagesToSearch = CURRENT_TEACHER.stages.length ? CURRENT_TEACHER.stages : Object.keys(DB.subjects || {});
            stagesToSearch.forEach(stage => {
                (DB.subjects[stage] || []).forEach(subj => {
                    if (CURRENT_TEACHER.subjects.includes(subj.name) && subj.teacher !== CURRENT_TEACHER.name) {
                        subj.teacher = CURRENT_TEACHER.name;
                        changed = true;
                    }
                });
            });
            if (changed) saveDB();
        }
        function doViewOnly() {
            IS_EDIT_MODE = false;
            IS_TEACHER_MODE = false;
            lsSet('school_session', 'view');
            storeSave('school_session', 'view');
            startApp(false);
        }
        function lockApp() {
            // ── أنيميشن تسجيل الخروج ──
            const overlay = document.createElement('div');
            overlay.id = 'logout-overlay';
            overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:linear-gradient(160deg,#091d38 0%,#0d2645 50%,#163358 100%);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
    opacity:0;transition:opacity .25s ease;
  `;
            overlay.innerHTML = `
    <div id="logout-icon-wrap" style="position:relative;width:90px;height:90px">
      <div style="width:90px;height:90px;border-radius:50%;border:3px solid rgba(201,162,39,.3);
        display:flex;align-items:center;justify-content:center;font-size:42px;
        animation:logoutPulse .6s ease-in-out infinite alternate">🚪</div>
      <svg style="position:absolute;inset:-6px;width:102px;height:102px;animation:logoutSpin 1.2s linear infinite" viewBox="0 0 102 102">
        <circle cx="51" cy="51" r="46" fill="none" stroke="rgba(201,162,39,.5)" stroke-width="3"
          stroke-dasharray="72 216" stroke-linecap="round"/>
      </svg>
    </div>
    <div style="font-family:'Amiri',serif;font-size:20px;color:var(--gold-light);text-align:center;line-height:1.6;animation:logoutFadeSlide .4s ease both .1s;opacity:0">
      جاري تسجيل الخروج...
    </div>
    <div style="width:200px;height:3px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;animation:logoutFadeSlide .4s ease both .2s;opacity:0">
      <div style="height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-light));border-radius:3px;animation:logoutProgress .9s ease forwards .25s;width:0"></div>
    </div>
  `;
            document.body.appendChild(overlay);

            // CSS keyframes
            if (!document.getElementById('logout-keyframes')) {
                const style = document.createElement('style');
                style.id = 'logout-keyframes';
                style.textContent = `
      @keyframes logoutPulse{from{transform:scale(1)}to{transform:scale(1.12)}}
      @keyframes logoutSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes logoutFadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes logoutProgress{from{width:0}to{width:100%}}
      @keyframes logoutFadeOut{from{opacity:1}to{opacity:0;transform:scale(1.04)}}
    `;
                document.head.appendChild(style);
            }

            // fade in overlay
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });

            setTimeout(() => {
                // fade out مع scale
                overlay.style.transition = 'opacity .35s ease, transform .35s ease';
                overlay.style.transform = 'scale(1.04)';
                overlay.style.opacity = '0';

                setTimeout(() => {
                    overlay.remove();
                    // ── التنفيذ الفعلي لتسجيل الخروج ──
                    stopAdminPolling();
                    stopTeacherPolling();
                    IS_EDIT_MODE = false;
                    IS_TEACHER_MODE = false;
                    CURRENT_TEACHER = { name: '', subjects: [], stages: [] };
                    storeRemove('school_session');
                    storeRemove('school_current_teacher');
                    lsDel('school_session');
                    lsDel('school_current_teacher');
                    applyEditMode(false);
                    document.body.classList.remove('readonly');

                    // إظهار شاشة القفل بأنيميشن fade-in
                    const lockOv = document.getElementById('lock-overlay');
                    lockOv.style.opacity = '0';
                    lockOv.style.display = 'flex';
                    lockOv.style.transition = 'opacity .3s ease';
                    requestAnimationFrame(() => { lockOv.style.opacity = '1'; });

                    document.getElementById('app').style.display = 'none';
                    document.getElementById('edit-bar').style.display = 'none';
                    const teacherApp = document.getElementById('teacher-app');
                    if (teacherApp) teacherApp.style.display = 'none';
                    document.getElementById('login-user').value = '';
                    document.getElementById('login-pass').value = '';
                    document.getElementById('login-err').textContent = '';

                    // إعادة شاشة الدخول الأصلية وإخفاء الباقي
                    document.getElementById('main-lock-box').style.display = 'block';
                    const tib = document.getElementById('teacher-identity-box');
                    if (tib) tib.style.display = 'none';
                    const picker = document.getElementById('teacher-picker-box');
                    if (picker) picker.remove();
                    const pinBox = document.getElementById('pin-verify-box');
                    if (pinBox) pinBox.remove();
                    const hb = document.getElementById('home-btn');
                    if (hb) hb.style.display = 'none';
                    const nw = document.getElementById('admin-notif-wrap');
                    if (nw) nw.style.display = 'none';
                }, 380);
            }, 980);
        }

        /* ══ وظائف إشعارات المدرسين ══ */
        function updateAdminNotifBadge() {
            if (!IS_EDIT_MODE || IS_TEACHER_MODE) return;
            const notifs = (DB.teacherNotifs || []).filter(n => !n.read);
            const yearReqs = (DB.yearChangeRequests || []).filter(r => r.status === 'pending');
            const totalUnread = notifs.length + yearReqs.length;
            const badge = document.getElementById('notif-badge');
            if (!badge) return;
            if (totalUnread > 0) {
                badge.style.display = '';
                badge.textContent = totalUnread > 9 ? '9+' : totalUnread;
                // لون مختلف لو فيه طلبات سنة
                badge.style.background = yearReqs.length ? '#f59e0b' : '#e74c3c';
                // باج على nav item سجل المدرسين
                let navBadge = document.getElementById('teacher-log-nav-badge');
                if (!navBadge) {
                    const navEl = document.querySelector('.nav-item[onclick*="teacher-log"]');
                    if (navEl) {
                        navBadge = document.createElement('span');
                        navBadge.id = 'teacher-log-nav-badge';
                        navBadge.style.cssText = 'background:#e74c3c;color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;font-weight:900;margin-right:auto';
                        navEl.appendChild(navBadge);
                    }
                }
                if (navBadge) navBadge.textContent = notifs.length;
            } else {
                badge.style.display = 'none';
                const navBadge = document.getElementById('teacher-log-nav-badge');
                if (navBadge) navBadge.remove();
            }
        }
        function _playNotifSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
            } catch (e) { }
        }
        function showAdminNewTeacherToast(name, subjects) {
            const existing = document.getElementById('admin-teacher-toast');
            if (existing) existing.remove();
            const t = document.createElement('div');
            t.id = 'admin-teacher-toast';
            t.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0d5c8a,#1a7abf);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">👨‍🏫</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:900;color:#e8c04a;margin-bottom:3px">مدرس جديد انضم!</div>
        <div style="font-size:12px;color:#fff;font-weight:700">${name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:2px">📚 ${subjects || '—'}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:16px;cursor:pointer;padding:0;line-height:1;flex-shrink:0">✕</button>
    </div>`;
            t.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:99999;background:linear-gradient(135deg,#0d2645,#1a3d6e);border:1.5px solid rgba(201,162,39,.5);border-radius:14px;padding:14px 16px;min-width:280px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.45);font-family:Cairo,sans-serif;direction:rtl;animation:slideInToast .35s ease;transition:opacity .4s';
            if (!document.getElementById('toast-anim-style')) {
                const st = document.createElement('style');
                st.id = 'toast-anim-style';
                st.textContent = '@keyframes slideInToast{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}';
                document.head.appendChild(st);
            }
            document.body.appendChild(t);
            _playNotifSound();
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setTimeout(() => { if (t.parentNode) { t.style.opacity = '0'; setTimeout(() => { if (t.parentNode) t.remove(); }, 400); } }, 6000);
        }
        // =========================================================
        // YEAR CHANGE REQUESTS — طلبات تغيير السنة من المدرسين
        // =========================================================
        const YEAR_REQ_LS_KEY = 'school_year_change_req_v1';
        const YEAR_REQ_RESP_KEY = 'school_year_change_resp_v1';

        // =========================================================
        // ✅ TEACHER CLOUD POLLING — استطلاع ردود الأدمن على طلبات السنة
        // يحل مشكلة: storage event لا يعمل إلا على نفس الجهاز
        // =========================================================
        let _teacherPollInterval = null;
        let _pendingYearReqId = null;

        async function startTeacherPolling(reqId) {
            stopTeacherPolling();
            if (!FIREBASE_URL) return;
            _pendingYearReqId = reqId;
            _teacherPollInterval = setInterval(_teacherPollCheck, 15000); // كل 15 ثانية
        }

        function stopTeacherPolling() {
            if (_teacherPollInterval) { clearInterval(_teacherPollInterval); _teacherPollInterval = null; }
            _pendingYearReqId = null;
        }

        async function _teacherPollCheck() {
            if (!IS_TEACHER_MODE || !_pendingYearReqId) { stopTeacherPolling(); return; }
            try {
                const cloudStr = await cloudLoad(DB_KEY);
                if (!cloudStr) return;
                const freshDB = typeof cloudStr === 'string' ? JSON.parse(cloudStr) : cloudStr;
                const req = (freshDB.yearChangeRequests || []).find(r => r.id === _pendingYearReqId);
                if (req && req.status !== 'pending') {
                    stopTeacherPolling();
                    if (req.status === 'approved') {
                        DB.schoolYear = req.requestedYear;
                        DB.yearChangeRequests = freshDB.yearChangeRequests;
                        const el = document.getElementById('current-year-display');
                        if (el) el.textContent = req.requestedYear;
                        await saveDB();
                        showYearRespToast('approved', req.requestedYear);
                    } else {
                        DB.yearChangeRequests = freshDB.yearChangeRequests;
                        showYearRespToast('rejected', req.requestedYear);
                    }
                }
            } catch (e) { }
        }

        function requestYearChange() {
            // المدرس يبعت طلب بدل ما يطلب كلمة مرور الأدمن
            const y = document.getElementById('year-input').value.trim();
            if (!y) { showToast('⚠️ أدخل السنة المطلوبة أولاً'); return; }
            if (y === DB.schoolYear) { showToast('⚠️ هذا هو العام الحالي بالفعل'); return; }
            const teacherName = CURRENT_TEACHER.name || 'مدرس';
            const req = {
                id: 'YR_' + Date.now(),
                teacherName,
                requestedYear: y,
                currentYear: DB.schoolYear,
                time: new Date().toLocaleString('ar-EG'),
                status: 'pending' // pending | approved | rejected
            };
            // حفظ في DB
            if (!DB.yearChangeRequests) DB.yearChangeRequests = [];
            // إلغاء أي طلب قديم من نفس المدرس
            DB.yearChangeRequests = DB.yearChangeRequests.filter(r => r.teacherName !== teacherName || r.status !== 'pending');
            DB.yearChangeRequests.unshift(req);
            if (DB.yearChangeRequests.length > 30) DB.yearChangeRequests.splice(30);
            saveDB();
            // إرسال عبر localStorage للأدمن في نفس المتصفح
            try { localStorage.setItem(YEAR_REQ_LS_KEY, JSON.stringify({ ...req, _t: Date.now() })); } catch (e) { }
            closeModal('modal-year');
            showToast('📤 تم إرسال طلب تغيير السنة للأدمن للموافقة');
            _playYearReqSound();
            // ✅ بدء استطلاع رد الأدمن عبر السحابة (لأجهزة مختلفة)
            startTeacherPolling(req.id);
        }

        function approveYearRequest(reqId) {
            if (!DB.yearChangeRequests) return;
            const req = DB.yearChangeRequests.find(r => r.id === reqId);
            if (!req || req.status !== 'pending') return;
            req.status = 'approved';
            // تنفيذ التغيير
            DB.schoolYear = req.requestedYear;
            document.getElementById('current-year-display').textContent = DB.schoolYear;
            saveDB();
            updateAdminNotifBadge();
            renderYearReqList();
            showToast('✅ تمت الموافقة — السنة تغيّرت إلى ' + req.requestedYear);
            // إعلام المدرس
            try { localStorage.setItem(YEAR_REQ_RESP_KEY, JSON.stringify({ reqId, status: 'approved', year: req.requestedYear, t: Date.now() })); } catch (e) { }
        }

        function rejectYearRequest(reqId) {
            if (!DB.yearChangeRequests) return;
            const req = DB.yearChangeRequests.find(r => r.id === reqId);
            if (!req || req.status !== 'pending') return;
            req.status = 'rejected';
            saveDB();
            updateAdminNotifBadge();
            renderYearReqList();
            showToast('❌ تم رفض طلب تغيير السنة');
            // إعلام المدرس
            try { localStorage.setItem(YEAR_REQ_RESP_KEY, JSON.stringify({ reqId, status: 'rejected', year: req.requestedYear, t: Date.now() })); } catch (e) { }
        }

        function renderYearReqList() {
            const sec = document.getElementById('year-req-section');
            const list = document.getElementById('year-req-list');
            if (!sec || !list) return;
            const reqs = (DB.yearChangeRequests || []).filter(r => r.status === 'pending');
            if (!reqs.length) { sec.style.display = 'none'; return; }
            sec.style.display = 'block';
            list.innerHTML = reqs.map(r => `
    <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(201,162,39,.06)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px">📅</span>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:900;color:#e8c04a">${r.teacherName}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:1px">طلب تغيير السنة من <strong style="color:rgba(255,255,255,.8)">${r.currentYear}</strong> إلى <strong style="color:#6ee7b7">${r.requestedYear}</strong></div>
        </div>
        <span style="background:#e74c3c;color:#fff;border-radius:10px;padding:2px 8px;font-size:9px;font-weight:900;flex-shrink:0">جديد</span>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,.28);margin-bottom:9px">🕐 ${r.time}</div>
      <div style="display:flex;gap:7px">
        <button onclick="approveYearRequest('${r.id}')"
          style="flex:1;padding:7px 10px;background:linear-gradient(135deg,#133d1b,#1a5c2a,#237a38);color:#fff;border:none;border-radius:8px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s"
          onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
          ✅ موافقة
        </button>
        <button onclick="rejectYearRequest('${r.id}')"
          style="flex:1;padding:7px 10px;background:linear-gradient(135deg,#5a0e0e,#8b1a1a,#c0392b);color:#fff;border:none;border-radius:8px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s"
          onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
          ❌ رفض
        </button>
      </div>
    </div>`).join('');
        }

        function _playYearReqSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(660, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
                osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.24);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
            } catch (e) { }
        }

        // الاستماع لردود الأدمن (لو المدرس في تاب ثاني)
        window.addEventListener('storage', function (e) {
            if (e.key === YEAR_REQ_RESP_KEY && e.newValue && IS_TEACHER_MODE) {
                try {
                    const resp = JSON.parse(e.newValue);
                    if (resp.status === 'approved') {
                        DB.schoolYear = resp.year;
                        const el = document.getElementById('current-year-display');
                        if (el) el.textContent = resp.year;
                        saveDB();
                        showYearRespToast('approved', resp.year);
                    } else {
                        showYearRespToast('rejected', resp.year);
                    }
                } catch (ex) { }
            }
            // الإشعارات الموجودة للمدرسين الجدد (نفس الجهاز — تابات مختلفة)
            if (e.key === 'school_new_teacher_notif' && e.newValue && IS_EDIT_MODE && !IS_TEACHER_MODE) {
                try {
                    const n = JSON.parse(e.newValue);
                    // ✅ FIX: تحديث DB.teacherNotifs في ذاكرة الأدمن مباشرة (مش بس Toast)
                    if (!DB.teacherNotifs) DB.teacherNotifs = [];
                    const alreadyExists = DB.teacherNotifs.find(x =>
                        x.id === n.id || (x.name === n.name && Math.abs(((x.id) || 0) - n.t) < 10000)
                    );
                    if (!alreadyExists) {
                        DB.teacherNotifs.unshift({
                            id: n.id || n.t,
                            name: n.name,
                            subjects: n.subjects || '—',
                            stages: n.stages || '—',
                            time: new Date(n.t).toLocaleString('ar-EG'),
                            read: false,
                        });
                    }
                    showAdminNewTeacherToast(n.name, n.subjects);
                    updateAdminNotifBadge();
                } catch (ex) { }
            }
            // طلب جديد وصل للأدمن
            if (e.key === YEAR_REQ_LS_KEY && e.newValue && IS_EDIT_MODE && !IS_TEACHER_MODE) {
                try {
                    const req = JSON.parse(e.newValue);
                    if (!DB.yearChangeRequests) DB.yearChangeRequests = [];
                    if (!DB.yearChangeRequests.find(r => r.id === req.id)) {
                        DB.yearChangeRequests.unshift(req);
                        saveDB();
                    }
                    updateAdminNotifBadge();
                    showAdminYearReqToast(req);
                } catch (ex) { }
            }
        });

        function showYearRespToast(status, year) {
            const approved = status === 'approved';
            const t = document.createElement('div');
            t.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:99999;background:linear-gradient(135deg,#07152a,#0d2645);border:1.5px solid rgba(201,162,39,.45);border-radius:14px;padding:16px 18px;min-width:280px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.45);font-family:Cairo,sans-serif;direction:rtl;animation:slideInToast .35s ease';
            t.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div style="font-size:36px">${approved ? '✅' : '❌'}</div>
      <div>
        <div style="font-size:13px;font-weight:900;color:${approved ? '#6ee7b7' : '#f87171'};margin-bottom:3px">${approved ? 'تمت الموافقة!' : 'تم الرفض'}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.7)">${approved ? 'تم تغيير السنة إلى <strong style="color:#e8c04a">' + year + '</strong>' : 'الأدمن رفض طلب تغيير السنة إلى ' + year}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,.3);font-size:16px;cursor:pointer;padding:0;margin-right:auto">✕</button>
    </div>`;
            document.body.appendChild(t);
            setTimeout(() => { if (t.parentNode) { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); } }, 7000);
        }

        function showAdminYearReqToast(req) {
            const existing = document.getElementById('admin-year-req-toast');
            if (existing) existing.remove();
            const t = document.createElement('div');
            t.id = 'admin-year-req-toast';
            t.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:99999;background:linear-gradient(135deg,#07152a,#0d2645,#163b72);border:1.5px solid rgba(201,162,39,.5);border-radius:16px;padding:16px 18px;min-width:300px;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:Cairo,sans-serif;direction:rtl;animation:slideInToast .35s ease';
            t.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:11px;margin-bottom:12px">
      <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#9a7a1a,#c9a227);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📅</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:900;color:#e8c04a;margin-bottom:3px">طلب تغيير سنة!</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);font-weight:700">${req.teacherName}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:2px">${req.currentYear} → <span style="color:#6ee7b7;font-weight:700">${req.requestedYear}</span></div>
      </div>
      <button onclick="document.getElementById('admin-year-req-toast').remove()" style="background:none;border:none;color:rgba(255,255,255,.3);font-size:16px;cursor:pointer;padding:0">✕</button>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="approveYearRequest('${req.id}');document.getElementById('admin-year-req-toast')?.remove()"
        style="flex:1;padding:8px;background:linear-gradient(135deg,#133d1b,#237a38);color:#fff;border:none;border-radius:9px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer">✅ موافقة</button>
      <button onclick="rejectYearRequest('${req.id}');document.getElementById('admin-year-req-toast')?.remove()"
        style="flex:1;padding:8px;background:linear-gradient(135deg,#5a0e0e,#c0392b);color:#fff;border:none;border-radius:9px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer">❌ رفض</button>
    </div>`;
            document.body.appendChild(t);
            _playYearReqSound();
            setTimeout(() => { if (t.parentNode) { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); } }, 12000);
        }

        function toggleTeacherNotifPanel() {
            const panel = document.getElementById('teacher-notif-panel');
            if (!panel) return;
            const isVisible = panel.style.display !== 'none';
            if (isVisible) {
                panel.style.display = 'none';
            } else {
                renderYearReqList();
                renderTeacherNotifList();
                panel.style.display = 'block';
                if (DB.teacherNotifs) DB.teacherNotifs.forEach(n => n.read = true);
                saveDB();
                updateAdminNotifBadge();
            }
        }
        function renderTeacherNotifList() {
            const cont = document.getElementById('teacher-notif-list');
            if (!cont) return;
            const notifs = DB.teacherNotifs || [];
            if (!notifs.length) {
                cont.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.4);font-size:12px">🎉 لا توجد إشعارات جديدة</div>';
                return;
            }
            cont.innerHTML = notifs.map((n, i) => `
    <div style="padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer;transition:background .15s;${!n.read ? 'background:rgba(201,162,39,.07)' : ''}"
      onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background='${!n.read ? 'rgba(201,162,39,.07)' : ''}'"
      onclick="navigate('teacher-log');toggleTeacherNotifPanel()">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:16px">👨‍🏫</span>
        <span style="font-size:13px;font-weight:900;color:#e8c04a;flex:1">${n.name}</span>
        ${!n.read ? '<span style="background:#e74c3c;color:#fff;border-radius:10px;padding:1px 7px;font-size:9px;font-weight:900">جديد</span>' : ''}
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.6);margin-right:24px;margin-bottom:2px">📚 ${n.subjects || '—'}</div>
      ${n.stages && n.stages !== '—' ? `<div style="font-size:11px;color:rgba(255,255,255,.45);margin-right:24px;margin-bottom:2px">🏫 ${n.stages}</div>` : ''}
      <div style="font-size:10px;color:rgba(255,255,255,.28);margin-right:24px">🕐 ${n.time || ''}</div>
    </div>`).join('');
        }
        function clearTeacherNotifs() {
            DB.teacherNotifs = [];
            saveDB();
            renderTeacherNotifList();
            updateAdminNotifBadge();
        }

        // =========================================================
        // ✅ ADMIN CLOUD POLLING — إشعارات فورية عبر الأجهزة المختلفة
        // يحل مشكلة: storage event لا يعمل إلا على نفس الجهاز
        // =========================================================
        let _adminPollInterval = null;
        let _lastPollTime = 0;
        const ADMIN_POLL_INTERVAL = 30000; // كل 30 ثانية

        async function startAdminPolling() {
            stopAdminPolling();
            if (!FIREBASE_URL) return; // فقط لو فيه cloud مضبوط
            _adminPollInterval = setInterval(_adminPollCheck, ADMIN_POLL_INTERVAL);
        }

        function stopAdminPolling() {
            if (_adminPollInterval) { clearInterval(_adminPollInterval); _adminPollInterval = null; }
        }

        async function _adminPollCheck() {
            if (!IS_EDIT_MODE || IS_TEACHER_MODE) { stopAdminPolling(); return; }
            try {
                const cloudStr = await cloudLoad(DB_KEY);
                if (!cloudStr) return;
                const freshDB = typeof cloudStr === 'string' ? JSON.parse(cloudStr) : cloudStr;

                // ── فحص إشعارات المدرسين الجدد ──
                const freshNotifs = freshDB.teacherNotifs || [];
                if (!DB.teacherNotifs) DB.teacherNotifs = [];
                let gotNewNotif = false;
                freshNotifs.forEach(fn => {
                    const exists = DB.teacherNotifs.find(x =>
                        (x.id && fn.id && x.id === fn.id) ||
                        (x.name === fn.name && x.time === fn.time)
                    );
                    if (!exists) {
                        DB.teacherNotifs.unshift({ ...fn, read: false });
                        showAdminNewTeacherToast(fn.name, fn.subjects);
                        gotNewNotif = true;
                    }
                });
                if (DB.teacherNotifs.length > 50) DB.teacherNotifs.splice(50);

                // ── فحص طلبات تغيير السنة الجديدة ──
                const freshYearReqs = freshDB.yearChangeRequests || [];
                if (!DB.yearChangeRequests) DB.yearChangeRequests = [];
                let gotNewYearReq = false;
                freshYearReqs.forEach(fr => {
                    if (fr.status !== 'pending') return;
                    const exists = DB.yearChangeRequests.find(x => x.id === fr.id);
                    if (!exists) {
                        DB.yearChangeRequests.unshift(fr);
                        showAdminYearReqToast(fr);
                        gotNewYearReq = true;
                    }
                });

                // ── دمج المدرسين المسجلين الجدد ──
                const freshTeachers = freshDB.registeredTeachers || [];
                if (!DB.registeredTeachers) DB.registeredTeachers = [];
                freshTeachers.forEach(ft => {
                    if (!DB.registeredTeachers.find(r => r.name === ft.name)) {
                        DB.registeredTeachers.push(ft);
                    }
                });

                if (gotNewNotif || gotNewYearReq) updateAdminNotifBadge();
            } catch (e) { }
        }
        // storage listener موحد في قسم YEAR CHANGE REQUESTS
        // إغلاق لوحة الإشعارات عند الضغط خارجها
        document.addEventListener('click', function (e) {
            const wrap = document.getElementById('admin-notif-wrap');
            const panel = document.getElementById('teacher-notif-panel');
            if (wrap && panel && panel.style.display !== 'none') {
                if (!wrap.contains(e.target)) panel.style.display = 'none';
            }
        });
        function startApp(editMode) {
            // Load custom stages if saved
            if (DB.settings && DB.settings.customStages && Array.isArray(DB.settings.customStages) && DB.settings.customStages.length) {
                STAGES = DB.settings.customStages;
            } else {
                STAGES = [...DEFAULT_STAGES];
            }
            // Set logos
            const lockChurch = document.getElementById('lock-church-logo'); if (lockChurch) lockChurch.src = CHURCH_LOGO_B64;
            const lockSchool = document.getElementById('lock-school-logo'); if (lockSchool) lockSchool.src = SCHOOL_LOGO_B64;

            document.getElementById('lock-overlay').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            document.getElementById('edit-bar').style.display = 'flex';
            applyEditMode(editMode);

            renderDashboard();
            checkBirthdays();
            initPromotePage();
            renderStagesManager();

            if (IS_TEACHER_MODE) {
                applyTeacherMode();
                _showTeacherWelcome();
                // إظهار زر الرئيسية، إخفاء الجرس (للمدرس فقط)
                const hb = document.getElementById('home-btn');
                if (hb) hb.style.display = 'flex';
                const nw = document.getElementById('admin-notif-wrap');
                if (nw) nw.style.display = 'none';
            } else if (IS_EDIT_MODE) {
                loadPermsUI();
                // Admin — show everything except teacher-profile (خاص بوضع المدرس فقط)
                document.querySelectorAll('.nav-item[data-perm], .nav-section').forEach(el => {
                    if (el.getAttribute('data-perm') === 'teacher-profile') el.style.display = 'none';
                    else el.style.display = '';
                });
                // إظهار زر الرئيسية والجرس للأدمن
                const hb2 = document.getElementById('home-btn');
                if (hb2) hb2.style.display = 'flex';
                const nw2 = document.getElementById('admin-notif-wrap');
                if (nw2) nw2.style.display = '';
                updateAdminNotifBadge();
                startAdminPolling(); // ✅ بدء الاستطلاع السحابي للإشعارات الفورية
            } else {
                // Readonly — نفس صلاحيات المدرس الافتراضية
                applyReadonlyMode();
                const hb3 = document.getElementById('home-btn');
                if (hb3) hb3.style.display = 'none';
                const nw3 = document.getElementById('admin-notif-wrap');
                if (nw3) nw3.style.display = 'none';
            }
        }
        function applyEditMode(edit) {
            IS_EDIT_MODE = edit;
            const bar = document.getElementById('edit-bar');
            const icon = document.getElementById('edit-bar-icon');
            const msg = document.getElementById('edit-bar-msg');
            const teacherTag = document.getElementById('edit-bar-teacher-tag');
            if (edit && IS_TEACHER_MODE) {
                bar.style.background = 'linear-gradient(135deg,#0d5c8a,#1a7abf)';
                icon.textContent = '👨‍🏫';
                const scopeLbl = CURRENT_TEACHER.scopeAll === false ? '🎯 مراحل محددة' : '🏫 كل المدرسة';
                msg.textContent = 'وضع المدرس — ' + scopeLbl;
                if (teacherTag) {
                    teacherTag.textContent = CURRENT_TEACHER.name || 'مدرس';
                    teacherTag.style.display = '';
                }
                // اسم المدرس في هيدر الأب بدون نص المواد
                const sysName = document.querySelector('.system-name');
                if (sysName && CURRENT_TEACHER.name) sysName.textContent = '👨‍🏫 ' + CURRENT_TEACHER.name;
                // ✅ FIX: إظهار زر السنة للمدرس (بدل إخفائه) — المدرس يقدر يرسل طلب تغيير فقط
                const yb = document.getElementById('year-badge-btn');
                if (yb) {
                    yb.style.display = '';
                    yb.title = 'طلب تغيير السنة الدراسية';
                    // تغيير أيقونة الزر لتوضيح إنه طلب وليس تغيير مباشر
                    const yrSpan = yb.querySelector('#current-year-display');
                    const yrText = yrSpan ? yrSpan.textContent : (DB?.schoolYear || '2025/2026');
                    if (yrSpan) yrSpan.textContent = yrText;
                    // أضف علامة "طلب" بدون إعادة كتابة innerHTML (يتجنب duplicate ID)
                    let reqLabel = yb.querySelector('.yr-req-label');
                    if (!reqLabel) { reqLabel = document.createElement('span'); reqLabel.className = 'yr-req-label'; reqLabel.style.cssText = 'font-size:10px;opacity:.7'; yb.appendChild(reqLabel); }
                    reqLabel.textContent = ' 📤 طلب';
                }
                document.body.classList.remove('readonly');
            } else if (edit) {
                bar.style.background = 'linear-gradient(135deg,#1a5c2a,#237a38)';
                icon.textContent = '✅'; msg.textContent = 'وضع التعديل — يمكنك تعديل كل البيانات';
                if (teacherTag) teacherTag.style.display = 'none';
                const sysName = document.querySelector('.system-name');
                if (sysName) sysName.textContent = '🎵 للألحان والطقس والقبطي — نظام إدارة المدرسة';
                const yb2 = document.getElementById('year-badge-btn');
                if (yb2) yb2.style.display = '';
                document.body.classList.remove('readonly');
            } else {
                bar.style.background = 'linear-gradient(135deg,#7a1a1a,#c0392b)';
                icon.textContent = '🔒'; msg.textContent = 'وضع العرض فقط — الطباعة والاستعراض متاحان';
                if (teacherTag) teacherTag.style.display = 'none';
                const sysName = document.querySelector('.system-name');
                if (sysName) sysName.textContent = '🎵 للألحان والطقس والقبطي — نظام إدارة المدرسة';
                document.body.classList.add('readonly');
            }
            const credsForm = document.getElementById('creds-form');
            const credsMsg = document.getElementById('creds-locked-msg');
            if (credsForm) credsForm.style.display = (edit && !IS_TEACHER_MODE) ? '' : 'none';
            if (credsMsg) credsMsg.style.display = (edit && !IS_TEACHER_MODE) ? 'none' : 'flex';
        }
        function applyReadonlyMode() {
            // وضع المشاهدة — نفس صلاحيات المدرس بدون تعديل
            document.getElementById('app').style.display = 'block';

            // الصفحات المسموح بها للمشاهدة فقط
            const allowed = new Set(['absence', 'exams', 'results', 'students']);

            document.querySelectorAll('.nav-item[data-perm], .nav-section').forEach(el => {
                if (el.classList.contains('nav-section')) { el.style.display = ''; return; }
                const perm = el.getAttribute('data-perm');
                if (perm === 'admin' || perm === 'teacher-profile' || perm === 'dashboard') {
                    el.style.display = 'none';
                } else {
                    el.style.display = allowed.has(perm) ? '' : 'none';
                }
            });

            // إخفاء الـ sections الفاضية
            document.querySelectorAll('.nav-section').forEach(sec => {
                let next = sec.nextElementSibling;
                let hasVisible = false;
                while (next && !next.classList.contains('nav-section')) {
                    if (next.classList.contains('nav-item') && next.style.display !== 'none') { hasVisible = true; break; }
                    next = next.nextElementSibling;
                }
                sec.style.display = hasVisible ? '' : 'none';
            });

            navigate('students');
        }

