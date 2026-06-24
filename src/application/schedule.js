
        // ══════════════════════════════════════════════════════════
        // DETAILED SCHEDULE MODULE v3 — Multi-Term
        // ══════════════════════════════════════════════════════════
        const SCHED_LS_KEY = 'school_detailed_schedule_v3';

        const SCHED_DEFAULT_DATES = [
            { label: '23/1/2026', sessions: ['ح1', 'ح2'] },
            { label: '30/1/2026', sessions: ['ح1', 'ح2'] },
            { label: '6/2/2026', sessions: ['ح1', 'ح2'] },
            { label: '13/2/2026', sessions: ['ح1', 'ح2'] },
            { label: '20/2/2026', sessions: ['ح1', 'ح2'] },
            { label: '27/2/2026', sessions: ['ح1', 'ح2'] },
            { label: '6/3/2026', sessions: ['ح1', 'ح2'] },
            { label: '13/3/2026', sessions: ['ح1', 'ح2'] },
            { label: '20/3/2026', sessions: ['ح1', 'ح2'] },
            { label: '27/3/2026', sessions: ['ح1', 'ح2', 'ح3'] },
        ];

        const SCHED_DEFAULT_GRADES = ['حضانة', 'أولى ب', 'ثانية ب', 'ثالثة ب', 'رابعة', 'خامسة', 'سادسة', 'أولى ع', 'ثانية ع', 'ثالثة ع', 'أولى ث', 'ثانية ث'];

        function _sc(d, s, subj, teacher) { return { date: d, sess: s, subj: subj, teacher: teacher || '' }; }

        // ── Build default term ─────────────────────────────────────
        function buildDefaultTerm() {
            return {
                id: 't' + Date.now(),
                name: 'الترم الثاني',
                year: '2025-2026',
                startLabel: '23 يناير',
                endLabel: '27 مارس 2026',
                dates: JSON.parse(JSON.stringify(SCHED_DEFAULT_DATES)),
                grades: [...SCHED_DEFAULT_GRADES],
                cells: {}
            };
        }

        // ── Load / Save ──────────────────────────────────────────
        async function loadScheduleData() {
            try {
                // Try new v3 key
                const s = await storeLoad(SCHED_LS_KEY);
                if (s) {
                    const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                    if (parsed && parsed.terms && parsed.terms.length > 0) return parsed;
                }
                // Try migrating from old v2 key
                const old = await storeLoad('school_detailed_schedule_v2');
                if (old) {
                    const parsedOld = typeof old === 'string' ? JSON.parse(old) : old;
                    if (parsedOld && parsedOld.dates) {
                        const migratedTerm = {
                            id: 't' + Date.now(),
                            name: 'الترم الثاني',
                            year: '2025-2026',
                            startLabel: '23 يناير',
                            endLabel: '27 مارس 2026',
                            dates: parsedOld.dates || JSON.parse(JSON.stringify(SCHED_DEFAULT_DATES)),
                            grades: parsedOld.grades || [...SCHED_DEFAULT_GRADES],
                            cells: parsedOld.cells || {}
                        };
                        const newState = { activeTermId: migratedTerm.id, terms: [migratedTerm] };
                        saveScheduleData(newState);
                        return newState;
                    }
                }
                return buildDefaultScheduleState();
            } catch (e) { return buildDefaultScheduleState(); }
        }

        function buildDefaultScheduleState() {
            const t = buildDefaultTerm();
            return { activeTermId: t.id, terms: [t] };
        }

        function saveScheduleData(state) {
            try { storeSave(SCHED_LS_KEY, state); } catch (e) { }
        }

        let _schedState = null;
        async function getSchedState() {
            if (!_schedState) _schedState = await loadScheduleData();
            return _schedState;
        }
        function getActiveTermState() {
            if (!_schedState) return null;
            return _schedState.terms.find(t => t.id === _schedState.activeTermId) || _schedState.terms[0] || null;
        }

        // ── Term Selector UI ──────────────────────────────────────
        function _updateTermSelector() {
            const sel = document.getElementById('sched-term-sel');
            if (!sel || !_schedState) return;
            sel.innerHTML = _schedState.terms.map(t =>
                `<option value="${t.id}"${t.id === _schedState.activeTermId ? ' selected' : ''}>${t.name} ${t.year}</option>`
            ).join('');
        }

        function _updateTermLabel() {
            const lbl = document.getElementById('sched-term-label');
            const term = getActiveTermState();
            if (!lbl || !term) return;
            const range = (term.startLabel || term.endLabel)
                ? ' (' + (term.startLabel || '') + (term.startLabel && term.endLabel ? ' — ' : '') + (term.endLabel || '') + ')'
                : '';
            lbl.textContent = `${term.name} ${term.year}${range}`;
        }

        async function switchSchedTerm(termId) {
            const state = await getSchedState();
            if (!state.terms.find(t => t.id === termId)) return;
            state.activeTermId = termId;
            saveScheduleData(state);
            _updateTermSelector();
            _updateTermLabel();
            // Reset filters
            ['sched-date-filter','sched-teacher-filter','sched-subj-filter'].forEach(id=>{
                const el=document.getElementById(id); if(el) el.value='all';
            });
            const s=document.getElementById('sched-search'); if(s) s.value='';
            _activeStage = 'all';
            renderDetailedSchedule();
        }

        // ── Selected stage tab state ──────────────────────────────
        let _activeStage = 'all';
        function setActiveStage(g){ _activeStage = g; renderDetailedSchedule(); }
        function resetSchedFilters(){
            ['sched-date-filter','sched-teacher-filter','sched-subj-filter'].forEach(id=>{
                const el=document.getElementById(id); if(el) el.value='all';
            });
            const s=document.getElementById('sched-search'); if(s) s.value='';
            _activeStage = 'all';
            renderDetailedSchedule();
        }

        // ── Subject Colors ────────────────────────────────────────
        function subjStyle(subj) {
            if (subj === 'ألحان') return 'background:#eff6ff;color:#1e40af;border:1.5px solid #93c5fd';
            if (subj === 'قبطي') return 'background:#f0fdf4;color:#166534;border:1.5px solid #86efac';
            if (subj === 'طقس') return 'background:#f5f3ff;color:#5b21b6;border:1.5px solid #c4b5fd';
            return 'background:#f1f5f9;color:#94a3b8;border:1.5px solid #e2e8f0';
        }
        function subjIcon(subj) {
            if (subj === 'ألحان') return '🎵';
            if (subj === 'قبطي') return '📖';
            if (subj === 'طقس') return '⛪';
            return '';
        }

        // ── Render ────────────────────────────────────────────────
        async function renderDetailedSchedule() {
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;

            _updateTermSelector();
            _updateTermLabel();

            const dateFilter = document.getElementById('sched-date-filter')?.value || 'all';
            const teacherFilter = document.getElementById('sched-teacher-filter')?.value || 'all';
            const subjFilter = document.getElementById('sched-subj-filter')?.value || 'all';
            const searchQ = (document.getElementById('sched-search')?.value || '').trim().toLowerCase();

            // Populate date filter
            const dfSel = document.getElementById('sched-date-filter');
            if (dfSel) {
                const cur = dfSel.value;
                dfSel.innerHTML = '<option value="all">كل التواريخ</option>' +
                    term.dates.map(d => `<option value="${d.label}">${d.label}</option>`).join('');
                if (cur && [...dfSel.options].some(o=>o.value===cur)) dfSel.value = cur;
            }

            // Populate teacher filter from cells
            const teacherSet = new Set();
            Object.values(term.cells || {}).forEach(c => {
                if (c && c.teacher) c.teacher.split(/\s*\/\s*/).forEach(n => { if (n.trim()) teacherSet.add(n.trim()); });
            });
            const tSel = document.getElementById('sched-teacher-filter');
            if (tSel) {
                const cur = tSel.value;
                const teachers = [...teacherSet].sort((a,b)=>a.localeCompare(b,'ar'));
                tSel.innerHTML = '<option value="all">كل المدرسين</option>' +
                    teachers.map(n => `<option value="${n}">${n}</option>`).join('');
                if (cur && [...tSel.options].some(o=>o.value===cur)) tSel.value = cur;
            }

            // Render stage tabs
            const stagesWrap = document.getElementById('sched-stage-tabs');
            if (stagesWrap) {
                const tabStyle = (active) => `padding:6px 14px;border-radius:18px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:800;cursor:pointer;border:2px solid ${active?'var(--navy)':'var(--border)'};background:${active?'var(--navy)':'#fff'};color:${active?'#fff':'var(--navy)'};transition:all .15s`;
                let tabsHtml = `<button onclick="setActiveStage('all')" style="${tabStyle(_activeStage==='all')}">🎓 كل المراحل</button>`;
                tabsHtml += term.grades.map(g => `<button onclick="setActiveStage('${g.replace(/'/g,"\\'")}')" style="${tabStyle(_activeStage===g)}">${g}</button>`).join('');
                stagesWrap.innerHTML = tabsHtml;
            }

            const activeDates = dateFilter === 'all' ? term.dates : term.dates.filter(d => d.label === dateFilter);
            const activeGrades = _activeStage === 'all' ? term.grades : term.grades.filter(g => g === _activeStage);

            // Helper: does a cell match filters?
            const cellMatches = (cell) => {
                if (!cell) cell = { subj: '---', teacher: '' };
                if (subjFilter !== 'all' && cell.subj !== subjFilter) return false;
                if (teacherFilter !== 'all') {
                    const names = (cell.teacher||'').split(/\s*\/\s*/).map(s=>s.trim());
                    if (!names.includes(teacherFilter)) return false;
                }
                if (searchQ) {
                    const hay = ((cell.subj||'') + ' ' + (cell.teacher||'')).toLowerCase();
                    if (!hay.includes(searchQ)) return false;
                }
                return true;
            };
            const anyFilterActive = subjFilter !== 'all' || teacherFilter !== 'all' || !!searchQ;

            // Build column headers
            let headerRow1 = '<tr><th rowspan="2" style="position:sticky;right:0;z-index:3;background:linear-gradient(135deg,#0d2645,#1a3d6e);min-width:90px;font-size:12px;padding:10px 14px">المرحلة</th>';
            let headerRow2 = '<tr>';
            for (const d of activeDates) {
                headerRow1 += `<th colspan="${d.sessions.length}" style="background:linear-gradient(135deg,#0d2645,#1a3d6e);border-left:2px solid rgba(201,162,39,.3);padding:8px 6px;font-size:11px;white-space:nowrap;min-width:${d.sessions.length * 110}px">${d.label}</th>`;
                for (const s of d.sessions) {
                    headerRow2 += `<th style="background:linear-gradient(135deg,#163358,#1a3d6e);border-left:1px solid rgba(255,255,255,.1);padding:6px 8px;font-size:11px;min-width:110px;font-weight:700">${s}</th>`;
                }
            }
            headerRow1 += '</tr>';
            headerRow2 += '</tr>';

            // Build data rows
            let bodyRows = '';
            let matchCount = 0, totalCount = 0;
            for (const grade of activeGrades) {
                let row = `<tr>
      <td class="sticky-col" style="position:sticky;right:0;background:#fff;z-index:2;font-weight:900;font-size:12px;color:#0d2645;border-left:2px solid var(--border);padding:8px 12px;white-space:nowrap">${grade}</td>`;
                for (const d of activeDates) {
                    for (const s of d.sessions) {
                        const key = grade + '||' + d.label + '||' + s;
                        const cell = term.cells[key] || { subj: '---', teacher: '' };
                        const isEdit = !document.body.classList.contains('readonly');
                        const clickAttr = isEdit ? `onclick="handleSchedCellClick('${encodeURIComponent(key)}','${grade}','${d.label}','${s}')" style="cursor:pointer;transition:all .15s" onmouseenter="this.style.opacity='.75'" onmouseleave="this.style.opacity='1'"` : '';
                        totalCount++;
                        const isMatch = cellMatches(cell);
                        if (isMatch) matchCount++;
                        // Dim cells that don't match active filters (keep grid intact)
                        const dim = anyFilterActive && !isMatch ? 'opacity:.18;filter:grayscale(.6)' : '';
                        const highlight = anyFilterActive && isMatch ? 'box-shadow:0 0 0 2px #f59e0b' : '';
                        row += `<td style="padding:5px 6px;border-left:1px solid rgba(212,192,138,.25);vertical-align:top;${dim}" ${clickAttr}>
          <div style="${subjStyle(cell.subj)};border-radius:8px;padding:5px 8px;min-height:54px;display:flex;flex-direction:column;gap:2px;${highlight}">
            <div style="font-size:11px;font-weight:900">${subjIcon(cell.subj)} ${cell.subj === '---' ? '—' : cell.subj}</div>
            ${cell.subj !== '---' && cell.teacher ? `<div style="font-size:10px;line-height:1.4;opacity:.8">${cell.teacher}</div>` : ''}
          </div>
        </td>`;
                    }
                }
                row += '</tr>';
                bodyRows += row;
            }

            let summaryBar = '';
            if (anyFilterActive) {
                summaryBar = `<div style="padding:8px 14px;background:#fffbeb;border-bottom:1.5px solid #fcd34d;font-size:11px;font-weight:700;color:#92400e">🎯 نتائج المطابقة: <b>${matchCount}</b> من ${totalCount} حصة ${matchCount===0?'— لا يوجد نتائج':''}</div>`;
            }
            if (activeGrades.length === 0) {
                bodyRows = `<tr><td style="padding:30px;text-align:center;color:var(--muted)">لا توجد مراحل</td></tr>`;
            }

            const html = summaryBar + `<table style="width:100%;border-collapse:collapse;font-size:12px;font-family:'Cairo',sans-serif">
    <thead style="color:#fff">${headerRow1}${headerRow2}</thead>
    <tbody>${bodyRows}</tbody>
  </table>`;

            const wrap = document.getElementById('detailed-sched-wrap');
            if (wrap) wrap.innerHTML = html;
            renderTemplateChips();
        }

        // ── Edit Cell ─────────────────────────────────────────────
        let _editingCellKey = null;
        let _schedSelectedTeachers = [];

        // ── مدرسون مسجلون ─────────────────────────────────────────
        function _getRegisteredTeachers() {
            const teachers = [];
            try {
                if (!DB.registeredTeachers) DB.registeredTeachers = [];
                let lsReg = [];
                try { lsReg = JSON.parse(localStorage.getItem('school_registered_teachers_v1') || '[]'); } catch (e) { }
                lsReg.forEach(lr => { if (!DB.registeredTeachers.find(r => r.name === lr.name)) DB.registeredTeachers.push(lr); });
                DB.registeredTeachers.forEach(t => { if (t.name) teachers.push(t); });
            } catch (e) { }
            return teachers;
        }

        function _populateSchedTeacherSelect(subj) {
            const sel = document.getElementById('sched-teacher-select');
            if (!sel) return;
            const all = _getRegisteredTeachers();
            const filtered = (subj && subj !== '---')
                ? all.filter(t => !t.subjects || !t.subjects.length || t.subjects.includes(subj))
                : all;
            sel.innerHTML = '<option value="">— اختر مدرساً مسجلاً —</option>' +
                filtered.map(t => `<option value="${t.name}">${t.name}${t.subjects && t.subjects.length ? ' (' + t.subjects.join('، ') + ')' : ''}</option>`).join('');
        }

        function _renderSchedChips() {
            const cont = document.getElementById('sched-teachers-chips');
            if (!cont) return;
            cont.innerHTML = _schedSelectedTeachers.length
                ? _schedSelectedTeachers.map((name, i) => `
        <span style="display:inline-flex;align-items:center;gap:5px;background:var(--navy);color:#fff;padding:4px 10px;border-radius:16px;font-size:12px;font-weight:700">
          👤 ${name}
          <button onclick="_removeSchedTeacher(${i})" style="background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:14px;padding:0;line-height:1">✕</button>
        </span>`).join('')
                : '<span style="font-size:11px;color:var(--muted);font-style:italic">لم يُختر مدرس بعد</span>';
            const hidden = document.getElementById('sched-cell-teacher');
            if (hidden) hidden.value = _schedSelectedTeachers.join(' / ');
        }

        function _removeSchedTeacher(idx) {
            _schedSelectedTeachers.splice(idx, 1);
            _renderSchedChips();
        }

        function addSchedTeacherFromSelect(sel) {
            const name = sel.value;
            if (!name) return;
            if (!_schedSelectedTeachers.includes(name)) _schedSelectedTeachers.push(name);
            sel.value = '';
            _renderSchedChips();
        }

        function addSchedTeacherManual() {
            const inp = document.getElementById('sched-cell-teacher-manual');
            const name = (inp?.value || '').trim();
            if (!name) { showToast('⚠️ أدخل الاسم'); return; }
            if (!_schedSelectedTeachers.includes(name)) _schedSelectedTeachers.push(name);
            if (inp) inp.value = '';
            _renderSchedChips();
        }

        function toggleSchedTeacherField() {
            const v = document.getElementById('sched-cell-subj').value;
            const wrap = document.getElementById('sched-teacher-wrap');
            if (wrap) wrap.style.display = v === '---' ? 'none' : 'flex';
            if (v !== '---') _populateSchedTeacherSelect(v);
        }

        async function openSchedCellEdit(encKey, grade, date, sess) {
            if (document.body.classList.contains('readonly')) { showToast('⚠️ وضع القراءة فقط'); return; }
            _editingCellKey = decodeURIComponent(encKey);
            const term = getActiveTermState();
            const cell = (term?.cells || {})[_editingCellKey] || { subj: '---', teacher: '' };
            document.getElementById('sched-cell-meta').textContent = `${grade} — ${date} ${sess}`;
            document.getElementById('sched-cell-subj').value = cell.subj || '---';
            _schedSelectedTeachers = cell.teacher
                ? cell.teacher.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean)
                : [];
            const manualInp = document.getElementById('sched-cell-teacher-manual');
            if (manualInp) manualInp.value = '';
            toggleSchedTeacherField();
            _renderSchedChips();
            document.getElementById('modal-sched-cell').classList.add('open');
        }
        function closeSchedCellModal() {
            document.getElementById('modal-sched-cell').classList.remove('open');
            _editingCellKey = null;
        }
        async function saveSchedCell() {
            if (!_editingCellKey) return;
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;
            term.cells[_editingCellKey] = {
                subj: document.getElementById('sched-cell-subj').value,
                teacher: document.getElementById('sched-cell-teacher').value.trim()
            };
            saveScheduleData(state);
            closeSchedCellModal();
            renderDetailedSchedule();
            showToast('✅ تم حفظ الحصة على السحابة ☁️');
        }

        // ══════════════════════════════════════════════════════════
        // ⚡ Quick Templates / Paint Mode
        // ══════════════════════════════════════════════════════════
        let _activeTemplate = null; // {subj, teacher}

        function _getTemplates() {
            if (!_schedState) return [];
            if (!Array.isArray(_schedState.templates)) _schedState.templates = [];
            return _schedState.templates;
        }

        function _tplStyle(subj) { return subjStyle(subj); }

        function renderTemplateChips() {
            const cont = document.getElementById('sched-templates-chips');
            if (!cont) return;
            const tpls = _getTemplates();
            if (!tpls.length) {
                cont.innerHTML = '<span style="font-size:12px;color:#92400e;font-style:italic">لا توجد قوالب بعد — اضغط ➕ قالب جديد لإضافة قالب سريع</span>';
                return;
            }
            cont.innerHTML = tpls.map((t, i) => {
                const isActive = _activeTemplate && _activeTemplate._idx === i;
                const ring = isActive ? 'box-shadow:0 0 0 3px #dc2626;transform:scale(1.05)' : '';
                return `<span style="display:inline-flex;align-items:center;gap:6px;${_tplStyle(t.subj)};padding:6px 10px;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;${ring}" onclick="activateTemplate(${i})" title="اضغط لتفعيل وضع الرسم">
                    ${subjIcon(t.subj)} ${t.subj}${t.teacher ? ' · ' + t.teacher : ''}
                    <button onclick="event.stopPropagation();deleteTemplate(${i})" style="background:rgba(0,0,0,.1);border:none;color:inherit;cursor:pointer;font-size:11px;padding:0 5px;border-radius:8px;line-height:1.6" title="حذف القالب">✕</button>
                </span>`;
            }).join('');
        }

        function activateTemplate(idx) {
            const tpls = _getTemplates();
            const t = tpls[idx];
            if (!t) return;
            _activeTemplate = { ...t, _idx: idx };
            document.getElementById('paint-mode-indicator').style.display = 'inline-block';
            document.getElementById('paint-stop-btn').style.display = 'inline-block';
            renderTemplateChips();
            showToast(`🖌️ وضع الرسم: ${t.subj}${t.teacher ? ' · ' + t.teacher : ''}`);
        }

        function stopPaintMode() {
            _activeTemplate = null;
            const ind = document.getElementById('paint-mode-indicator');
            const stp = document.getElementById('paint-stop-btn');
            if (ind) ind.style.display = 'none';
            if (stp) stp.style.display = 'none';
            renderTemplateChips();
        }

        async function deleteTemplate(idx) {
            if (!confirm('حذف هذا القالب؟')) return;
            const state = await getSchedState();
            if (!Array.isArray(state.templates)) state.templates = [];
            state.templates.splice(idx, 1);
            if (_activeTemplate && _activeTemplate._idx === idx) stopPaintMode();
            saveScheduleData(state);
            renderTemplateChips();
            showToast('🗑️ تم حذف القالب');
        }

        async function handleSchedCellClick(encKey, grade, date, sess) {
            if (document.body.classList.contains('readonly')) { showToast('⚠️ وضع القراءة فقط'); return; }
            // If paint mode active → apply template directly
            if (_activeTemplate) {
                const key = decodeURIComponent(encKey);
                const state = await getSchedState();
                const term = getActiveTermState();
                if (!term) return;
                term.cells[key] = { subj: _activeTemplate.subj, teacher: _activeTemplate.teacher || '' };
                saveScheduleData(state);
                renderDetailedSchedule();
                return;
            }
            // Otherwise open the normal edit modal
            openSchedCellEdit(encKey, grade, date, sess);
        }

        function openAddTemplateModal() {
            if (document.body.classList.contains('readonly')) { showToast('⚠️ وضع القراءة فقط'); return; }
            document.getElementById('tpl-subj').value = 'ألحان';
            document.getElementById('tpl-teacher-manual').value = '';
            _populateTplTeachers();
            document.getElementById('modal-add-template').classList.add('open');
        }

        function _populateTplTeachers() {
            const sel = document.getElementById('tpl-teacher-select');
            if (!sel) return;
            const subj = document.getElementById('tpl-subj').value;
            const all = _getRegisteredTeachers();
            const filtered = all.filter(t => !t.subjects || !t.subjects.length || t.subjects.includes(subj));
            sel.innerHTML = '<option value="">— بدون مدرس —</option>' +
                filtered.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
        }

        async function saveNewTemplate() {
            const subj = document.getElementById('tpl-subj').value;
            const sel = document.getElementById('tpl-teacher-select').value;
            const manual = document.getElementById('tpl-teacher-manual').value.trim();
            const teacher = manual || sel || '';
            const state = await getSchedState();
            if (!Array.isArray(state.templates)) state.templates = [];
            // Avoid duplicates
            if (state.templates.find(t => t.subj === subj && (t.teacher || '') === teacher)) {
                showToast('⚠️ هذا القالب موجود بالفعل');
                return;
            }
            state.templates.push({ subj, teacher });
            saveScheduleData(state);
            closeModal('modal-add-template');
            renderTemplateChips();
            showToast('✅ تم إضافة القالب');
        }


        // ── Date Manager ──────────────────────────────────────────
        async function openSchedDateMgr() {
            if (document.body.classList.contains('readonly')) { showToast('⚠️ وضع القراءة فقط'); return; }
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;

            // Populate term info fields
            const nameInp = document.getElementById('sched-term-name-inp');
            const yearInp = document.getElementById('sched-term-year-inp');
            const startInp = document.getElementById('sched-term-start-inp');
            const endInp = document.getElementById('sched-term-end-inp');
            if (nameInp) nameInp.value = term.name || '';
            if (yearInp) yearInp.value = term.year || '';
            if (startInp) startInp.value = term.startLabel || '';
            if (endInp) endInp.value = term.endLabel || '';

            // Show delete button only when more than 1 term
            const delBtn = document.getElementById('sched-delete-term-btn');
            if (delBtn) delBtn.style.display = state.terms.length > 1 ? '' : 'none';

            const dl = document.getElementById('sched-dates-list');
            if (dl) {
                dl.innerHTML = term.dates.map((d, i) => `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
        <span style="flex:1;font-size:12px;font-weight:700">${d.label}</span>
        <span style="font-size:11px;color:var(--muted)">${d.sessions.join(' + ')}</span>
        <button onclick="removeSchedDate(${i})" class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:10px">🗑️</button>
      </div>`).join('');
            }
            const gl = document.getElementById('sched-grades-list');
            if (gl) {
                gl.innerHTML = term.grades.map((g, i) => `
      <span style="display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;padding:4px 10px;border-radius:16px;font-size:12px;font-weight:700">
        ${g}
        <button onclick="removeSchedGrade(${i})" style="background:none;border:none;color:rgba(255,255,255,.6);cursor:pointer;font-size:13px;padding:0;line-height:1" title="حذف">✕</button>
      </span>`).join('');
            }
            document.getElementById('modal-sched-dates').classList.add('open');
        }

        async function removeSchedDate(idx) {
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;
            if (term.dates.length <= 1) { showToast('⚠️ يجب بقاء تاريخ واحد على الأقل'); return; }
            term.dates.splice(idx, 1);
            openSchedDateMgr();
        }
        async function removeSchedGrade(idx) {
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;
            if (term.grades.length <= 1) { showToast('⚠️ يجب بقاء مرحلة واحدة على الأقل'); return; }
            term.grades.splice(idx, 1);
            openSchedDateMgr();
        }
        async function addSchedDate() {
            const inp = document.getElementById('new-sched-date');
            const sessCt = parseInt(document.getElementById('new-sched-sessions').value) || 2;
            const lbl = (inp?.value || '').trim();
            if (!lbl) { showToast('⚠️ أدخل التاريخ'); return; }
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;
            if (term.dates.find(d => d.label === lbl)) { showToast('⚠️ هذا التاريخ موجود مسبقاً'); return; }
            const sessions = Array.from({ length: sessCt }, (_, i) => `ح${i + 1}`);
            term.dates.push({ label: lbl, sessions });
            if (inp) inp.value = '';
            openSchedDateMgr();
        }
        async function addSchedGrade() {
            const inp = document.getElementById('new-sched-grade');
            const lbl = (inp?.value || '').trim();
            if (!lbl) { showToast('⚠️ أدخل اسم المرحلة'); return; }
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;
            if (term.grades.includes(lbl)) { showToast('⚠️ هذه المرحلة موجودة مسبقاً'); return; }
            term.grades.push(lbl);
            if (inp) inp.value = '';
            openSchedDateMgr();
        }
        async function saveSchedStructure() {
            const state = await getSchedState();
            const term = getActiveTermState();
            if (!term) return;

            // Save term info from fields
            const nameVal = (document.getElementById('sched-term-name-inp')?.value || '').trim();
            const yearVal = (document.getElementById('sched-term-year-inp')?.value || '').trim();
            const startVal = (document.getElementById('sched-term-start-inp')?.value || '').trim();
            const endVal = (document.getElementById('sched-term-end-inp')?.value || '').trim();
            if (nameVal) term.name = nameVal;
            if (yearVal) term.year = yearVal;
            term.startLabel = startVal;
            term.endLabel = endVal;

            saveScheduleData(state);
            closeModal('modal-sched-dates');
            renderDetailedSchedule();
            showToast('✅ تم حفظ التغييرات على السحابة ☁️');
        }

        // ── Add New Term ─────────────────────────────────────────
        function openAddTermModal() {
            if (document.body.classList.contains('readonly')) { showToast('⚠️ وضع القراءة فقط'); return; }
            ['new-term-name', 'new-term-year', 'new-term-start', 'new-term-end'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = id === 'new-term-year' ? '2025-2026' : '';
            });
            const sel = document.getElementById('new-term-sessions');
            if (sel) sel.value = '2';
            document.getElementById('modal-add-term').classList.add('open');
        }

        // Generate Fridays between two dates
        function _getFridaysBetween(startDate, endDate, sessCount) {
            const dates = [];
            const d = new Date(startDate);
            while (d.getDay() !== 5) d.setDate(d.getDate() + 1); // move to first Friday
            const end = new Date(endDate);
            while (d <= end) {
                dates.push({
                    label: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
                    sessions: Array.from({ length: sessCount }, (_, i) => `ح${i + 1}`)
                });
                d.setDate(d.getDate() + 7);
            }
            return dates;
        }

        async function saveNewTerm() {
            const name = (document.getElementById('new-term-name')?.value || '').trim();
            const year = (document.getElementById('new-term-year')?.value || '').trim();
            const startVal = document.getElementById('new-term-start')?.value || '';
            const endVal = document.getElementById('new-term-end')?.value || '';
            const sessCount = parseInt(document.getElementById('new-term-sessions')?.value) || 2;

            if (!name) { showToast('⚠️ أدخل اسم الترم'); return; }
            if (!startVal || !endVal) { showToast('⚠️ أدخل تاريخ البداية والنهاية'); return; }
            if (new Date(endVal) <= new Date(startVal)) { showToast('⚠️ تاريخ النهاية يجب أن يكون بعد البداية'); return; }

            const dates = _getFridaysBetween(startVal, endVal, sessCount);
            if (!dates.length) { showToast('⚠️ لا توجد أيام جمعة بين التاريخين المحددين'); return; }

            const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            const sd = new Date(startVal);
            const ed = new Date(endVal);
            const startLabel = `${sd.getDate()} ${arMonths[sd.getMonth()]}`;
            const endLabel = `${ed.getDate()} ${arMonths[ed.getMonth()]} ${ed.getFullYear()}`;

            const state = await getSchedState();
            const currentGrades = getActiveTermState()?.grades || [...SCHED_DEFAULT_GRADES];

            const newTerm = {
                id: 't' + Date.now(),
                name, year,
                startLabel, endLabel,
                dates,
                grades: [...currentGrades],
                cells: {}
            };

            state.terms.push(newTerm);
            state.activeTermId = newTerm.id;
            saveScheduleData(state);
            closeModal('modal-add-term');
            renderDetailedSchedule();
            showToast(`✅ تم إنشاء "${name}" — ${dates.length} جمعة`);
        }

        // ── Delete Current Term ───────────────────────────────────
        async function deleteCurrentTerm() {
            const state = await getSchedState();
            if (state.terms.length <= 1) { showToast('⚠️ لا يمكن حذف الترم الوحيد'); return; }
            const term = getActiveTermState();
            if (!confirm(`هل تريد حذف ترم "${term?.name} ${term?.year}"؟ سيتم حذف جميع بيانات هذا الترم نهائياً.`)) return;
            state.terms = state.terms.filter(t => t.id !== state.activeTermId);
            state.activeTermId = state.terms[0].id;
            saveScheduleData(state);
            closeModal('modal-sched-dates');
            renderDetailedSchedule();
            showToast('🗑️ تم حذف الترم');
        }

        // ── Reset ────────────────────────────────────────────────
        function confirmResetSchedule() {
            if (!confirm('هل تريد استعادة الجدول الافتراضي؟ سيتم حذف جميع الترمات والتعديلات.')) return;
            _schedState = buildDefaultScheduleState();
            saveScheduleData(_schedState);
            renderDetailedSchedule();
            showToast('✅ تم استعادة الجدول الافتراضي');
        }

        // ── Print ─────────────────────────────────────────────────
        function printDetailedSchedule() {
            const term = getActiveTermState();
            if (!term) return;

            const range = term.startLabel
                ? ` (${term.startLabel}${term.endLabel ? ' — ' + term.endLabel : ''})`
                : '';
            const termTitle = `${term.name} ${term.year}${range}`;
            const activeDates = term.dates || [];
            const grades = term.grades || [];

            // حساب متوسط الحصص لتحديد عدد التواريخ في كل صفحة
            const avgSess = activeDates.length
                ? activeDates.reduce((s, d) => s + d.sessions.length, 0) / activeDates.length
                : 2;
            const DATES_PER_PAGE = avgSess <= 2 ? 3 : 2;

            // تقسيم التواريخ إلى مجموعات
            const chunks = [];
            for (let i = 0; i < activeDates.length; i += DATES_PER_PAGE) {
                chunks.push(activeDates.slice(i, i + DATES_PER_PAGE));
            }
            if (chunks.length === 0) chunks.push([]); // صفحة واحدة فارغة على الأقل

            let allTablesHtml = '';

            chunks.forEach((chunk, ci) => {
                // رأس الجدول — صف التواريخ
                let hr1 = `<tr>
                  <th rowspan="2" style="background:#0d2645;color:#fff;padding:7px 10px;border:1px solid #1a3d6e;font-size:11px;min-width:80px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">المرحلة</th>`;
                let hr2 = '<tr>';
                for (const d of chunk) {
                    hr1 += `<th colspan="${d.sessions.length}" style="background:#0d2645;color:#fff;padding:6px 4px;border:1px solid #1a3d6e;font-size:10px;text-align:center;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">${d.label}</th>`;
                    for (const s of d.sessions) {
                        hr2 += `<th style="background:#163358;color:#fff;padding:5px 4px;border:1px solid #1a3d6e;font-size:10px;text-align:center;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">${s}</th>`;
                    }
                }
                hr1 += '</tr>';
                hr2 += '</tr>';

                // صفوف البيانات
                let bodyRows = '';
                for (const grade of grades) {
                    let row = `<tr>
                      <td style="font-weight:900;font-size:11px;color:#0d2645;background:#fdf8ee;padding:6px 10px;border:1px solid #d4c08a;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">${grade}</td>`;
                    for (const d of chunk) {
                        for (const s of d.sessions) {
                            const key = grade + '||' + d.label + '||' + s;
                            const cell = (term.cells || {})[key] || { subj: '---', teacher: '' };
                            const bg = subjStyle(cell.subj);
                            const icon = subjIcon(cell.subj);
                            const isEmpty = cell.subj === '---';
                            row += `<td style="padding:3px 4px;border:1px solid #d4c08a;vertical-align:top;min-width:85px">
                              <div style="${bg};border-radius:6px;padding:4px 6px;min-height:46px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                                <div style="font-size:10px;font-weight:900;line-height:1.4">${isEmpty ? '—' : icon + ' ' + cell.subj}</div>
                                ${!isEmpty && cell.teacher ? `<div style="font-size:9px;opacity:.85;line-height:1.3">${cell.teacher}</div>` : ''}
                              </div>
                            </td>`;
                        }
                    }
                    row += '</tr>';
                    bodyRows += row;
                }

                const pageBreak = ci < chunks.length - 1 ? 'page-break-after:always' : '';
                allTablesHtml += `
                  <div style="${pageBreak};margin-bottom:16px">
                    <table style="width:100%;border-collapse:collapse;font-size:10px">
                      <thead>${hr1}${hr2}</thead>
                      <tbody>${bodyRows}</tbody>
                    </table>
                  </div>`;
            });

            const w = window.open('', '_blank');
            w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><title>جدول الحصص التفصيلي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 10mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Cairo',sans-serif;padding:10px;direction:rtl;background:#fff}
  h1{font-size:16px;color:#0d2645;margin-bottom:4px;text-align:center;font-weight:900}
  p{font-size:10px;color:#555;text-align:center;margin-bottom:14px}
  thead{display:table-header-group}
  tr{page-break-inside:avoid}
  @media print{
    body{padding:0}
    *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  }
</style></head><body>
<h1>📆 جدول الحصص التفصيلي — ${termTitle}</h1>
<p>مدرسة البابا شنودة</p>
${allTablesHtml}
<script>window.onload=()=>setTimeout(()=>window.print(),700)<\/script>
</body></html>`);
            w.document.close();
        }

        // =========================================================
        // ═══════════════════════════════════════════════════════
        //  TEACHER SCHEDULE MODULE — جدول المدرسين
        // ═══════════════════════════════════════════════════════
        // =========================================================

        function _updateTeacherSchedTermSelector() {
            const sel = document.getElementById('teacher-sched-term-sel');
            if (!sel || !_schedState) return;
            sel.innerHTML = _schedState.terms.map(t =>
                `<option value="${t.id}"${t.id === _schedState.activeTermId ? ' selected' : ''}>${t.name} ${t.year}</option>`
            ).join('');
        }

        function _updateTeacherSchedTermLabel() {
            const lbl = document.getElementById('teacher-sched-term-label');
            const term = getActiveTermState();
            if (!lbl || !term) return;
            const range = (term.startLabel || term.endLabel)
                ? ' (' + (term.startLabel || '') + (term.startLabel && term.endLabel ? ' — ' : '') + (term.endLabel || '') + ')'
                : '';
            lbl.textContent = `${term.name} ${term.year}${range}`;
        }

        async function switchTeacherSchedTerm(termId) {
            const state = await getSchedState();
            if (!state.terms.find(t => t.id === termId)) return;
            state.activeTermId = termId;
            saveScheduleData(state);
            _updateTeacherSchedTermSelector();
            _updateTeacherSchedTermLabel();
            renderTeacherSchedule();
        }

        // بناء خريطة المدرس ← {cellKey → [{grade, subj}]}
        function _buildTeacherMap(cells) {
            const teacherMap = {};
            Object.entries(cells || {}).forEach(([key, val]) => {
                if (!val.teacher || val.subj === '---') return;
                const parts = key.split('||');
                if (parts.length !== 3) return;
                const [grade, dateLabel, sess] = parts;
                const teachers = val.teacher.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
                teachers.forEach(tname => {
                    if (!tname) return;
                    if (!teacherMap[tname]) teacherMap[tname] = {};
                    const cellKey = dateLabel + '||' + sess;
                    if (!teacherMap[tname][cellKey]) teacherMap[tname][cellKey] = [];
                    teacherMap[tname][cellKey].push({ grade, subj: val.subj });
                });
            });
            return teacherMap;
        }

        // ترتيب المدرسين: المسجلون أولاً ثم الباقون أبجدياً
        function _buildTeacherList(teacherMap) {
            const regNames = (DB.registeredTeachers || []).map(t => t.name);
            const fromCells = new Set(Object.keys(teacherMap));
            return [
                ...regNames.filter(n => fromCells.has(n)),  // مسجل وعنده حصص
                ...regNames.filter(n => !fromCells.has(n)), // مسجل بدون حصص بعد
                ...[...fromCells].filter(n => !regNames.includes(n)).sort() // غير مسجل
            ];
        }

        async function renderTeacherSchedule() {
            await getSchedState();
            const term = getActiveTermState();
            if (!term) return;

            _updateTeacherSchedTermSelector();
            _updateTeacherSchedTermLabel();

            const activeDates = term.dates || [];
            const teacherMap = _buildTeacherMap(term.cells);
            const allTeachers = _buildTeacherList(teacherMap);
            const regNames = (DB.registeredTeachers || []).map(t => t.name);
            const wrap = document.getElementById('teacher-sched-wrap');
            if (!wrap) return;

            if (allTeachers.length === 0) {
                wrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:14px;font-weight:700">⚠️ لا يوجد مدرسون مضافون في جدول الحصص بعد<br><span style="font-size:12px;font-weight:400;margin-top:8px;display:block">أضف المدرسين في جدول الحصص التفصيلي أولاً</span></div>';
                return;
            }

            // رأس الجدول
            let headerRow1 = `<tr><th rowspan="2" style="position:sticky;right:0;z-index:3;background:linear-gradient(135deg,#0d2645,#1a3d6e);min-width:130px;font-size:12px;padding:10px 14px;color:#fff;text-align:center">المدرس / ة</th>`;
            let headerRow2 = '<tr>';
            for (const d of activeDates) {
                headerRow1 += `<th colspan="${d.sessions.length}" style="background:linear-gradient(135deg,#0d2645,#1a3d6e);border-left:2px solid rgba(201,162,39,.3);padding:8px 6px;font-size:11px;white-space:nowrap;min-width:${d.sessions.length * 105}px;color:#fff;text-align:center">${d.label}</th>`;
                for (const s of d.sessions) {
                    headerRow2 += `<th style="background:linear-gradient(135deg,#163358,#1a3d6e);border-left:1px solid rgba(255,255,255,.1);padding:6px 8px;font-size:11px;min-width:105px;font-weight:700;color:#fff;text-align:center">${s}</th>`;
                }
            }
            headerRow1 += '</tr>';
            headerRow2 += '</tr>';

            // صفوف المدرسين
            let bodyRows = '';
            for (const tname of allTeachers) {
                const isReg = regNames.includes(tname);
                let row = `<tr>
                  <td style="position:sticky;right:0;background:#fff;z-index:2;font-weight:900;font-size:11px;color:#0d2645;border-left:2px solid var(--border);padding:7px 12px;white-space:nowrap;border-bottom:1px solid rgba(212,192,138,.3)">
                    ${isReg ? '<span style="color:#16a34a;font-size:10px">✅</span> ' : ''}${tname}
                  </td>`;
                for (const d of activeDates) {
                    for (const s of d.sessions) {
                        const assignments = (teacherMap[tname] || {})[d.label + '||' + s] || [];
                        if (!assignments.length) {
                            row += `<td style="padding:4px 5px;border-left:1px solid rgba(212,192,138,.25);border-bottom:1px solid rgba(212,192,138,.2);vertical-align:middle;text-align:center">
                              <span style="font-size:12px;color:#cbd5e1">—</span>
                            </td>`;
                        } else {
                            const inner = assignments.map(a => {
                                const bg = subjStyle(a.subj);
                                const ic = subjIcon(a.subj);
                                return `<div style="${bg};border-radius:7px;padding:3px 7px;margin-bottom:2px">
                                  <div style="font-size:10px;font-weight:900">${ic} ${a.grade}</div>
                                  <div style="font-size:9px;opacity:.75;line-height:1.3">${a.subj}</div>
                                </div>`;
                            }).join('');
                            row += `<td style="padding:3px 4px;border-left:1px solid rgba(212,192,138,.25);border-bottom:1px solid rgba(212,192,138,.2);vertical-align:top">${inner}</td>`;
                        }
                    }
                }
                row += '</tr>';
                bodyRows += row;
            }

            wrap.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12px;font-family:'Cairo',sans-serif">
              <thead style="color:#fff">${headerRow1}${headerRow2}</thead>
              <tbody>${bodyRows}</tbody>
            </table>`;
        }

        function printTeacherSchedule() {
            const term = getActiveTermState();
            if (!term) return;

            const range = term.startLabel
                ? ` (${term.startLabel}${term.endLabel ? ' — ' + term.endLabel : ''})`
                : '';
            const termTitle = `${term.name} ${term.year}${range}`;
            const activeDates = term.dates || [];
            const teacherMap = _buildTeacherMap(term.cells);
            const allTeachers = _buildTeacherList(teacherMap);
            if (!allTeachers.length) { showToast('⚠️ لا يوجد مدرسون'); return; }

            // ألوان مادة للطباعة
            function ps(subj) {
                if (subj === 'ألحان') return 'background:#dbeafe;color:#1e40af;border:1px solid #93c5fd';
                if (subj === 'قبطي') return 'background:#dcfce7;color:#166534;border:1px solid #86efac';
                if (subj === 'طقس') return 'background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd';
                return 'background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0';
            }
            function pi(subj) { return subj === 'ألحان' ? '🎵' : subj === 'قبطي' ? '📖' : subj === 'طقس' ? '⛪' : ''; }

            // تقسيم التواريخ لصفحات
            const avgSess = activeDates.length
                ? activeDates.reduce((s, d) => s + d.sessions.length, 0) / activeDates.length : 2;
            const DPP = avgSess <= 2 ? 3 : 2;
            const chunks = [];
            for (let i = 0; i < activeDates.length; i += DPP) chunks.push(activeDates.slice(i, i + DPP));
            if (!chunks.length) chunks.push([]);

            let allTablesHtml = '';
            chunks.forEach((chunk, ci) => {
                let hr1 = `<tr><th rowspan="2" style="background:#0d2645;color:#fff;padding:6px 10px;border:1px solid #1a3d6e;font-size:11px;min-width:110px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">المدرس / ة</th>`;
                let hr2 = '<tr>';
                for (const d of chunk) {
                    hr1 += `<th colspan="${d.sessions.length}" style="background:#0d2645;color:#fff;padding:5px 4px;border:1px solid #1a3d6e;font-size:10px;text-align:center;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">${d.label}</th>`;
                    for (const s of d.sessions) {
                        hr2 += `<th style="background:#163358;color:#fff;padding:4px;border:1px solid #1a3d6e;font-size:10px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">${s}</th>`;
                    }
                }
                hr1 += '</tr>'; hr2 += '</tr>';

                let bodyRows = '';
                for (const tname of allTeachers) {
                    let row = `<tr><td style="font-weight:900;font-size:10px;color:#0d2645;background:#fdf8ee;padding:5px 8px;border:1px solid #d4c08a;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">${tname}</td>`;
                    for (const d of chunk) {
                        for (const s of d.sessions) {
                            const asn = (teacherMap[tname] || {})[d.label + '||' + s] || [];
                            if (!asn.length) {
                                row += `<td style="padding:2px;border:1px solid #d4c08a;text-align:center;vertical-align:middle;min-width:85px"><span style="font-size:10px;color:#94a3b8">—</span></td>`;
                            } else {
                                const inner = asn.map(a =>
                                    `<div style="${ps(a.subj)};border-radius:4px;padding:2px 5px;margin-bottom:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                                      <div style="font-size:9px;font-weight:900">${pi(a.subj)} ${a.grade}</div>
                                      <div style="font-size:8px;opacity:.8">${a.subj}</div>
                                    </div>`
                                ).join('');
                                row += `<td style="padding:2px 3px;border:1px solid #d4c08a;vertical-align:top;min-width:85px">${inner}</td>`;
                            }
                        }
                    }
                    row += '</tr>';
                    bodyRows += row;
                }

                const pb = ci < chunks.length - 1 ? 'page-break-after:always' : '';
                allTablesHtml += `<div style="${pb};margin-bottom:16px">
                  <table style="width:100%;border-collapse:collapse;font-size:10px">
                    <thead>${hr1}${hr2}</thead>
                    <tbody>${bodyRows}</tbody>
                  </table>
                </div>`;
            });

            const w = window.open('', '_blank');
            w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"><title>جدول المدرسين التفصيلي</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  @page{size:A4 landscape;margin:10mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Cairo',sans-serif;padding:10px;direction:rtl;background:#fff}
  h1{font-size:16px;color:#0d2645;margin-bottom:4px;text-align:center;font-weight:900}
  p{font-size:10px;color:#555;text-align:center;margin-bottom:14px}
  thead{display:table-header-group}
  tr{page-break-inside:avoid}
  @media print{body{padding:0}*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}}
</style></head><body>
<h1>👨‍🏫 جدول المدرسين التفصيلي — ${termTitle}</h1>
<p>مدرسة البابا شنودة</p>
${allTablesHtml}
<script>window.onload=()=>setTimeout(()=>window.print(),700)<\/script>
</body></html>`);
            w.document.close();
        }

        // =========================================================

        const DEACONS_DB_KEY = 'school_deacons_v1';
        const MASSES_DB_KEY = 'school_masses_v1';
        const DATT_DB_KEY = 'school_datt_v1';
        const SERVICES_DB_KEY = 'school_services_v1';

        // DEACONS_LIST = manually-added deacons (extra deacons not in student list)
        let DEACONS_LIST = [];
        let MASSES_LIST = [];
        let DATT_DATA = {};
        let SERVICES_LIST = [];
        let _editDeaconId = null;

        // ── Merge students with deacon:true + manual DEACONS_LIST ─────────────────
        // Returns unified list with stable id for each deacon
        // Students with deacon:true use their student id (s.id) as deacon id
        // Manual deacons keep their own id (starting with 'D')
        function getDeaconsMerged() {
            const all = [];
            const seenIds = new Set();

            // 1. Pull from DB.students where deacon === true
            (DB.students || []).forEach(s => {
                if (!s.deacon) return;
                seenIds.add(s.id);
                // Check if we have extra rank/notes stored in DEACONS_LIST for this student
                const extra = DEACONS_LIST.find(d => d.id === s.id) || {};
                all.push({
                    id: s.id,
                    name: s.name,
                    rank: extra.rank || 'مرتل',
                    status: extra.status || 'نشط',
                    phone: extra.phone || s.phone || '',
                    father: extra.father || s.father || '',
                    address: extra.address || s.address || '',
                    notes: extra.notes || '',
                    age: extra.age || '',
                    ordinationDate: extra.ordinationDate || '',
                    _fromStudent: true,
                    stage: s.stage || ''
                });
            });

            // 2. Add manual deacons (id starts with 'D') not already in students
            DEACONS_LIST.forEach(d => {
                if (seenIds.has(d.id)) return; // already added via student
                if (!d.id.startsWith('D')) return; // skip student-mirrors stored in list
                all.push({ ...d, _fromStudent: false });
            });

            return all;
        }

        async function loadDeaconsData() {
            try { const r = await storeLoad(DEACONS_DB_KEY); if (r) DEACONS_LIST = JSON.parse(r); } catch (e) { DEACONS_LIST = []; }
            try { const r = await storeLoad(MASSES_DB_KEY); if (r) MASSES_LIST = JSON.parse(r); } catch (e) { MASSES_LIST = []; }
            try { const r = await storeLoad(DATT_DB_KEY); if (r) DATT_DATA = JSON.parse(r); } catch (e) { DATT_DATA = {}; }
            try { const r = await storeLoad(SERVICES_DB_KEY); if (r) SERVICES_LIST = JSON.parse(r); } catch (e) { SERVICES_LIST = []; }
        }
        async function saveDeaconsData() {
            try { await storeSave(DEACONS_DB_KEY, JSON.stringify(DEACONS_LIST)); } catch (e) { }
            try { await storeSave(MASSES_DB_KEY, JSON.stringify(MASSES_LIST)); } catch (e) { }
            try { await storeSave(DATT_DB_KEY, JSON.stringify(DATT_DATA)); } catch (e) { }
            try { await storeSave(SERVICES_DB_KEY, JSON.stringify(SERVICES_LIST)); } catch (e) { }
        }

        function deaconRankColor(rank) {
            return ({ 'إيبوذياكون': 'linear-gradient(135deg,#c9a227,#e8c04a)', 'ذياكون': 'linear-gradient(135deg,#0d5c8a,#1a7abf)', 'قارئ': 'linear-gradient(135deg,#1a5c2a,#237a38)', 'مرتل': 'linear-gradient(135deg,#7b2d8b,#9b59b6)', 'طالب': 'linear-gradient(135deg,#7f8c8d,#95a5a6)' }[rank] || 'linear-gradient(135deg,#0d2645,#1a3d6e)');
        }

        function renderDeacons() {
            const search = (document.getElementById('deacon-search')?.value || '').trim().toLowerCase();
            const rankF = document.getElementById('deacon-filter-rank')?.value || '';
            const statusF = document.getElementById('deacon-filter-status')?.value || '';

            const merged = getDeaconsMerged();
            let list = merged;
            if (search) list = list.filter(d => d.name.toLowerCase().includes(search));
            if (rankF) list = list.filter(d => d.rank === rankF);
            if (statusF) list = list.filter(d => d.status === statusF);

            const badge = document.getElementById('deacons-count-badge');
            if (badge) badge.textContent = merged.length + ' شماس';

            const tbody = document.getElementById('deacons-tbody');
            const empty = document.getElementById('deacons-empty');
            if (!tbody) return;
            if (!list.length) { tbody.innerHTML = ''; if (empty) empty.style.display = ''; return; }
            if (empty) empty.style.display = 'none';

            tbody.innerHTML = list.map((d, i) => `<tr>
    <td>${i + 1}</td>
    <td class="td-name" style="display:flex;align-items:center;gap:8px">
      <div style="width:32px;height:32px;border-radius:50%;background:${deaconRankColor(d.rank)};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;flex-shrink:0">✝</div>
      <div>
        <div>${d.name}</div>
        ${d._fromStudent ? `<div style="font-size:10px;color:#0d5c8a;font-weight:700">📚 ${d.stage || 'طالب'}</div>` : ''}
      </div>
    </td>
    <td>
      <select onchange="updateDeaconRank('${d.id}',this.value)" style="padding:4px 6px;border:1.5px solid var(--border);border-radius:7px;font-family:'Cairo',sans-serif;font-size:11px;font-weight:700;background:#fff">
        ${['إيبوذياكون', 'ذياكون', 'قارئ', 'مرتل', 'طالب'].map(r => `<option value="${r}"${d.rank === r ? ' selected' : ''}>${r}</option>`).join('')}
      </select>
    </td>
    <td>${d.phone || '—'}</td>
    <td>${d.ordinationDate || '—'}</td>
    <td>${d.father || '—'}</td>
    <td>
      <select onchange="updateDeaconStatus('${d.id}',this.value)" style="padding:4px 6px;border:1.5px solid var(--border);border-radius:7px;font-family:'Cairo',sans-serif;font-size:11px;font-weight:700;background:#fff">
        <option value="نشط"${d.status === 'نشط' ? ' selected' : ''}>نشط ✅</option>
        <option value="غير نشط"${d.status === 'غير نشط' ? ' selected' : ''}>غير نشط</option>
      </select>
    </td>
    <td style="font-size:11px;color:var(--muted);max-width:120px;overflow:hidden;text-overflow:ellipsis">${d.notes || ''}</td>
    <td><div style="display:flex;gap:5px;justify-content:center">
      <button class="btn btn-outline btn-sm" onclick="openEditDeaconModal('${d.id}')" title="تعديل">✏️</button>
      ${d._fromStudent ? `<span style="font-size:10px;color:var(--muted);padding:4px 6px;background:rgba(13,92,138,.08);border-radius:6px;font-weight:700" title="من سجل الطلاب">📚</span>`
                    : `<button class="btn btn-danger btn-sm" onclick="deleteDeacon('${d.id}')" title="حذف">🗑️</button>`}
    </div></td>
  </tr>`).join('');
        }

        // ── Quick inline update rank/status (saves to DEACONS_LIST as extra info) ─
        async function updateDeaconRank(id, rank) {
            _upsertDeaconExtra(id, { rank });
            await saveDeaconsData();
            showToast('✅ تم تحديث الرتبة');
        }
        async function updateDeaconStatus(id, status) {
            _upsertDeaconExtra(id, { status });
            await saveDeaconsData();
        }
        // Store/update extra info for a deacon (both student-sourced and manual)
        function _upsertDeaconExtra(id, patch) {
            const idx = DEACONS_LIST.findIndex(d => d.id === id);
            if (idx !== -1) {
                Object.assign(DEACONS_LIST[idx], patch);
            } else {
                // Create an extra record for this student-deacon
                const base = getDeaconsMerged().find(d => d.id === id) || {};
                DEACONS_LIST.push({ ...base, ...patch, id });
            }
        }

        function openAddDeaconModal() {
            _editDeaconId = null;
            document.getElementById('modal-deacon-title').textContent = '➕ إضافة شماس جديد (غير مسجل كطالب)';
            ['d-name', 'd-phone', 'd-father', 'd-address', 'd-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const rank = document.getElementById('d-rank'); if (rank) rank.value = 'مرتل';
            const stat = document.getElementById('d-status'); if (stat) stat.value = 'نشط';
            const age = document.getElementById('d-age'); if (age) age.value = '';
            const ord = document.getElementById('d-ordination-date'); if (ord) ord.value = '';
            document.getElementById('modal-deacon').classList.add('open');
        }

        function openEditDeaconModal(id) {
            const merged = getDeaconsMerged();
            const d = merged.find(x => x.id === id);
            if (!d) return;
            _editDeaconId = id;
            document.getElementById('modal-deacon-title').textContent = '✏️ تعديل بيانات الشماس';
            document.getElementById('d-name').value = d.name || '';
            document.getElementById('d-rank').value = d.rank || 'مرتل';
            document.getElementById('d-status').value = d.status || 'نشط';
            document.getElementById('d-phone').value = d.phone || '';
            document.getElementById('d-father').value = d.father || '';
            document.getElementById('d-address').value = d.address || '';
            document.getElementById('d-notes').value = d.notes || '';
            document.getElementById('d-age').value = d.age || '';
            document.getElementById('d-ordination-date').value = d.ordinationDate || '';
            document.getElementById('modal-deacon').classList.add('open');
        }

        async function saveDeacon() {
            const name = (document.getElementById('d-name')?.value || '').trim();
            if (!name) { showToast('⚠️ أدخل اسم الشماس'); return; }
            const obj = {
                id: _editDeaconId || 'D' + Date.now(),
                name,
                rank: document.getElementById('d-rank')?.value || 'مرتل',
                status: document.getElementById('d-status')?.value || 'نشط',
                phone: (document.getElementById('d-phone')?.value || '').trim(),
                father: (document.getElementById('d-father')?.value || '').trim(),
                address: (document.getElementById('d-address')?.value || '').trim(),
                notes: (document.getElementById('d-notes')?.value || '').trim(),
                age: document.getElementById('d-age')?.value || '',
                ordinationDate: document.getElementById('d-ordination-date')?.value || ''
            };
            if (_editDeaconId) {
                // Upsert in DEACONS_LIST (works for both student-sourced and manual)
                _upsertDeaconExtra(_editDeaconId, obj);
            } else {
                DEACONS_LIST.push(obj);
            }
            await saveDeaconsData();
            closeModal('modal-deacon');
            renderDeacons();
            _populateDeaconSelects();
            showToast(_editDeaconId ? '✅ تم تعديل بيانات الشماس' : '✅ تم إضافة الشماس بنجاح');
        }

        async function deleteDeacon(id) {
            if (!confirm('هل تريد حذف هذا الشماس؟')) return;
            DEACONS_LIST = DEACONS_LIST.filter(d => d.id !== id);
            await saveDeaconsData(); renderDeacons(); _populateDeaconSelects(); showToast('🗑️ تم حذف الشماس');
        }

        function exportDeaconsCSV() {
            const list = getDeaconsMerged();
            if (!list.length) { showToast('⚠️ لا يوجد شمامسة'); return; }
            const headers = ['الاسم', 'الرتبة', 'المرحلة', 'الحالة', 'رقم الهاتف', 'تاريخ الرسامة', 'أب الاعتراف', 'العمر', 'العنوان', 'ملاحظات'];
            const rows = list.map(d => [d.name, d.rank, d.stage || '', d.status, d.phone, d.ordinationDate, d.father, d.age, d.address, d.notes].map(v => `"${(v || '').replace(/"/g, '""')}"`));
            const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'قائمة_الشمامسة.csv'; a.click();
            showToast('✅ تم تصدير قائمة الشمامسة');
        }

        function _populateDeaconSelects() {
            const list = getDeaconsMerged();
            ['att-deacon-filter', 'svc-deacon-filter', 'svc-deacon-sel'].forEach(id => {
                const el = document.getElementById(id); if (!el) return;
                const first = id === 'svc-deacon-sel' ? '<option value="">— اختر الشماس —</option>' : '<option value="">كل الشمامسة</option>';
                el.innerHTML = first + list.map(d => `<option value="${d.id}">${d.name} (${d.rank})</option>`).join('');
            });
        }

        // ── Masses ──────────────────────────────────────────────────────────────────

        function openAddMassModal() {
            ['mass-name', 'mass-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const dt = document.getElementById('mass-date'); if (dt) dt.value = new Date().toISOString().slice(0, 10);
            const tp = document.getElementById('mass-type'); if (tp) tp.value = 'قداس';
            document.getElementById('modal-add-mass').classList.add('open');
        }

        async function saveMass() {
            const name = (document.getElementById('mass-name')?.value || '').trim();
            const date = document.getElementById('mass-date')?.value || '';
            if (!name) { showToast('⚠️ أدخل اسم القداس'); return; }
            if (!date) { showToast('⚠️ أدخل تاريخ القداس'); return; }
            MASSES_LIST.push({ id: 'M' + Date.now(), name, date, type: document.getElementById('mass-type')?.value || 'قداس', notes: (document.getElementById('mass-notes')?.value || '').trim() });
            await saveDeaconsData(); closeModal('modal-add-mass'); _populateMassSel(); showToast('✅ تم إضافة القداس');
        }

        function _populateMassSel() {
            const sel = document.getElementById('att-mass-sel'); if (!sel) return;
            const sorted = [...MASSES_LIST].sort((a, b) => b.date.localeCompare(a.date));
            sel.innerHTML = '<option value="">— اختر قداساً —</option>' + sorted.map(m => `<option value="${m.id}">${m.name} (${m.date})</option>`).join('');
        }

        // ── Attendance ───────────────────────────────────────────────────────────────

        function renderDeaconAttendanceTable() {
            const massId = document.getElementById('att-mass-sel')?.value || '';
            const dFilter = document.getElementById('att-deacon-filter')?.value || '';
            const wrap = document.getElementById('att-table-wrap');
            const titleEl = document.getElementById('att-table-title');
            if (!massId) { if (wrap) wrap.innerHTML = '<div class="empty-state"><span class="icon">📅</span><p>اختر قداساً لعرض جدول الحضور</p></div>'; return; }
            const mass = MASSES_LIST.find(m => m.id === massId);
            if (!mass) { if (wrap) wrap.innerHTML = ''; return; }
            if (titleEl) titleEl.textContent = `📋 حضور: ${mass.name} — ${mass.date}`;
            if (!DATT_DATA[massId]) DATT_DATA[massId] = {};
            const rec = DATT_DATA[massId];
            let deacons = getDeaconsMerged();
            if (dFilter) deacons = deacons.filter(d => d.id === dFilter);
            if (!deacons.length) { if (wrap) wrap.innerHTML = '<div class="empty-state"><span class="icon">🕊️</span><p>لا يوجد شمامسة</p></div>'; return; }
            const statusOpts = ['حاضر', 'غائب', 'متأخر', 'معذور'];
            if (wrap) wrap.innerHTML = `<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:linear-gradient(135deg,#0d2645,#1a3d6e);color:#fff">
        <th style="padding:10px 12px">#</th>
        <th style="padding:10px 12px;text-align:right">اسم الشماس</th>
        <th style="padding:10px 12px">الرتبة</th>
        <th style="padding:10px 12px">الحضور</th>
        <th style="padding:10px 12px">ملاحظة</th>
      </tr></thead>
      <tbody>${deacons.map((d, i) => {
                const cur = rec[d.id]?.status || '';
                const note = rec[d.id]?.note || '';
                return `<tr style="border-bottom:1px solid rgba(212,192,138,.3)">
          <td style="padding:8px 12px;text-align:center">${i + 1}</td>
          <td style="padding:8px 12px;font-weight:700">${d.name}${d._fromStudent && d.stage ? `<br><span style="font-size:10px;color:#0d5c8a;font-weight:700">${d.stage}</span>` : ''}
          </td>
          <td style="padding:8px 12px;text-align:center"><span class="badge" style="background:${deaconRankColor(d.rank)};color:#fff;font-size:10px">${d.rank}</span></td>
          <td style="padding:8px 12px;text-align:center">
            <select id="att-st-${d.id}" style="padding:5px 8px;border:2px solid var(--border);border-radius:8px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;background:#fff">
              <option value="">— اختر —</option>
              ${statusOpts.map(s => `<option value="${s}"${cur === s ? ' selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td style="padding:8px 12px;text-align:center">
            <input type="text" id="att-note-${d.id}" value="${note}" placeholder="ملاحظة..."
              style="padding:4px 8px;border:1.5px solid var(--border);border-radius:7px;font-family:'Cairo',sans-serif;font-size:11px;width:100px">
          </td>
        </tr>`;
            }).join('')}</tbody>
    </table></div>`;
            renderDeaconAttendanceSummary();
        }

        async function saveDeaconAttendance() {
            const massId = document.getElementById('att-mass-sel')?.value || '';
            if (!massId) { showToast('⚠️ اختر قداساً أولاً'); return; }
            if (!DATT_DATA[massId]) DATT_DATA[massId] = {};
            getDeaconsMerged().forEach(d => {
                const stEl = document.getElementById(`att-st-${d.id}`);
                const noteEl = document.getElementById(`att-note-${d.id}`);
                if (stEl) DATT_DATA[massId][d.id] = { status: stEl.value, note: noteEl?.value || '' };
            });
            await saveDeaconsData(); renderDeaconAttendanceSummary(); showToast('✅ تم حفظ الحضور');
        }

        function renderDeaconAttendanceSummary() {
            const wrap = document.getElementById('att-summary-wrap'); if (!wrap) return;
            const merged = getDeaconsMerged();
            if (!merged.length) { wrap.innerHTML = '<div class="empty-state"><span class="icon">🕊️</span><p>لا يوجد شمامسة مسجلون</p></div>'; return; }
            const stats = merged.map(d => {
                let present = 0, absent = 0, late = 0, excused = 0, total = 0;
                Object.values(DATT_DATA).forEach(rec => {
                    const s = rec[d.id]?.status; if (!s) return; total++;
                    if (s === 'حاضر') present++; else if (s === 'غائب') absent++; else if (s === 'متأخر') late++; else if (s === 'معذور') excused++;
                });
                const pct = total > 0 ? Math.round(present / total * 100) : null;
                return { ...d, present, absent, late, excused, total, pct };
            }).sort((a, b) => (b.pct || 0) - (a.pct || 0));
            wrap.innerHTML = `<div style="margin-bottom:10px;font-size:12px;color:var(--muted);font-weight:700">إجمالي القداسات المسجلة: ${MASSES_LIST.length}</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:linear-gradient(135deg,#0d2645,#1a3d6e);color:#fff">
        <th style="padding:10px 12px">#</th>
        <th style="padding:10px 12px;text-align:right">الشماس</th>
        <th style="padding:10px 12px">الرتبة</th>
        <th style="padding:10px 12px">✅ حاضر</th>
        <th style="padding:10px 12px">❌ غائب</th>
        <th style="padding:10px 12px">⏰ متأخر</th>
        <th style="padding:10px 12px">🟡 معذور</th>
        <th style="padding:10px 12px">نسبة الحضور</th>
      </tr></thead>
      <tbody>${stats.map((d, i) => `
        <tr style="border-bottom:1px solid rgba(212,192,138,.3);${i % 2 ? 'background:rgba(244,239,228,.3)' : ''}">
          <td style="padding:8px 12px;text-align:center">${i + 1}</td>
          <td style="padding:8px 12px;font-weight:700">${d.name}${d._fromStudent && d.stage ? `<br><span style="font-size:10px;color:#0d5c8a">${d.stage}</span>` : ''}</td>
          <td style="padding:8px 12px;text-align:center"><span class="badge" style="background:${deaconRankColor(d.rank)};color:#fff;font-size:10px">${d.rank}</span></td>
          <td style="padding:8px 12px;text-align:center;font-weight:900;color:#155724">${d.present}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:900;color:#721c24">${d.absent}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:900;color:#856404">${d.late}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:900;color:#0c5460">${d.excused}</td>
          <td style="padding:8px 12px;text-align:center">${d.pct !== null ? `<span class="badge ${d.pct >= 75 ? 'b-success' : d.pct >= 50 ? 'b-warn' : 'b-danger'}">${d.pct}%</span>` : '<span style="color:var(--muted);font-size:11px">لا بيانات</span>'}</td>
        </tr>`).join('')}
      </tbody></table></div>`;
        }

        function printDeaconsAttendance() {
            const summary = document.getElementById('att-summary-wrap');
            if (!summary) { showToast('⚠️ لا توجد بيانات'); return; }
            const w = window.open('', '_blank');
            w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملخص حضور الشمامسة</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl}
    h1{font-size:18px;color:#0d2645;text-align:center;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#0d2645;color:#fff;padding:8px;text-align:center}td{padding:6px 8px;border:1px solid #d4c08a;text-align:center}
    tr:nth-child(even){background:#fdf8ee}@media print{body{padding:8px}}</style></head><body>
    <h1>📅 ملخص حضور الشمامسة — مدرسة البابا شنودة</h1>${summary.innerHTML}
    <script>window.onload=()=>window.print()<\/script></body></html>`);
            w.document.close();
        }

        // ── Services ─────────────────────────────────────────────────────────────────

        function openAddServiceModal() {
            _populateDeaconSelects();
            ['svc-occasion', 'svc-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const dt = document.getElementById('svc-date'); if (dt) dt.value = new Date().toISOString().slice(0, 10);
            const tp = document.getElementById('svc-type-sel'); if (tp) tp.value = 'قداس';
            document.getElementById('modal-add-service').classList.add('open');
        }

        async function saveService() {
            const deaconId = document.getElementById('svc-deacon-sel')?.value || '';
            const type = document.getElementById('svc-type-sel')?.value || '';
            const date = document.getElementById('svc-date')?.value || '';
            if (!deaconId) { showToast('⚠️ اختر الشماس'); return; }
            if (!date) { showToast('⚠️ أدخل التاريخ'); return; }
            const deacon = getDeaconsMerged().find(d => d.id === deaconId);
            SERVICES_LIST.push({
                id: 'S' + Date.now(), deaconId, deaconName: deacon?.name || '', type, date,
                occasion: (document.getElementById('svc-occasion')?.value || '').trim(),
                notes: (document.getElementById('svc-notes')?.value || '').trim()
            });
            await saveDeaconsData(); closeModal('modal-add-service'); renderServicesTable(); showToast('✅ تم إضافة الخدمة');
        }

        async function deleteService(id) {
            if (!confirm('حذف هذه الخدمة؟')) return;
            SERVICES_LIST = SERVICES_LIST.filter(s => s.id !== id);
            await saveDeaconsData(); renderServicesTable(); showToast('🗑️ تم الحذف');
        }

        function renderServicesTable() {
            const dFilter = document.getElementById('svc-deacon-filter')?.value || '';
            const typeFilter = document.getElementById('svc-type-filter')?.value || '';
            const wrap = document.getElementById('services-table-wrap'); if (!wrap) return;
            let list = [...SERVICES_LIST].sort((a, b) => b.date.localeCompare(a.date));
            if (dFilter) list = list.filter(s => s.deaconId === dFilter);
            if (typeFilter) list = list.filter(s => s.type === typeFilter);
            if (!list.length) { wrap.innerHTML = '<div class="empty-state"><span class="icon">🗓️</span><p>لا توجد خدمات مسجلة</p></div>'; return; }
            const tc = { 'قداس': 'linear-gradient(135deg,#c9a227,#e8c04a)', 'إنجيل': 'linear-gradient(135deg,#0d5c8a,#1a7abf)', 'بخور': 'linear-gradient(135deg,#7b2d8b,#9b59b6)', 'تناول': 'linear-gradient(135deg,#1a5c2a,#237a38)', 'رسامة': 'linear-gradient(135deg,#c0392b,#e74c3c)', 'أجبية': 'linear-gradient(135deg,#16a085,#1abc9c)', 'عماد': 'linear-gradient(135deg,#2980b9,#3498db)', 'أخرى': 'linear-gradient(135deg,#7f8c8d,#95a5a6)' };
            wrap.innerHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:linear-gradient(135deg,#0d2645,#1a3d6e);color:#fff">
      <th style="padding:10px 12px">#</th>
      <th style="padding:10px 12px;text-align:right">اسم الشماس</th>
      <th style="padding:10px 12px">نوع الخدمة</th>
      <th style="padding:10px 12px">التاريخ</th>
      <th style="padding:10px 12px">المناسبة</th>
      <th style="padding:10px 12px">ملاحظات</th>
      <th style="padding:10px 12px">إجراء</th>
    </tr></thead>
    <tbody>${list.map((s, i) => `
      <tr style="border-bottom:1px solid rgba(212,192,138,.3);${i % 2 ? 'background:rgba(244,239,228,.3)' : ''}">
        <td style="padding:8px 12px;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;font-weight:700">${s.deaconName}</td>
        <td style="padding:8px 12px;text-align:center"><span class="badge" style="background:${tc[s.type] || tc['أخرى']};color:#fff;font-size:10px">${s.type}</span></td>
        <td style="padding:8px 12px;text-align:center">${s.date}</td>
        <td style="padding:8px 12px;text-align:center">${s.occasion || '—'}</td>
        <td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--muted)">${s.notes || ''}</td>
        <td style="padding:8px 12px;text-align:center"><button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">🗑️</button></td>
      </tr>`).join('')}
    </tbody></table></div>
    <div style="margin-top:12px;padding:10px 14px;background:var(--bg);border-radius:10px;border:1px solid var(--border);font-size:12px;font-weight:700;color:var(--navy)">إجمالي الخدمات: ${list.length}</div>`;
        }

        function printDeaconsServices() {
            const wrap = document.getElementById('services-table-wrap');
            if (!wrap) { showToast('⚠️ لا توجد بيانات'); return; }
            const w = window.open('', '_blank');
            w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>جدول توزيع الخدمات</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl}
    h1{font-size:18px;color:#0d2645;text-align:center;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#0d2645;color:#fff;padding:8px;text-align:center}td{padding:6px 8px;border:1px solid #d4c08a;text-align:center}
    tr:nth-child(even){background:#fdf8ee}button{display:none!important}@media print{body{padding:8px}}</style></head><body>
    <h1>🗓️ جدول توزيع الخدمات — مدرسة البابا شنودة</h1>${wrap.innerHTML}
    <script>window.onload=()=>window.print()<\/script></body></html>`);
            w.document.close();
        }

        // ══ جدول أسماء المدرسين القابل للتخصيص ══════════════════════════════

        const ASSIGN_SCHED_KEY = 'mbs_assign_schedule_v1';

        const ASSIGN_DEFAULT_DATA = {
            termName: 'الترم الثاني',
            termRange: '23 – 1 – 2026  ←  27 – 3 – 2026',
            rows: [
                {id:'as1',  stage:'حضانه',   subject:'الحان', teachers:'ميرنا مجدي',                    sessions:'١٠'},
                {id:'as2',  stage:'حضانه',   subject:'قبطي',  teachers:'مريم سامي + انجلينا عادل',      sessions:'٦'},
                {id:'as3',  stage:'حضانه',   subject:'طقس',   teachers:'دميانه ناصر',                   sessions:'٥'},
                {id:'as4',  stage:'اولى ب',  subject:'الحان', teachers:'استر ابراهيم',                  sessions:'١٠'},
                {id:'as5',  stage:'اولى ب',  subject:'قبطي',  teachers:'ماجده كرم',                     sessions:'٦'},
                {id:'as6',  stage:'اولى ب',  subject:'طقس',   teachers:'مارينا صبري',                   sessions:'٥'},
                {id:'as7',  stage:'تانيه ب', subject:'الحان', teachers:'ساره ايمن + كيرلس مرزوق',       sessions:'١٠'},
                {id:'as8',  stage:'تانيه ب', subject:'قبطي',  teachers:'مارينا ظريف + كرستينا شنوده',   sessions:'٦'},
                {id:'as9',  stage:'تانيه ب', subject:'طقس',   teachers:'مريم عطا',                      sessions:'٥'},
                {id:'as10', stage:'تالته ب', subject:'الحان', teachers:'كيرلس مجدي',                    sessions:'١٠'},
                {id:'as11', stage:'تالته ب', subject:'قبطي',  teachers:'مارينا ظريف + كرستينا شنوده',   sessions:'٦'},
                {id:'as12', stage:'تالته ب', subject:'طقس',   teachers:'مادونا مجدي',                   sessions:'٥'},
                {id:'as13', stage:'رابعه ب', subject:'الحان', teachers:'جرجس عماد',                     sessions:'١٠'},
                {id:'as14', stage:'رابعه ب', subject:'قبطي',  teachers:'ديانا عزيز + تهاني عادل',       sessions:'٦'},
                {id:'as15', stage:'رابعه ب', subject:'طقس',   teachers:'نوره نصحي',                     sessions:'٥'},
                {id:'as16', stage:'خامسه',   subject:'الحان', teachers:'فريده ظريف',                    sessions:'١٠'},
                {id:'as17', stage:'خامسه',   subject:'قبطي',  teachers:'مارينا ابراهيم + هايدي صبري',   sessions:'٦'},
                {id:'as18', stage:'خامسه',   subject:'طقس',   teachers:'ماري حنا',                      sessions:'٥'},
                {id:'as19', stage:'ساته',    subject:'الحان', teachers:'بيشوي القمص + تادرس لطيف',      sessions:'١٠'},
                {id:'as20', stage:'ساته',    subject:'قبطي',  teachers:'توتا ادور + رويس لطيف',         sessions:'٦'},
                {id:'as21', stage:'ساته',    subject:'طقس',   teachers:'موسى يعقوب',                    sessions:'٥'},
                {id:'as22', stage:'اولى ع',  subject:'الحان', teachers:'ابانوب قدوس',                   sessions:'١٠'},
                {id:'as23', stage:'اولى ع',  subject:'قبطي',  teachers:'توتا ادور + رويس لطيف',         sessions:'١٠'},
                {id:'as24', stage:'تانيه ع', subject:'الحان', teachers:'ابانوب قدوس',                   sessions:'١٠'},
                {id:'as25', stage:'تانيه ع', subject:'قبطي',  teachers:'ماري عياد',                     sessions:'١٠'},
                {id:'as26', stage:'تالته ع', subject:'الحان', teachers:'ابانوب قدوس',                   sessions:'١٠'},
                {id:'as27', stage:'تالته ع', subject:'قبطي',  teachers:'ماري عياد',                     sessions:'١٠'},
                {id:'as28', stage:'اولى ث',  subject:'الحان', teachers:'ابانوب قدوس',                   sessions:'١٠'},
                {id:'as29', stage:'تانيه ث', subject:'الحان', teachers:'ابانوب قدوس',                   sessions:'١٠'}
            ]
        };

        let _assignSchedData = null;
        let _assignEditMode  = false;
        let _assignEditRows  = [];

        function _loadAssignSched() {
            if (_assignSchedData) return _assignSchedData;
            try {
                const s = localStorage.getItem(ASSIGN_SCHED_KEY);
                _assignSchedData = s ? JSON.parse(s) : JSON.parse(JSON.stringify(ASSIGN_DEFAULT_DATA));
            } catch(e) {
                _assignSchedData = JSON.parse(JSON.stringify(ASSIGN_DEFAULT_DATA));
            }
            return _assignSchedData;
        }

        function _saveAssignSched() {
            localStorage.setItem(ASSIGN_SCHED_KEY, JSON.stringify(_assignSchedData));
        }

        function _subjBadgeCls(s) {
            return s==='الحان'?'alhaan':s==='قبطي'?'qibti':s==='طقس'?'toqs':'other';
        }
        function _subjIco(s) {
            return s==='الحان'?'🎵':s==='قبطي'?'📖':s==='طقس'?'⛪':'';
        }

        function _buildAssignViewHTML(data) {
            // Group consecutive rows by stage
            const groups = [];
            let lastStage = null;
            (data.rows || []).forEach(r => {
                if (r.stage !== lastStage) { groups.push({stage:r.stage, rows:[]}); lastStage=r.stage; }
                groups[groups.length-1].rows.push(r);
            });

            let tBody = '';
            let rowIdx = 0;
            groups.forEach(g => {
                g.rows.forEach((row, i) => {
                    const stripe = rowIdx%2===1 ? 'background:rgba(244,239,228,.45)' : '';
                    rowIdx++;
                    tBody += `<tr>`;
                    if (i===0) {
                        tBody += `<td class="stage-cell" rowspan="${g.rows.length}">${g.stage}</td>`;
                    }
                    const bc = _subjBadgeCls(row.subject);
                    const ic = _subjIco(row.subject);
                    tBody += `<td style="padding:10px 16px;${stripe}">
                        <span class="assign-badge ${bc}">${ic} ${row.subject}</span>
                        <span style="margin:0 10px;color:var(--gold-dark);font-weight:900;font-size:16px">←</span>
                        <span style="font-weight:700;font-size:13px">${row.teachers}</span>
                    </td>`;
                    tBody += `<td class="sessions-cell" style="${stripe}">${row.sessions} حصة</td>`;
                    tBody += `</tr>`;
                });
            });

            return `<table class="assign-tbl">
                <thead><tr>
                    <th style="min-width:90px">المرحلة</th>
                    <th>المواد بأسماء المدرسين</th>
                    <th style="min-width:90px">عدد الحصص</th>
                </tr></thead>
                <tbody>${tBody}</tbody>
            </table>`;
        }

        function _buildAssignEditHTML(rows) {
            const SUBJS = ['الحان','قبطي','طقس','أخرى'];
            // Collect stage names for datalist
            const allStages = [...new Set(rows.map(r=>r.stage).filter(Boolean))];
            const stageOpts = allStages.map(s=>`<option value="${s}">`).join('');

            let tbody = '';
            rows.forEach((row, idx) => {
                const subjOpts = SUBJS.map(s=>`<option value="${s}"${s===row.subject?' selected':''}>${s}</option>`).join('');
                tbody += `<tr class="assign-edit-row" id="aer-${row.id}">
                    <td style="min-width:110px">
                        <input type="text" list="as-stages-dl" id="aef-stage-${row.id}" value="${row.stage}" placeholder="المرحلة">
                    </td>
                    <td style="min-width:90px">
                        <select id="aef-subj-${row.id}">${subjOpts}</select>
                    </td>
                    <td style="min-width:210px">
                        <input type="text" id="aef-teachers-${row.id}" value="${row.teachers}" placeholder="أسماء المدرسين — افصل بـ +">
                    </td>
                    <td style="min-width:80px">
                        <input type="text" id="aef-sessions-${row.id}" value="${row.sessions}" placeholder="عدد">
                    </td>
                    <td style="min-width:100px">
                        <div class="assign-row-action">
                            <button onclick="_assignMove('${row.id}',-1)" title="أعلى" style="background:var(--bg);color:var(--navy)">▲</button>
                            <button onclick="_assignMove('${row.id}',1)"  title="أسفل" style="background:var(--bg);color:var(--navy)">▼</button>
                            <button onclick="_assignDel('${row.id}')" title="حذف" style="background:#fee2e2;color:#c0392b">🗑️</button>
                        </div>
                    </td>
                </tr>`;
            });

            return `<datalist id="as-stages-dl">${stageOpts}</datalist>
                <table class="assign-tbl" style="font-size:12px">
                    <thead><tr>
                        <th>المرحلة</th><th>المادة</th><th>أسماء المدرسين</th><th>عدد الحصص</th><th>إجراءات</th>
                    </tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
                <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--border)">
                    <button class="btn btn-outline btn-sm" onclick="_assignAddRow()">➕ إضافة صف جديد</button>
                    <div style="margin-right:auto;display:flex;gap:8px">
                        <button class="btn btn-gold" onclick="_saveAssignEdits()">💾 حفظ التغييرات</button>
                        <button class="btn btn-outline" onclick="_cancelAssignEdit()">✖ إلغاء</button>
                    </div>
                </div>`;
        }

        function renderAssignSchedule() {
            const data = _loadAssignSched();
            // Term display
            const td = document.getElementById('assign-term-display');
            if (td) td.textContent = `📅  ${data.termName}  —  ${data.termRange}`;
            // View table
            const vw = document.getElementById('assign-sched-view');
            if (vw) vw.innerHTML = _buildAssignViewHTML(data);
        }

        function toggleAssignTermEdit() {
            const data = _loadAssignSched();
            const el = document.getElementById('assign-term-edit');
            if (!el) return;
            const showing = el.style.display !== 'none';
            el.style.display = showing ? 'none' : 'block';
            if (!showing) {
                const ni = document.getElementById('assign-term-name-input');
                const ri = document.getElementById('assign-term-range-input');
                if (ni) ni.value = data.termName;
                if (ri) ri.value = data.termRange;
            }
        }

        function saveAssignTermInfo() {
            const data = _loadAssignSched();
            const n = document.getElementById('assign-term-name-input')?.value.trim();
            const r = document.getElementById('assign-term-range-input')?.value.trim();
            if (n) data.termName = n;
            if (r) data.termRange = r;
            _saveAssignSched();
            toggleAssignTermEdit();
            renderAssignSchedule();
            showToast('✅ تم حفظ بيانات الترم');
        }

        function toggleAssignMode() {
            const data = _loadAssignSched();
            const vw  = document.getElementById('assign-sched-view');
            const ed  = document.getElementById('assign-sched-edit');
            const btn = document.getElementById('assign-toggle-btn');
            if (!vw || !ed) return;
            _assignEditMode = !_assignEditMode;
            if (_assignEditMode) {
                _assignEditRows = JSON.parse(JSON.stringify(data.rows));
                vw.style.display  = 'none';
                ed.style.display  = 'block';
                ed.innerHTML      = _buildAssignEditHTML(_assignEditRows);
                if (btn) btn.textContent = '👁️ عرض الجدول';
            } else {
                vw.style.display = 'block';
                ed.style.display = 'none';
                renderAssignSchedule();
                if (btn) btn.textContent = '✏️ تعديل الجدول';
            }
        }

        function _assignReadForm() {
            return _assignEditRows.map(r => ({
                id: r.id,
                stage:    document.getElementById('aef-stage-'    + r.id)?.value.trim() || r.stage,
                subject:  document.getElementById('aef-subj-'     + r.id)?.value        || r.subject,
                teachers: document.getElementById('aef-teachers-' + r.id)?.value.trim() || r.teachers,
                sessions: document.getElementById('aef-sessions-' + r.id)?.value.trim() || r.sessions
            }));
        }

        function _assignMove(id, dir) {
            _assignEditRows = _assignReadForm();
            const i = _assignEditRows.findIndex(r => r.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= _assignEditRows.length) return;
            [_assignEditRows[i], _assignEditRows[j]] = [_assignEditRows[j], _assignEditRows[i]];
            const ed = document.getElementById('assign-sched-edit');
            if (ed) ed.innerHTML = _buildAssignEditHTML(_assignEditRows);
        }

        function _assignDel(id) {
            if (!confirm('حذف هذا الصف؟')) return;
            _assignEditRows = _assignReadForm();
            _assignEditRows = _assignEditRows.filter(r => r.id !== id);
            const ed = document.getElementById('assign-sched-edit');
            if (ed) ed.innerHTML = _buildAssignEditHTML(_assignEditRows);
        }

        function _assignAddRow() {
            _assignEditRows = _assignReadForm();
            const lastStage = _assignEditRows.length ? _assignEditRows[_assignEditRows.length-1].stage : '';
            _assignEditRows.push({ id:'as'+Date.now(), stage:lastStage, subject:'الحان', teachers:'', sessions:'١٠' });
            const ed = document.getElementById('assign-sched-edit');
            if (ed) { ed.innerHTML = _buildAssignEditHTML(_assignEditRows); ed.scrollTop = ed.scrollHeight; }
        }

        function _saveAssignEdits() {
            const data  = _loadAssignSched();
            data.rows   = _assignReadForm();
            _saveAssignSched();
            _assignEditMode = false;
            const vw  = document.getElementById('assign-sched-view');
            const ed  = document.getElementById('assign-sched-edit');
            const btn = document.getElementById('assign-toggle-btn');
            if (vw)  vw.style.display = 'block';
            if (ed)  ed.style.display = 'none';
            if (btn) btn.textContent  = '✏️ تعديل الجدول';
            renderAssignSchedule();
            showToast('✅ تم حفظ جدول المدرسين');
        }

        function _cancelAssignEdit() {
            _assignEditMode = false;
            const vw  = document.getElementById('assign-sched-view');
            const ed  = document.getElementById('assign-sched-edit');
            const btn = document.getElementById('assign-toggle-btn');
            if (vw)  vw.style.display = 'block';
            if (ed)  ed.style.display = 'none';
            if (btn) btn.textContent  = '✏️ تعديل الجدول';
        }

        function printAssignSchedule() {
            const data = _loadAssignSched();
            // build print-safe version of the grouped table
            const groups = [];
            let lastStage = null;
            (data.rows||[]).forEach(r => {
                if (r.stage !== lastStage) { groups.push({stage:r.stage, rows:[]}); lastStage=r.stage; }
                groups[groups.length-1].rows.push(r);
            });
            const subj2bg = {الحان:'#dbeafe',قبطي:'#dcfce7',طقس:'#ede9fe'};
            const subj2fg = {الحان:'#1e40af',قبطي:'#166534',طقس:'#5b21b6'};
            const subj2bd = {الحان:'#93c5fd',قبطي:'#86efac',طقس:'#c4b5fd'};
            let tbody = ''; let ri=0;
            groups.forEach(g => {
                g.rows.forEach((row,i) => {
                    const stripe = ri%2===1?'background:#fdf8ee;':'background:#fff;';
                    ri++;
                    tbody += `<tr>`;
                    if (i===0) tbody += `<td rowspan="${g.rows.length}" style="background:#0d2645;color:#fff;font-weight:900;font-size:13px;text-align:center;vertical-align:middle;padding:10px 12px;border:1px solid #163358;-webkit-print-color-adjust:exact;print-color-adjust:exact">${g.stage}</td>`;
                    const bg=subj2bg[row.subject]||'#f1f5f9', fg=subj2fg[row.subject]||'#475569', bd=subj2bd[row.subject]||'#cbd5e1';
                    tbody += `<td style="${stripe}padding:9px 14px;border:1px solid #d4c08a;vertical-align:middle;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <span style="background:${bg};color:${fg};border:1px solid ${bd};border-radius:8px;padding:2px 9px;font-size:11px;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact">${_subjIco(row.subject)} ${row.subject}</span>
                        <span style="margin:0 10px;color:#9a7a1a;font-weight:900;font-size:15px">←</span>
                        <span style="font-weight:700;font-size:12px">${row.teachers}</span>
                    </td>`;
                    tbody += `<td style="${stripe}text-align:center;font-weight:800;font-size:13px;color:#0d2645;padding:9px;border:1px solid #d4c08a;-webkit-print-color-adjust:exact;print-color-adjust:exact">${row.sessions} حصة</td>`;
                    tbody += `</tr>`;
                });
            });
            const w = window.open('','_blank');
            w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>جدول أسماء المدرسين</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Cairo',sans-serif;padding:22px;direction:rtl;background:#fff}
h1{font-size:17px;color:#0d2645;text-align:center;margin-bottom:4px;font-weight:900}
.sub{font-size:12px;color:#666;text-align:center;margin-bottom:18px}
table{width:100%;border-collapse:collapse}
thead th{background:#0d2645;color:#fff;padding:10px 14px;font-size:11px;text-align:center;border:1px solid #1a3d6e;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media print{body{padding:10px}}</style></head><body>
<h1>📋 جدول الحصص وأسماء المدرسين — مدرسة البابا شنودة</h1>
<div class="sub">${data.termName}  —  ${data.termRange}</div>
<table>
  <thead><tr><th style="min-width:80px">المرحلة</th><th>المواد بأسماء المدرسين</th><th style="min-width:80px">عدد الحصص</th></tr></thead>
  <tbody>${tbody}</tbody>
</table>
<script>window.onload=()=>window.print()<\/script></body></html>`);
            w.document.close();
        }

        function exportAssignScheduleExcel() {
            const data = _loadAssignSched();
            if (!window.XLSX) { showToast('⚠️ مكتبة Excel غير محملة'); return; }
            const wsData = [
                [`جدول الحصص وأسماء المدرسين — ${data.termName}  ${data.termRange}`],
                [],
                ['المرحلة','المادة','أسماء المدرسين','عدد الحصص'],
                ...(data.rows||[]).map(r=>[r.stage, r.subject, r.teachers, r.sessions])
            ];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = [{wch:12},{wch:10},{wch:45},{wch:12}];
            ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:3}}];
            XLSX.utils.book_append_sheet(wb, ws, 'جدول المدرسين');
            XLSX.writeFile(wb, `جدول_المدرسين_${data.termName}.xlsx`);
            showToast('✅ تم تصدير Excel');
        }

        function resetAssignSchedule() {
            if (!confirm('⚠️ إعادة تعيين الجدول للبيانات الافتراضية؟\nسيتم فقدان كل التعديلات!')) return;
            _assignSchedData = JSON.parse(JSON.stringify(ASSIGN_DEFAULT_DATA));
            _saveAssignSched();
            _assignEditMode = false;
            const vw  = document.getElementById('assign-sched-view');
            const ed  = document.getElementById('assign-sched-edit');
            const btn = document.getElementById('assign-toggle-btn');
            if (vw)  vw.style.display = 'block';
            if (ed)  ed.style.display = 'none';
            if (btn) btn.textContent  = '✏️ تعديل الجدول';
            renderAssignSchedule();
            showToast('🔄 تمت إعادة التعيين للبيانات الافتراضية');
        }

        // ── Hook navigate ─────────────────────────────────────────────────────────────
        const _origNav = navigate;
        navigate = function (page) {
            _origNav(page);
            if (page === 'teacher-schedule') renderTeacherSchedule();
            if (page === 'assign-schedule')  renderAssignSchedule();
            if (page === 'deacons') loadDeaconsData().then(() => { renderDeacons(); _populateDeaconSelects(); });
            if (page === 'deacons-attendance') loadDeaconsData().then(() => { _populateMassSel(); _populateDeaconSelects(); renderDeaconAttendanceSummary(); });
            if (page === 'deacons-services') loadDeaconsData().then(() => { _populateDeaconSelects(); renderServicesTable(); });
            if (page === 'new-year-report') renderNewYearReport();
        };

        // =========================================================
        // ══════════════════════════════════════════════════════
        // تقرير بدء العام الدراسي الجديد
        // ══════════════════════════════════════════════════════
        function renderNewYearReport() {
            const year = DB.schoolYear || '—';
            const sub = document.getElementById('nyr-subtitle');
            if (sub) sub.textContent = 'العام الدراسي: ' + year;

            const total  = DB.students.length;
            const male   = DB.students.filter(s => s.gender === 'ذكر').length;
            const female = DB.students.filter(s => s.gender === 'أنثى').length;
            const activeStages = STAGES.filter(st => DB.students.some(s => s.stage === st));
            const teachers = DB.registeredTeachers || [];

            // حالات الطلاب
            const statusMap = {};
            DB.students.forEach(s => {
                const st = s.status || 'غير محدد';
                statusMap[st] = (statusMap[st] || 0) + 1;
            });
            const statusColors = {
                'ناجح ومنتقل': { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
                'منتقل':        { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
                'راسب':         { bg: '#fff5f5', color: '#991b1b', border: '#fca5a5' },
                'جديد':         { bg: '#f5f3ff', color: '#5b21b6', border: '#c4b5fd' },
                'خريج':         { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
                'غير محدد':    { bg: '#f9fafb', color: '#374151', border: '#d1d5db' }
            };

            const statusCards = Object.entries(statusMap).map(([k, v]) => {
                const c = statusColors[k] || statusColors['غير محدد'];
                return `<div style="text-align:center;background:${c.bg};border:2px solid ${c.border};border-radius:12px;padding:14px 10px">
                    <div style="font-size:26px;font-weight:900;color:${c.color}">${v}</div>
                    <div style="font-size:11.5px;color:#6b7280;margin-top:3px">${k}</div>
                </div>`;
            }).join('');

            // صفوف جدول المراحل
            let stageRows = '';
            activeStages.forEach((stage, i) => {
                const ss = DB.students.filter(s => s.stage === stage);
                const m = ss.filter(s => s.gender === 'ذكر').length;
                const f = ss.filter(s => s.gender === 'أنثى').length;
                const subjs = (DB.subjects[stage] || []).map(s => (typeof s === 'object' ? s.name : s)).filter(Boolean).join(' · ') || '—';
                const stTeachers = teachers.filter(t => (t.stages || []).includes(stage));
                const teacherTags = stTeachers.length
                    ? stTeachers.map(t => `<span class="badge b-info" style="font-size:10px;margin:2px">${t.name}</span>`).join('')
                    : '<span style="color:#9ca3af;font-size:11px">—</span>';
                const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
                stageRows += `<tr style="background:${rowBg}">
                    <td style="font-weight:700">${stage}</td>
                    <td style="text-align:center;font-weight:900;color:var(--navy)">${ss.length}</td>
                    <td style="text-align:center;color:#1e40af">${m}</td>
                    <td style="text-align:center;color:#9d174d">${f}</td>
                    <td style="font-size:11px;color:#374151">${subjs}</td>
                    <td>${teacherTags}</td>
                </tr>`;
            });

            // جدول المدرسين
            let teacherRows = '';
            if (teachers.length) {
                teachers.forEach(t => {
                    const stages = (t.stages || []).filter(s => STAGES.includes(s));
                    const subjs  = (t.subjects || []).join(' · ') || '—';
                    teacherRows += `<tr>
                        <td style="font-weight:700">${t.name}</td>
                        <td>${stages.map(s => `<span class="badge b-info" style="font-size:10px;margin:2px">${s}</span>`).join('') || '—'}</td>
                        <td style="font-size:11px">${subjs}</td>
                        <td style="text-align:center">${t.registeredAt || '—'}</td>
                    </tr>`;
                });
            }

            const html = `
            <!-- إحصاءات عامة -->
            <div class="card" style="margin-bottom:16px">
                <div class="card-title">📊 إحصاءات عامة — ${year}</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-top:12px">
                    <div style="text-align:center;background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:16px 10px">
                        <div style="font-size:32px;font-weight:900;color:#1e40af">${total}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:3px">إجمالي الطلاب</div>
                    </div>
                    <div style="text-align:center;background:#ecfdf5;border:2px solid #6ee7b7;border-radius:12px;padding:16px 10px">
                        <div style="font-size:32px;font-weight:900;color:#065f46">${male}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:3px">ذكور</div>
                    </div>
                    <div style="text-align:center;background:#fdf2f8;border:2px solid #f9a8d4;border-radius:12px;padding:16px 10px">
                        <div style="font-size:32px;font-weight:900;color:#9d174d">${female}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:3px">إناث</div>
                    </div>
                    <div style="text-align:center;background:#fff7ed;border:2px solid #fdba74;border-radius:12px;padding:16px 10px">
                        <div style="font-size:32px;font-weight:900;color:#c2410c">${activeStages.length}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:3px">مرحلة نشطة</div>
                    </div>
                    <div style="text-align:center;background:#f5f3ff;border:2px solid #c4b5fd;border-radius:12px;padding:16px 10px">
                        <div style="font-size:32px;font-weight:900;color:#5b21b6">${teachers.length}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:3px">مدرس مسجل</div>
                    </div>
                </div>
            </div>

            <!-- حالات الطلاب -->
            ${Object.keys(statusMap).length ? `
            <div class="card" style="margin-bottom:16px">
                <div class="card-title">🏷️ حالات الطلاب</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-top:12px">
                    ${statusCards}
                </div>
            </div>` : ''}

            <!-- توزيع حسب المرحلة -->
            <div class="card" style="margin-bottom:16px">
                <div class="card-title">📋 توزيع الطلاب حسب المرحلة</div>
                <div class="tw" style="margin-top:10px">
                    <table>
                        <thead>
                            <tr>
                                <th>المرحلة</th>
                                <th>الإجمالي</th>
                                <th>ذكور</th>
                                <th>إناث</th>
                                <th>المواد</th>
                                <th>المدرسون</th>
                            </tr>
                        </thead>
                        <tbody>${stageRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:24px">لا يوجد طلاب مسجلون بعد</td></tr>'}</tbody>
                    </table>
                </div>
            </div>

            <!-- المدرسون -->
            ${teachers.length ? `
            <div class="card">
                <div class="card-title">👨‍🏫 المدرسون المسجلون (${teachers.length})</div>
                <div class="tw" style="margin-top:10px">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>المراحل</th>
                                <th>المواد</th>
                                <th>تاريخ التسجيل</th>
                            </tr>
                        </thead>
                        <tbody>${teacherRows}</tbody>
                    </table>
                </div>
            </div>` : `
            <div class="card">
                <div class="empty-state" style="padding:30px">
                    <span class="icon">👨‍🏫</span>
                    <p>لا يوجد مدرسون مسجلون بعد</p>
                </div>
            </div>`}`;

            const el = document.getElementById('nyr-content');
            if (el) el.innerHTML = html;
        }

        async function printNewYearReport() {
            const year = DB.schoolYear || '—';
            const now  = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
            const total   = DB.students.length;
            const male    = DB.students.filter(s => s.gender === 'ذكر').length;
            const female  = DB.students.filter(s => s.gender === 'أنثى').length;
            const activeStages = STAGES.filter(st => DB.students.some(s => s.stage === st));
            const teachers = DB.registeredTeachers || [];

            // ── نسب الجنس ──
            const malePct   = total > 0 ? ((male   / total) * 100).toFixed(1) : 0;
            const femalePct = total > 0 ? ((female / total) * 100).toFixed(1) : 0;

            // ── متوسطات ──
            const avgPerStage   = activeStages.length > 0 ? (total / activeStages.length).toFixed(1) : '—';
            const avgPerTeacher = teachers.length > 0 ? (total / teachers.length).toFixed(1) : '—';

            // ── حالات الطلاب (العام الحالي) — كروت ثابتة بأربع فئات ──
            const STATUS_KEYS = ['جديد', 'ناجح ومنتقل', 'راسب', 'خريج'];
            const STATUS_META = {
                'جديد':         { icon: '✨', label: 'طلاب جدد',          desc: 'ملتحقون لأول مرة',          color: '#5b21b6', bg: '#f5f3ff', border: '#c4b5fd' },
                'ناجح ومنتقل':  { icon: '⬆️', label: 'ناجحون ومنتقلون',  desc: 'انتقلوا للمرحلة التالية',    color: '#166534', bg: '#f0fdf4', border: '#86efac' },
                'راسب':         { icon: '⚠️', label: 'راسبون',           desc: 'يُعيدون نفس المرحلة',         color: '#991b1b', bg: '#fff5f5', border: '#fca5a5' },
                'خريج':         { icon: '🎓', label: 'خريجون',           desc: 'أتموا آخر مرحلة',             color: '#92400e', bg: '#fffbeb', border: '#fde68a' }
            };
            const statusCount = { 'جديد': 0, 'ناجح ومنتقل': 0, 'راسب': 0, 'خريج': 0, 'منتقل': 0, 'غير محدد': 0 };
            DB.students.forEach(s => {
                const k = s.status || 'غير محدد';
                statusCount[k] = (statusCount[k] || 0) + 1;
            });
            // اعتبر "منتقل" (بدون نجاح) جزءاً من "ناجح ومنتقل" لتبسيط العرض
            statusCount['ناجح ومنتقل'] += statusCount['منتقل'] || 0;

            // ── أسماء الراسبين والخريجين (للجدول التفصيلي) ──
            const failedList    = DB.students.filter(s => s.status === 'راسب');
            const graduatedList = DB.students.filter(s => s.status === 'خريج');

            // ── نتائج العام السابق من الأرشيف (إن وُجد) ──
            let prevYearBlock = '';
            try {
                const yrs = (typeof getYrIdx === 'function') ? await getYrIdx() : [];
                const prevYears = (yrs || []).filter(y => y && y !== year).sort().reverse();
                if (prevYears.length) {
                    const prev = prevYears[0];
                    const rawPrev = await storeLoad(getYrDBKey(prev));
                    if (rawPrev) {
                        const prevDB = JSON.parse(rawPrev);
                        const prevStudents = (prevDB && prevDB.students) || [];
                        const c = { 'ناجح ومنتقل': 0, 'منتقل': 0, 'راسب': 0, 'خريج': 0, 'جديد': 0 };
                        prevStudents.forEach(s => { const k = s.status || 'غير محدد'; if (c[k] !== undefined) c[k]++; });
                        const promotedPrev  = c['ناجح ومنتقل'] + c['منتقل'];
                        const failedPrev    = c['راسب'];
                        const graduatedPrev = c['خريج'];
                        const newPrev       = c['جديد'];
                        prevYearBlock = `
                        <div class="nyr-prev" style="margin-top:14px;padding:11px 14px;background:#f1f5f9;border:1px dashed #94a3b8;border-radius:9px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                          <div style="font-size:11.5px;font-weight:900;color:#0d2645;margin-bottom:7px">📚 نتائج العام السابق (${prev}) — للسياق</div>
                          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
                            <div style="text-align:center;background:#fff;border:1px solid #c4b5fd;border-radius:7px;padding:6px 4px">
                              <div style="font-size:18px;font-weight:900;color:#5b21b6">${newPrev}</div>
                              <div style="font-size:9.5px;color:#6b7280">كانوا جدد</div>
                            </div>
                            <div style="text-align:center;background:#fff;border:1px solid #86efac;border-radius:7px;padding:6px 4px">
                              <div style="font-size:18px;font-weight:900;color:#166534">${promotedPrev}</div>
                              <div style="font-size:9.5px;color:#6b7280">نجحوا وانتقلوا</div>
                            </div>
                            <div style="text-align:center;background:#fff;border:1px solid #fca5a5;border-radius:7px;padding:6px 4px">
                              <div style="font-size:18px;font-weight:900;color:#991b1b">${failedPrev}</div>
                              <div style="font-size:9.5px;color:#6b7280">رسبوا</div>
                            </div>
                            <div style="text-align:center;background:#fff;border:1px solid #fde68a;border-radius:7px;padding:6px 4px">
                              <div style="font-size:18px;font-weight:900;color:#92400e">${graduatedPrev}</div>
                              <div style="font-size:9.5px;color:#6b7280">تخرّجوا</div>
                            </div>
                          </div>
                        </div>`;
                    }
                }
            } catch (e) { /* تجاهل: الأرشيف اختياري */ }

            // ── بيانات كل مرحلة مع تحليل مدرسين ──
            const stageData = activeStages.map(stage => {
                const ss          = DB.students.filter(s => s.stage === stage);
                const m           = ss.filter(s => s.gender === 'ذكر').length;
                const f           = ss.filter(s => s.gender === 'أنثى').length;
                const pct         = total > 0 ? ((ss.length / total) * 100).toFixed(1) : 0;
                const subjs       = (DB.subjects[stage] || []).map(s => (typeof s === 'object' ? s.name : s)).filter(Boolean);
                const stTeachers  = teachers.filter(t => (t.stages || []).includes(stage));
                const teacherLoad = stTeachers.length > 0 ? (ss.length / stTeachers.length).toFixed(1) : null;
                return { stage, count: ss.length, m, f, pct, subjs, stTeachers, teacherLoad };
            });

            // ── تجميع حسب القسم ──
            const divisions = [
                { key: 'حضانة',   label: 'الحضانة',   color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', stages: ['حضانة'] },
                { key: 'ابتدائي', label: 'المرحلة الابتدائية', color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe',
                  stages: ['أول ابتدائي','ثاني ابتدائي','ثالث ابتدائي','رابع ابتدائي','خامس ابتدائي','سادس ابتدائي'] },
                { key: 'إعدادي',  label: 'المرحلة الإعدادية', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7',
                  stages: ['أول إعدادي','ثاني إعدادي','ثالث إعدادي'] },
                { key: 'ثانوي',   label: 'المرحلة الثانوية', color: '#b45309', bg: '#fffbeb', border: '#fde68a',
                  stages: ['أول ثانوي','ثاني ثانوي','ثالث ثانوي'] }
            ];

            const divSummary = divisions.map(d => {
                const dStages = stageData.filter(sd => d.stages.includes(sd.stage));
                const dTotal  = dStages.reduce((a, b) => a + b.count, 0);
                const dMale   = dStages.reduce((a, b) => a + b.m, 0);
                const dFemale = dStages.reduce((a, b) => a + b.f, 0);
                const dPct    = total > 0 ? ((dTotal / total) * 100).toFixed(1) : 0;
                return { ...d, dTotal, dMale, dFemale, dPct, dStages };
            }).filter(d => d.dTotal > 0);

            // ── مراحل بدون مدرسين ──
            const stagesWithoutTeachers    = stageData.filter(sd => sd.stTeachers.length === 0);
            const stagesWithTeachers       = stageData.filter(sd => sd.stTeachers.length > 0);
            const coverageRate             = activeStages.length > 0
                ? ((stagesWithTeachers.length / activeStages.length) * 100).toFixed(0) : 0;

            // ── ملاحظات تلقائية ──
            const notes = [];
            if (stagesWithoutTeachers.length > 0)
                notes.push(`⚠️ ${stagesWithoutTeachers.length} مرحلة دراسية لم يُسنَد إليها مدرس بعد: <strong>${stagesWithoutTeachers.map(s=>s.stage).join('، ')}</strong>`);
            if (teachers.length > 0 && parseFloat(avgPerTeacher) > 20)
                notes.push(`⚠️ متوسط عدد الطلاب لكل مدرس مرتفع (${avgPerTeacher} طالب/مدرس) — يُنصح بمراجعة توزيع الأعباء التدريسية`);
            const teachersNoStages = teachers.filter(t => !(t.stages||[]).some(s=>STAGES.includes(s)));
            if (teachersNoStages.length > 0)
                notes.push(`📌 ${teachersNoStages.length} مدرس مسجل دون تعيين مرحلة دراسية: <strong>${teachersNoStages.map(t=>t.name).join('، ')}</strong>`);
            if (parseFloat(malePct) > 70)
                notes.push(`📊 نسبة الذكور مرتفعة (${malePct}%) — قد تستدعي مراجعة سياسة القبول`);
            if (parseFloat(femalePct) > 70)
                notes.push(`📊 نسبة الإناث مرتفعة (${femalePct}%) — قد تستدعي مراجعة سياسة القبول`);
            if (notes.length === 0)
                notes.push('✅ جميع المراحل مغطاة بمدرسين — لا توجد ملاحظات جوهرية');

            // ── بناء جدول المراحل حسب الأقسام ──
            let groupedStageRows = '';
            divSummary.forEach(d => {
                groupedStageRows += `<tr style="background:${d.bg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                    <td colspan="8" style="padding:6px 14px;border:1px solid ${d.border};font-weight:900;color:${d.color};font-size:12px">
                        🔷 ${d.label} &nbsp;—&nbsp; ${d.dTotal} طالب (${d.dPct}%) &nbsp;|&nbsp; ${d.dMale} ذكور · ${d.dFemale} إناث
                    </td></tr>`;
                d.dStages.forEach((sd, i) => {
                    const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
                    const teacherLoadCell = sd.teacherLoad
                        ? `<td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:${parseFloat(sd.teacherLoad)>20?'#991b1b':'#166534'};font-weight:700">${sd.teacherLoad}</td>`
                        : `<td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:700">⚠️ لا يوجد</td>`;
                    groupedStageRows += `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:700;padding-right:20px">${sd.stage}</td>
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:900;color:#1e3a5f">${sd.count}</td>
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#1e40af">${sd.m}</td>
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#9d174d">${sd.f}</td>
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#6b7280">${sd.pct}%</td>
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;color:#374151">${sd.stTeachers.length}</td>
                        ${teacherLoadCell}
                        <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:10.5px;color:#374151">${sd.stTeachers.map(t=>t.name).join(' · ') || '<span style="color:#9ca3af">—</span>'}</td>
                    </tr>`;
                });
            });

            // ── قائمة المدرسين المفصّلة ──
            let teacherRows = '';
            teachers.forEach((t, i) => {
                const assignedStages = (t.stages || []).filter(s => STAGES.includes(s));
                const subjs          = (t.subjects || []).join(' · ') || '—';
                const studentLoad    = assignedStages.reduce((acc, st) => {
                    return acc + DB.students.filter(s => s.stage === st).length;
                }, 0);
                const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
                const loadColor = studentLoad > 30 ? '#991b1b' : studentLoad > 20 ? '#b45309' : '#166534';
                teacherRows += `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:700">${i+1}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-weight:700">${t.name}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:900;color:#1e3a5f">${assignedStages.length}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px;color:#374151">${assignedStages.join(' · ') || '—'}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:11px">${subjs}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-weight:900;color:${loadColor}">${studentLoad > 0 ? studentLoad : '—'}</td>
                    <td style="padding:7px 10px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280">${t.registeredAt || '—'}</td>
                </tr>`;
            });

            // ── كروت الحالات الثابتة (4 كروت دائماً) ──
            const statusCards = STATUS_KEYS.map(k => {
                const m = STATUS_META[k];
                const v = statusCount[k] || 0;
                const pct2 = total > 0 ? ((v / total) * 100).toFixed(1) : '0.0';
                const dim = v === 0 ? 'opacity:.6' : '';
                return `<div class="nyr-stat-card" style="flex:1;min-width:140px;text-align:center;background:${m.bg};border:2px solid ${m.border};border-radius:11px;padding:14px 10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;${dim}">
                    <div style="font-size:20px;line-height:1">${m.icon}</div>
                    <div style="font-size:28px;font-weight:900;color:${m.color};margin-top:4px">${v}</div>
                    <div style="font-size:11.5px;color:#374151;font-weight:700;margin-top:3px">${m.label}</div>
                    <div style="font-size:10px;color:#6b7280;margin-top:2px">${m.desc}</div>
                    <div style="display:inline-block;margin-top:6px;background:#fff;border:1px solid ${m.border};color:${m.color};font-size:10px;font-weight:900;padding:2px 9px;border-radius:10px">${pct2}%</div>
                </div>`;
            }).join('');

            // ── جدول أسماء الراسبين والخريجين (لو موجودين) ──
            const detailedStatusTable = (failedList.length || graduatedList.length) ? `
              <div class="nyr-status-row" style="margin-top:14px">
                <div style="font-size:12px;font-weight:900;color:#0d2645;margin-bottom:7px">📋 تفاصيل الراسبين والخريجين</div>
                <table style="width:100%;border-collapse:collapse;font-size:11.5px">
                  <thead>
                    <tr>
                      <th style="background:#1e3a5f;color:#fff;padding:7px 10px;text-align:right;-webkit-print-color-adjust:exact;print-color-adjust:exact">#</th>
                      <th style="background:#1e3a5f;color:#fff;padding:7px 10px;text-align:right;-webkit-print-color-adjust:exact;print-color-adjust:exact">اسم الطالب</th>
                      <th style="background:#1e3a5f;color:#fff;padding:7px 10px;text-align:right;-webkit-print-color-adjust:exact;print-color-adjust:exact">المرحلة</th>
                      <th style="background:#1e3a5f;color:#fff;padding:7px 10px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${[...failedList.map(s => ({s, k:'راسب'})), ...graduatedList.map(s => ({s, k:'خريج'}))].map((row, i) => {
                      const m = STATUS_META[row.k];
                      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
                      return `<tr style="background:${bg}">
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:700">${i+1}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:700">${row.s.name || '—'}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;color:#374151">${row.s.stage || '—'}</td>
                        <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center">
                          <span style="background:${m.bg};border:1px solid ${m.border};color:${m.color};font-weight:900;font-size:10.5px;padding:2px 9px;border-radius:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact">${m.icon} ${row.k}</span>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>` : `
              <div class="nyr-status-row" style="margin-top:12px;padding:10px 13px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;font-size:11.5px;color:#166534;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                ✅ لا يوجد طلاب راسبون أو خريجون في القوائم الحالية.
              </div>`;

            const html = `<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 8mm 7mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#fff}
  body{font-family:'Cairo',sans-serif;font-size:12px;color:#1f2937;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page-wrap{width:770px;max-width:770px;margin:0 auto;padding:14px 14px}

  /* ── رأس التقرير (Cairo لضمان شكل الحروف العربية في PDF) ── */
  .report-header{background:linear-gradient(135deg,#0d2645 0%,#1e3a5f 60%,#2a4f80 100%);border-radius:14px;padding:20px 24px;text-align:center;margin-bottom:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-inside:avoid;break-inside:avoid}
  .church-cross{font-family:'Amiri',serif;font-size:28px;color:#c9a227;display:block;margin-bottom:4px;line-height:1}
  .school-name{font-family:'Cairo',sans-serif;font-size:16px;font-weight:700;color:#e8c04a;letter-spacing:0;line-height:1.5}
  .report-title-main{font-family:'Cairo',sans-serif;font-size:24px;color:#fff;margin:6px 0 4px;font-weight:900}
  .report-year-badge{display:inline-block;background:#c9a227;color:#0d2645;font-size:15px;font-weight:900;padding:4px 20px;border-radius:20px;margin:4px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .report-date-sub{font-size:11px;color:#cbd5e1;margin-top:6px}

  /* ── الملخص التنفيذي ── */
  .exec-summary{background:linear-gradient(135deg,#fffbeb,#fff7ed);border:2px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-inside:avoid;break-inside:avoid}
  .exec-title{font-size:13px;font-weight:900;color:#92400e;margin-bottom:9px}
  .exec-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .exec-item{background:#fff;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px}
  .exec-label{font-size:10.5px;color:#6b7280;line-height:1.3}
  .exec-val{font-size:14px;font-weight:900;color:#0d2645;white-space:nowrap}

  /* ── الأقسام ── */
  .section{margin-bottom:14px;border:1.5px solid #e5e7eb;border-radius:12px;overflow:hidden;page-break-inside:avoid;break-inside:avoid}
  .section-title{background:linear-gradient(135deg,#0d2645,#1e3a5f);color:#fff;font-size:13px;font-weight:900;padding:9px 16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .section-body{padding:12px 14px}

  /* ── بطاقات الإحصاء ── */
  .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}
  .kpi-box{border-radius:10px;padding:10px 4px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .kpi-val{font-size:22px;font-weight:900;line-height:1}
  .kpi-lbl{font-size:9.5px;color:#6b7280;margin-top:4px;line-height:1.3}

  /* ── شريط الجنس ── */
  .gender-bar-wrap{margin-top:11px}
  .gender-bar{height:20px;border-radius:10px;overflow:hidden;display:flex;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .gender-bar-m{background:#1e40af;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .gender-bar-f{background:#9d174d;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .gender-legend{display:flex;gap:14px;margin-top:6px;font-size:11px;flex-wrap:wrap}
  .gender-dot{width:11px;height:11px;border-radius:50%;display:inline-block;margin-left:4px;vertical-align:middle;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* ── الجداول ── */
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  th{background:#1e3a5f;color:#fff;padding:7px 10px;text-align:right;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  td{padding:6px 10px;border:1px solid #e5e7eb;vertical-align:middle}
  tr{page-break-inside:avoid;break-inside:avoid}

  /* ── بطاقات التغطية ── */
  .coverage-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:2px}
  .coverage-box{border-radius:10px;padding:11px 12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .coverage-label{font-size:11px;font-weight:700;margin-bottom:7px}
  .coverage-item{font-size:11px;padding:4px 0;border-bottom:1px dashed #e5e7eb;display:flex;justify-content:space-between;align-items:center;gap:6px}
  .coverage-item:last-child{border-bottom:none}

  /* ── الملاحظات ── */
  .notes-list{display:flex;flex-direction:column;gap:7px}
  .note-item{font-size:11.5px;padding:9px 12px;border-radius:8px;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-inside:avoid;break-inside:avoid}

  /* ── الكروت الحالية للحالات ── */
  .nyr-status-flex{display:flex;flex-wrap:wrap;gap:9px}
  .nyr-status-card{page-break-inside:avoid;break-inside:avoid}
  .nyr-status-row{page-break-inside:avoid;break-inside:avoid}

  /* ── التوقيعات ── */
  .footer-sigs{margin-top:22px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;text-align:center;padding-top:14px;border-top:2px solid #c9a227;page-break-inside:avoid;break-inside:avoid}
  .sig-box{text-align:center}
  .sig-line{border-bottom:1.5px solid #c9a227;margin-bottom:6px;height:28px}
  .sig-lbl{font-size:11px;color:#6b5e3e;font-weight:700}
  .print-note{text-align:center;font-size:10px;color:#9a8155;margin-top:10px;padding-top:8px;border-top:1px dashed #d4c08a}
</style>
</head>
<body><div class="page-wrap">

  <!-- ══ رأس التقرير ══ -->
  <div class="report-header">
    <span class="church-cross">✞</span>
    <div class="school-name">مدرسة البابا شنودة والأرشيذياكون حبيب جرجس</div>
    <div class="report-title-main">تقرير بدء العام الدراسي الجديد</div>
    <div class="report-year-badge">${year}</div>
    <div class="report-date-sub">📅 تاريخ إصدار التقرير: ${now}</div>
  </div>

  <!-- ══ الملخص التنفيذي ══ -->
  <div class="exec-summary">
    <div class="exec-title">⚡ ملخص تنفيذي — أبرز مؤشرات بداية العام</div>
    <div class="exec-grid">
      <div class="exec-item"><span class="exec-label">👥 إجمالي الطلاب</span><span class="exec-val">${total}</span></div>
      <div class="exec-item"><span class="exec-label">👨‍🏫 المدرسون</span><span class="exec-val">${teachers.length}</span></div>
      <div class="exec-item"><span class="exec-label">🏫 مراحل نشطة</span><span class="exec-val">${activeStages.length}</span></div>
      <div class="exec-item"><span class="exec-label">📊 ذكور / إناث</span><span class="exec-val">${malePct}% / ${femalePct}%</span></div>
      <div class="exec-item"><span class="exec-label">📐 طلاب/مرحلة</span><span class="exec-val">${avgPerStage}</span></div>
      <div class="exec-item"><span class="exec-label">📐 طلاب/مدرس</span><span class="exec-val">${avgPerTeacher}</span></div>
      <div class="exec-item"><span class="exec-label">✅ تغطية المراحل</span><span class="exec-val">${coverageRate}%</span></div>
      <div class="exec-item"><span class="exec-label">⚠️ مراحل بدون مدرس</span><span class="exec-val" style="color:${stagesWithoutTeachers.length>0?'#dc2626':'#16a34a'}">${stagesWithoutTeachers.length}</span></div>
      <div class="exec-item"><span class="exec-label">📚 أقسام دراسية</span><span class="exec-val">${divSummary.length}</span></div>
    </div>
  </div>

  <!-- ══ القسم الأول: الإحصاءات العامة ══ -->
  <div class="section">
    <div class="section-title">📊 القسم الأول — الإحصاءات العامة</div>
    <div class="section-body">
      <div class="kpi-grid">
        <div class="kpi-box" style="background:#eff6ff;border:2px solid #bfdbfe">
          <div class="kpi-val" style="color:#1e40af">${total}</div>
          <div class="kpi-lbl">👥 إجمالي الطلاب</div>
        </div>
        <div class="kpi-box" style="background:#ecfdf5;border:2px solid #6ee7b7">
          <div class="kpi-val" style="color:#065f46">${male}</div>
          <div class="kpi-lbl">👦 ذكور (${malePct}%)</div>
        </div>
        <div class="kpi-box" style="background:#fdf2f8;border:2px solid #f9a8d4">
          <div class="kpi-val" style="color:#9d174d">${female}</div>
          <div class="kpi-lbl">👧 إناث (${femalePct}%)</div>
        </div>
        <div class="kpi-box" style="background:#fff7ed;border:2px solid #fdba74">
          <div class="kpi-val" style="color:#c2410c">${activeStages.length}</div>
          <div class="kpi-lbl">🏫 مراحل نشطة</div>
        </div>
        <div class="kpi-box" style="background:#f5f3ff;border:2px solid #c4b5fd">
          <div class="kpi-val" style="color:#5b21b6">${teachers.length}</div>
          <div class="kpi-lbl">👨‍🏫 مدرسون</div>
        </div>
        <div class="kpi-box" style="background:#fef9c3;border:2px solid #fde047">
          <div class="kpi-val" style="color:#854d0e">${avgPerTeacher}</div>
          <div class="kpi-lbl">📐 طالب/مدرس</div>
        </div>
      </div>
      ${total > 0 ? `
      <div class="gender-bar-wrap">
        <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:5px">📊 التوزيع الجنساني</div>
        <div class="gender-bar">
          <div class="gender-bar-m" style="width:${malePct}%">${malePct}% ذكور</div>
          <div class="gender-bar-f" style="width:${femalePct}%">${femalePct}% إناث</div>
        </div>
        <div class="gender-legend">
          <span><span class="gender-dot" style="background:#1e40af"></span>ذكور: ${male} (${malePct}%)</span>
          <span><span class="gender-dot" style="background:#9d174d"></span>إناث: ${female} (${femalePct}%)</span>
        </div>
      </div>` : ''}
    </div>
  </div>

  <!-- ══ القسم الثاني: حالات الطلاب (4 كروت ثابتة + جدول تفصيلي) ══ -->
  <div class="section">
    <div class="section-title">🏷️ القسم الثاني — توزيع الطلاب حسب الحالة الدراسية</div>
    <div class="section-body">
      <div style="margin-bottom:11px;padding:9px 13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;color:#475569;-webkit-print-color-adjust:exact;print-color-adjust:exact">
        📌 <strong>دليل الفئات:</strong> الجدد ملتحقون لأول مرة · الناجحون انتقلوا من العام الماضي · الراسبون يُعيدون نفس المرحلة · الخريجون أتموا آخر مرحلة.
      </div>
      <div class="nyr-status-flex">${statusCards}</div>
      ${prevYearBlock}
      ${detailedStatusTable}
    </div>
  </div>

  <!-- ══ القسم الثالث: توزيع الطلاب حسب المرحلة ══ -->
  <div class="section">
    <div class="section-title">📋 القسم الثالث — توزيع الطلاب حسب المرحلة الدراسية</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr>
            <th>المرحلة</th>
            <th style="text-align:center">الإجمالي</th>
            <th style="text-align:center">ذكور</th>
            <th style="text-align:center">إناث</th>
            <th style="text-align:center">النسبة</th>
            <th style="text-align:center">المدرسون</th>
            <th style="text-align:center">طالب/مدرس</th>
            <th>المدرسون المسندون</th>
          </tr>
        </thead>
        <tbody>
          ${groupedStageRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:20px">لا يوجد طلاب مسجلون</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#0d2645;color:#fff;font-weight:900;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            <td style="padding:8px 10px;border:1px solid #0d2645">الإجمالي الكلي</td>
            <td style="padding:8px 10px;border:1px solid #0d2645;text-align:center">${total}</td>
            <td style="padding:8px 10px;border:1px solid #0d2645;text-align:center">${male}</td>
            <td style="padding:8px 10px;border:1px solid #0d2645;text-align:center">${female}</td>
            <td style="padding:8px 10px;border:1px solid #0d2645;text-align:center">100%</td>
            <td style="padding:8px 10px;border:1px solid #0d2645;text-align:center" colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- ══ القسم الرابع: ملخص الأقسام ══ -->
  ${divSummary.length > 0 ? `
  <div class="section">
    <div class="section-title">🏗️ القسم الرابع — ملخص الأقسام الدراسية</div>
    <div class="section-body">
      <div style="display:grid;grid-template-columns:repeat(${Math.min(divSummary.length,4)},1fr);gap:10px">
        ${divSummary.map(d => `
        <div style="background:${d.bg};border:2px solid ${d.border};border-radius:12px;padding:12px 10px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div style="font-size:12.5px;font-weight:900;color:${d.color};margin-bottom:7px">${d.label}</div>
          <div style="font-size:26px;font-weight:900;color:${d.color}">${d.dTotal}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">طالب (${d.dPct}%)</div>
          <div style="margin-top:7px;display:flex;justify-content:center;gap:10px;font-size:10.5px">
            <span style="color:#1e40af">👦 ${d.dMale}</span>
            <span style="color:#9d174d">👧 ${d.dFemale}</span>
          </div>
          <div style="margin-top:5px;font-size:10px;color:#6b7280">${d.dStages.length} مرحلة</div>
        </div>`).join('')}
      </div>
    </div>
  </div>` : ''}

  <!-- ══ القسم الخامس: تحليل التغطية التدريسية ══ -->
  <div class="section">
    <div class="section-title">🎯 القسم الخامس — تحليل التغطية التدريسية</div>
    <div class="section-body">
      <div style="margin-bottom:11px;padding:9px 13px;background:${parseFloat(coverageRate)===100?'#f0fdf4':'#fffbeb'};border:1.5px solid ${parseFloat(coverageRate)===100?'#86efac':'#fde68a'};border-radius:9px;display:flex;align-items:center;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact">
        <span style="font-size:12px;font-weight:700;color:${parseFloat(coverageRate)===100?'#166534':'#92400e'}">
          ${parseFloat(coverageRate)===100?'✅':'⚠️'} نسبة تغطية المراحل بمدرسين
        </span>
        <span style="font-size:19px;font-weight:900;color:${parseFloat(coverageRate)===100?'#166534':'#d97706'}">${coverageRate}%</span>
      </div>
      <div class="coverage-grid">
        <div class="coverage-box" style="background:#f0fdf4;border:1.5px solid #86efac;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div class="coverage-label" style="color:#166534">✅ مراحل بها مدرسون (${stagesWithTeachers.length})</div>
          ${stagesWithTeachers.length ? stagesWithTeachers.map(sd =>
            `<div class="coverage-item">
              <span style="font-weight:700">${sd.stage}</span>
              <span style="color:#166534;font-size:10.5px">${sd.stTeachers.length} مدرس — ${sd.teacherLoad} ط/م</span>
            </div>`).join('') : '<div style="font-size:11px;color:#9ca3af">لا توجد</div>'}
        </div>
        <div class="coverage-box" style="background:${stagesWithoutTeachers.length?'#fff5f5':'#f9fafb'};border:1.5px solid ${stagesWithoutTeachers.length?'#fca5a5':'#e5e7eb'};-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div class="coverage-label" style="color:${stagesWithoutTeachers.length?'#991b1b':'#6b7280'}">${stagesWithoutTeachers.length?'⚠️':'✅'} مراحل بدون مدرس (${stagesWithoutTeachers.length})</div>
          ${stagesWithoutTeachers.length ? stagesWithoutTeachers.map(sd =>
            `<div class="coverage-item">
              <span style="font-weight:700;color:#991b1b">${sd.stage}</span>
              <span style="color:#dc2626;font-size:10.5px">${sd.count} طالب غير مكفول</span>
            </div>`).join('') : '<div style="font-size:11px;color:#166534">✅ جميع المراحل مغطاة</div>'}
        </div>
      </div>
    </div>
  </div>

  <!-- ══ القسم السادس: قائمة المدرسين ══ -->
  ${teachers.length ? `
  <div class="section">
    <div class="section-title">👨‍🏫 القسم السادس — قائمة المدرسين المسجلين (${teachers.length})</div>
    <div class="section-body" style="padding:0">
      <table>
        <thead>
          <tr>
            <th style="text-align:center;width:32px">#</th>
            <th>اسم المدرس</th>
            <th style="text-align:center">عدد المراحل</th>
            <th>المراحل المسندة</th>
            <th>المواد</th>
            <th style="text-align:center">إجمالي الطلاب</th>
            <th style="text-align:center">تاريخ التسجيل</th>
          </tr>
        </thead>
        <tbody>${teacherRows}</tbody>
        <tfoot>
          <tr style="background:#0d2645;color:#fff;font-weight:900;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            <td colspan="2" style="padding:7px 10px;border:1px solid #0d2645">إجمالي المدرسين: ${teachers.length}</td>
            <td colspan="5" style="padding:7px 10px;border:1px solid #0d2645;font-size:11px;font-weight:400">
              متوسط: ${avgPerTeacher} طالب/مدرس · مغطاة: ${stagesWithTeachers.length}/${activeStages.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>` : `
  <div class="section">
    <div class="section-title">👨‍🏫 القسم السادس — المدرسون</div>
    <div class="section-body" style="text-align:center;padding:24px;color:#9ca3af">لا يوجد مدرسون مسجلون بعد</div>
  </div>`}

  <!-- ══ القسم السابع: الملاحظات والتوصيات ══ -->
  <div class="section">
    <div class="section-title">📝 القسم السابع — الملاحظات والتوصيات</div>
    <div class="section-body">
      <div class="notes-list">
        ${notes.map(n => {
          const isWarning = n.startsWith('⚠️');
          const isInfo    = n.startsWith('📌') || n.startsWith('📊');
          const bg     = isWarning ? '#fff5f5' : isInfo ? '#fffbeb' : '#f0fdf4';
          const border = isWarning ? '#fca5a5' : isInfo ? '#fde68a' : '#86efac';
          return `<div class="note-item" style="background:${bg};border:1.5px solid ${border};-webkit-print-color-adjust:exact;print-color-adjust:exact">${n}</div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- ══ التوقيعات والختم ══ -->
  <div class="footer-sigs">
    <div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">توقيع مدير المدرسة</div></div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">توقيع مراقب المدرسة</div></div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">الختم الرسمي</div></div>
  </div>
  <div class="print-note">📅 تاريخ الطباعة: ${now} &nbsp;|&nbsp; 🖨️ تصميم وتطوير: ابانوب فايز &nbsp;|&nbsp; مدرسة البابا شنودة — نظام الإدارة</div>

</div></body></html>`;

            setPrint(html, `تقرير_بدء_العام_${year.replace(/\//g, '-')}`);
        }

        // ══ نهاية تقرير بدء العام الدراسي ══

        // =========================================================
        // 🚀 تقرير الاستعداد للعام الدراسي الجديد
        // =========================================================
        async function loadReadinessYears() {
            const sel = document.getElementById('readiness-prev-year');
            if (!sel) return;
            const years = (await getYrIdx()).sort().reverse();
            const cur = sel.value;
            sel.innerHTML = years.length
                ? '<option value="">— اختر العام السابق —</option>' + years.map(y => `<option value="${y}"${y === cur ? ' selected' : ''}>${y}</option>`).join('')
                : '<option value="">⚠️ لا يوجد أعوام مؤرشفة</option>';
        }

        async function printReadinessReport() {
            const sel = document.getElementById('readiness-prev-year');
            await loadReadinessYears();
            let prevYear = sel ? sel.value : '';
            if (!prevYear) {
                const years = (await getYrIdx()).sort().reverse();
                if (!years.length) { showToast('⚠️ لا توجد أعوام مؤرشفة للمقارنة'); return; }
                prevYear = prompt('أدخل العام السابق للمقارنة (مثال: 2024/2025):\n\nالأعوام المتاحة: ' + years.join('، '), years[0]);
                if (!prevYear) return;
            }
            const raw = await storeLoad(getYrDBKey(prevYear));
            if (!raw) { showToast('⚠️ لم يتم العثور على بيانات عام ' + prevYear); return; }
            let prevDB;
            try { prevDB = typeof raw === 'string' ? JSON.parse(raw) : raw; }
            catch (e) { showToast('⚠️ بيانات العام السابق تالفة'); return; }

            const prev = (prevDB.students || []);
            const curr = (DB.students || []);
            const currYear = DB.schoolYear || '—';

            const prevById = new Map(prev.map(s => [String(s.id), s]));
            const currById = new Map(curr.map(s => [String(s.id), s]));
            const prevByNameStage = new Map(prev.map(s => [`${(s.name || '').trim()}|${s.stage || ''}`, s]));
            const currByName = new Map(curr.map(s => [(s.name || '').trim(), s]));

            const stageIdx = (st) => STAGES.indexOf(st);
            const isPromoted = (oldSt, newSt) => stageIdx(newSt) > stageIdx(oldSt);

            const continuing = [], promoted = [], repeating = [], graduates = [], transferredOut = [], withdrawn = [], newcomers = [], transferredIn = [];

            for (const ps of prev) {
                const cs = currById.get(String(ps.id)) || currByName.get((ps.name || '').trim());
                if (cs) {
                    if (isPromoted(ps.stage, cs.stage)) promoted.push({ prev: ps, curr: cs });
                    else if (ps.stage === cs.stage) repeating.push({ prev: ps, curr: cs });
                    else continuing.push({ prev: ps, curr: cs });
                } else {
                    const st = (ps.status || '').trim();
                    if (st === 'خريج' || (stageIdx(ps.stage) === STAGES.length - 1 && stageIdx(ps.stage) >= 0)) graduates.push(ps);
                    else if (st === 'منتقل' || st.indexOf('مدرسة') >= 0) transferredOut.push(ps);
                    else withdrawn.push(ps);
                }
            }
            for (const cs of curr) {
                if (prevById.has(String(cs.id))) continue;
                if (prevByNameStage.has(`${(cs.name || '').trim()}|${cs.stage}`)) continue;
                // existed under different stage? if same name found in prev → it's promoted/repeating already handled
                const sameName = prev.find(p => (p.name || '').trim() === (cs.name || '').trim());
                if (sameName) continue;
                const st = (cs.status || '').trim();
                if (st === 'جديد' || stageIdx(cs.stage) <= 1) newcomers.push(cs);
                else transferredIn.push(cs);
            }

            const stagePrev = {}, stageCurr = {};
            STAGES.forEach(s => { stagePrev[s] = 0; stageCurr[s] = 0; });
            prev.forEach(s => { if (stagePrev[s.stage] !== undefined) stagePrev[s.stage]++; });
            curr.forEach(s => { if (stageCurr[s.stage] !== undefined) stageCurr[s.stage]++; });

            const stageBreakdown = STAGES.map(st => {
                const p = stagePrev[st], c = stageCurr[st];
                const grad = graduates.filter(s => s.stage === st).length;
                const promoTo = promoted.filter(x => x.curr.stage === st).length;
                const newc = newcomers.filter(s => s.stage === st).length;
                const transIn = transferredIn.filter(s => s.stage === st).length;
                const transOut = transferredOut.filter(s => s.stage === st).length;
                const wd = withdrawn.filter(s => s.stage === st).length;
                const rep = repeating.filter(x => x.curr.stage === st).length;
                const diff = c - p;
                const pct = p ? ((diff / p) * 100) : (c ? 100 : 0);
                return { stage: st, prev: p, curr: c, diff, pct, grad, promoTo, newc, transIn, transOut, wd, rep };
            });

            const genderPrev = { male: prev.filter(s => s.gender === 'ذكر').length, female: prev.filter(s => s.gender === 'أنثى').length };
            const genderCurr = { male: curr.filter(s => s.gender === 'ذكر').length, female: curr.filter(s => s.gender === 'أنثى').length };

            const PHASES = [
                { name: 'مرحلة الحضانة', icon: '🌱', color: '#5b21b6', stages: ['حضانة'] },
                { name: 'المرحلة الابتدائية', icon: '📖', color: '#1e40af', stages: ['أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي'] },
                { name: 'المرحلة الإعدادية', icon: '📚', color: '#065f46', stages: ['أول إعدادي', 'ثاني إعدادي', 'ثالث إعدادي'] },
                { name: 'المرحلة الثانوية', icon: '🎓', color: '#7f1d1d', stages: ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'] }
            ];

            const sortedByDiff = [...stageBreakdown].filter(s => s.prev + s.curr > 0).sort((a, b) => b.diff - a.diff);
            const topGainers = sortedByDiff.slice(0, 3).filter(s => s.diff > 0);
            const topLosers = [...sortedByDiff].reverse().slice(0, 3).filter(s => s.diff < 0);

            const alerts = [];
            stageBreakdown.forEach(s => {
                if (s.prev >= 5 && s.pct <= -30) alerts.push(`⚠️ صف "${s.stage}" انخفض ${Math.abs(s.pct).toFixed(0)}% — راجع أسباب التسرب`);
                if (s.prev >= 3 && s.pct >= 50) alerts.push(`📌 صف "${s.stage}" زاد ${s.pct.toFixed(0)}% — قد يحتاج فصلًا/مدرّسًا إضافيًا`);
            });
            PHASES.forEach(ph => {
                const phaseNewc = newcomers.filter(s => ph.stages.includes(s.stage)).length;
                const phaseCurr = curr.filter(s => ph.stages.includes(s.stage)).length;
                if (phaseCurr > 0 && phaseNewc === 0 && ph.name !== 'المرحلة الثانوية') alerts.push(`⚠️ "${ph.name}" بدون أي مستجدين — غياب التغذية الجديدة`);
            });
            const totalIn = newcomers.length + transferredIn.length;
            const totalOut = graduates.length + transferredOut.length + withdrawn.length;
            if (totalOut > totalIn && prev.length > 0) alerts.push(`📉 المغادرون (${totalOut}) أكبر من المنضمين (${totalIn}) — المدرسة في انكماش`);
            if (curr.length > prev.length * 1.2 && prev.length > 0) alerts.push(`📈 نمو إجمالي ${(((curr.length - prev.length) / prev.length) * 100).toFixed(0)}% — استعد لزيادة الموارد`);
            if (!alerts.length) alerts.push('✅ لا توجد تنبيهات حرجة — التوزيع متوازن');

            const netDiff = curr.length - prev.length;
            const netPct = prev.length ? (netDiff / prev.length * 100) : 0;
            const totalGrad = graduates.length;
            const filledByNew = newcomers.length + transferredIn.length;

            const today = new Date().toLocaleDateString('ar-EG');
            const logoSrc = (typeof LOGO_B64 !== 'undefined' && LOGO_B64) ? LOGO_B64 : '';

            const kpi = (icon, label, value, color, sub) => `
                <div class="kpi">
                    <div class="kpi-icon" style="background:${color}22;color:${color}">${icon}</div>
                    <div class="kpi-body">
                        <div class="kpi-label">${label}</div>
                        <div class="kpi-value" style="color:${color}">${value}</div>
                        ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
                    </div>
                </div>`;

            const w = window.open('', '_blank');
            if (!w) { showToast('⚠️ افتح النوافذ المنبثقة'); return; }

            const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>🚀 الاستعداد للعام الدراسي ${currYear}</title>
<style>
@page { size: A4; margin: 11mm; }
* { box-sizing: border-box; font-family: 'Cairo','Segoe UI',Tahoma,sans-serif; }
body { margin:0; color:#1f2937; background:#fff; font-size:12px; line-height:1.55; }
.wrap { max-width: 190mm; margin: 0 auto; padding: 8px 0 24px; }
.hdr { background: linear-gradient(135deg,#0d2645 0%,#1e40af 100%); color:#fff; border-radius:14px; padding:18px 22px; display:flex; gap:16px; align-items:center; margin-bottom:14px; }
.hdr img { width:64px; height:64px; border-radius:50%; background:#fff; padding:4px; object-fit:contain; }
.hdr h1 { margin:0 0 4px; font-size:22px; }
.hdr .sub { font-size:12.5px; opacity:.92; }
.hdr .yrs { background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.32); padding:6px 14px; border-radius:30px; margin-top:8px; display:inline-block; font-weight:700; font-size:13px; }
.hdr .meta { text-align:left; font-size:11px; opacity:.88; margin-right:auto; }
.section { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; margin-bottom:12px; page-break-inside: avoid; }
.section h2 { margin:0 0 12px; font-size:15px; color:#0d2645; border-right:4px solid #15803d; padding-right:10px; display:flex; align-items:center; gap:8px; }
.kpi-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; }
.kpi { display:flex; gap:10px; align-items:center; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:9px 11px; }
.kpi-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.kpi-label { font-size:10.5px; color:#6b7280; font-weight:600; }
.kpi-value { font-size:20px; font-weight:800; line-height:1.1; }
.kpi-sub { font-size:9.5px; color:#9ca3af; margin-top:2px; }
table { width:100%; border-collapse:collapse; font-size:11px; }
th,td { padding:6px 5px; text-align:center; border:1px solid #e5e7eb; }
th { background:#0d2645; color:#fff; font-weight:700; font-size:10.5px; }
.phase-row td { background:#eff6ff; font-weight:800; color:#1e40af; }
.total-row td { background:#0d2645; color:#fff; font-weight:800; }
.pos { color:#15803d; font-weight:700; }
.neg { color:#b91c1c; font-weight:700; }
.neu { color:#6b7280; }
.bar { display:inline-block; height:13px; background:linear-gradient(90deg,#3b82f6,#1e40af); border-radius:4px; vertical-align:middle; }
.bar.f { background:linear-gradient(90deg,#ec4899,#be185d); }
.alert-box { background:#fffbeb; border:1.5px solid #f59e0b; border-radius:10px; padding:9px 14px; margin-bottom:6px; font-size:12px; color:#78350f; }
.alert-box.ok { background:#f0fdf4; border-color:#22c55e; color:#14532d; }
.alert-box.bad { background:#fef2f2; border-color:#ef4444; color:#7f1d1d; }
.top-grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
.top-card { border:1.5px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
.top-card.up { border-color:#86efac; background:#f0fdf4; }
.top-card.down { border-color:#fca5a5; background:#fef2f2; }
.top-card h3 { margin:0 0 8px; font-size:13px; }
.top-card ul { margin:0; padding-right:18px; }
.top-card li { margin-bottom:4px; font-size:11.5px; }
.impact-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:10px; }
.impact { padding:14px; border-radius:10px; text-align:center; }
.impact.a { background:#fee2e2; color:#7f1d1d; }
.impact.b { background:#dcfce7; color:#14532d; }
.impact .v { font-size:30px; font-weight:800; line-height:1; }
.impact .l { font-size:11.5px; margin-top:6px; font-weight:600; }
.sig { margin-top:24px; display:grid; grid-template-columns: repeat(3,1fr); gap:18px; }
.sig div { border-top:2px solid #1f2937; padding-top:6px; text-align:center; font-size:11.5px; color:#4b5563; font-weight:700; }
.names-cell { font-size:10.5px; color:#374151; text-align:right; line-height:1.7; }
.ctrl { position:fixed; top:10px; left:10px; z-index:9999; display:flex; gap:8px; }
.ctrl button { padding:9px 16px; border:0; border-radius:8px; font-family:'Cairo',sans-serif; font-weight:700; font-size:12.5px; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.15); }
.ctrl .p { background:#15803d; color:#fff; }
.ctrl .c { background:#e5e7eb; color:#1f2937; }
@media print { .ctrl { display:none !important; } body { font-size:10.5px; } .section { page-break-inside: avoid; box-shadow:none; } }
</style></head><body>
<div class="ctrl">
    <button class="p" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
    <button class="c" onclick="window.close()">✖ إغلاق</button>
</div>
<div class="wrap">
    <div class="hdr">
        ${logoSrc ? `<img src="${logoSrc}" alt="">` : ''}
        <div>
            <h1>🚀 الاستعداد للعام الدراسي الجديد</h1>
            <div class="sub">مدرسة البابا شنودة والأرشيذياكون حبيب جرجس — للألحان والطقس والقبطي</div>
            <div class="yrs">📅 مقارنة ${prevYear} ⟸ ${currYear}</div>
        </div>
        <div class="meta">تاريخ الإصدار<br><strong>${today}</strong></div>
    </div>

    <div class="section">
        <h2>📊 المؤشرات الرئيسية</h2>
        <div class="kpi-grid">
            ${kpi('👥', 'إجمالي العام السابق', prev.length, '#6b7280', prevYear)}
            ${kpi('🎯', 'إجمالي العام الحالي', curr.length, '#0d2645', `${netDiff >= 0 ? '+' : ''}${netDiff} (${netPct >= 0 ? '+' : ''}${netPct.toFixed(1)}%)`)}
            ${kpi('🔄', 'مستمرون', continuing.length + promoted.length, '#0891b2', 'من العام السابق')}
            ${kpi('⬆️', 'تمت ترقيتهم', promoted.length, '#059669', 'لصفوف أعلى')}
            ${kpi('🆕', 'مستجدون', newcomers.length, '#16a34a', 'لأول مرة')}
            ${kpi('🏫', 'منقولون من مدارس', transferredIn.length, '#0d9488', 'منضمون جدد')}
            ${kpi('🎓', 'خريجو العام الماضي', graduates.length, '#7c3aed', '')}
            ${kpi('🚪', 'منتقلون لمدارس أخرى', transferredOut.length, '#ea580c', '')}
            ${kpi('❌', 'منسحبون / ملغى قيدهم', withdrawn.length, '#dc2626', '')}
            ${kpi('🔁', 'راسبون / معيدون', repeating.length, '#b45309', '')}
            ${kpi('👦', 'بنون', genderCurr.male, '#1e40af', `سابق: ${genderPrev.male}`)}
            ${kpi('👧', 'بنات', genderCurr.female, '#be185d', `سابق: ${genderPrev.female}`)}
        </div>
    </div>

    <div class="section">
        <h2>📋 مقارنة تفصيلية صف-بصف</h2>
        <table>
            <thead><tr>
                <th style="text-align:right">الصف / المرحلة</th><th>${prevYear}</th><th>${currYear}</th><th>الفرق</th><th>التغير %</th>
                <th>🎓</th><th>⬆️</th><th>🆕</th><th>🏫</th><th>🚪</th><th>❌</th><th>🔁</th>
            </tr></thead>
            <tbody>
            ${PHASES.map(ph => {
                const rows = stageBreakdown.filter(b => ph.stages.includes(b.stage));
                const pSum = rows.reduce((a, b) => a + b.prev, 0);
                const cSum = rows.reduce((a, b) => a + b.curr, 0);
                const dSum = cSum - pSum;
                const pctSum = pSum ? (dSum / pSum * 100) : 0;
                const sc = (k) => rows.reduce((a, b) => a + b[k], 0);
                const stageRows = rows.map(b => {
                    const dc = b.diff > 0 ? 'pos' : (b.diff < 0 ? 'neg' : 'neu');
                    return `<tr>
                        <td style="text-align:right;font-weight:700">${b.stage}</td>
                        <td>${b.prev}</td><td>${b.curr}</td>
                        <td class="${dc}">${b.diff >= 0 ? '+' : ''}${b.diff}</td>
                        <td class="${dc}">${b.prev ? `${b.pct >= 0 ? '+' : ''}${b.pct.toFixed(1)}%` : '—'}</td>
                        <td>${b.grad || '—'}</td><td>${b.promoTo || '—'}</td><td>${b.newc || '—'}</td>
                        <td>${b.transIn || '—'}</td><td>${b.transOut || '—'}</td><td>${b.wd || '—'}</td><td>${b.rep || '—'}</td>
                    </tr>`;
                }).join('');
                const sc2 = dSum > 0 ? 'pos' : (dSum < 0 ? 'neg' : 'neu');
                return stageRows + `<tr class="phase-row">
                    <td style="text-align:right">${ph.icon} مجموع ${ph.name}</td>
                    <td>${pSum}</td><td>${cSum}</td>
                    <td class="${sc2}">${dSum >= 0 ? '+' : ''}${dSum}</td>
                    <td class="${sc2}">${pSum ? `${pctSum >= 0 ? '+' : ''}${pctSum.toFixed(1)}%` : '—'}</td>
                    <td>${sc('grad')}</td><td>${sc('promoTo')}</td><td>${sc('newc')}</td>
                    <td>${sc('transIn')}</td><td>${sc('transOut')}</td><td>${sc('wd')}</td><td>${sc('rep')}</td>
                </tr>`;
            }).join('')}
            <tr class="total-row">
                <td style="text-align:right">🏫 الإجمالي العام</td>
                <td>${prev.length}</td><td>${curr.length}</td>
                <td>${netDiff >= 0 ? '+' : ''}${netDiff}</td>
                <td>${prev.length ? `${netPct >= 0 ? '+' : ''}${netPct.toFixed(1)}%` : '—'}</td>
                <td>${graduates.length}</td><td>${promoted.length}</td><td>${newcomers.length}</td>
                <td>${transferredIn.length}</td><td>${transferredOut.length}</td><td>${withdrawn.length}</td><td>${repeating.length}</td>
            </tr>
            </tbody>
        </table>
        <div style="margin-top:8px;font-size:10px;color:#6b7280;text-align:center">🎓 خريج · ⬆️ ترقية إليه · 🆕 مستجد · 🏫 منقول من مدرسة · 🚪 منتقل خارج · ❌ منسحب · 🔁 معيد</div>
    </div>

    <div class="section">
        <h2>👥 توزيع الطلاب حسب النوع</h2>
        <table>
            <thead><tr><th>النوع</th><th>${prevYear}</th><th>${currYear}</th><th>الفرق</th><th>النسبة من الإجمالي</th><th>التمثيل البصري</th></tr></thead>
            <tbody>
                <tr><td style="text-align:right;font-weight:700">👦 بنون</td><td>${genderPrev.male}</td><td>${genderCurr.male}</td>
                    <td class="${(genderCurr.male - genderPrev.male) >= 0 ? 'pos' : 'neg'}">${(genderCurr.male - genderPrev.male) >= 0 ? '+' : ''}${genderCurr.male - genderPrev.male}</td>
                    <td>${curr.length ? ((genderCurr.male / curr.length) * 100).toFixed(1) : 0}%</td>
                    <td style="text-align:right"><span class="bar" style="width:${Math.min(180, (genderCurr.male / Math.max(curr.length, 1)) * 200)}px"></span></td></tr>
                <tr><td style="text-align:right;font-weight:700">👧 بنات</td><td>${genderPrev.female}</td><td>${genderCurr.female}</td>
                    <td class="${(genderCurr.female - genderPrev.female) >= 0 ? 'pos' : 'neg'}">${(genderCurr.female - genderPrev.female) >= 0 ? '+' : ''}${genderCurr.female - genderPrev.female}</td>
                    <td>${curr.length ? ((genderCurr.female / curr.length) * 100).toFixed(1) : 0}%</td>
                    <td style="text-align:right"><span class="bar f" style="width:${Math.min(180, (genderCurr.female / Math.max(curr.length, 1)) * 200)}px"></span></td></tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🏛️ توزيع الطلاب حسب المرحلة الدراسية</h2>
        <table>
            <thead><tr><th>المرحلة</th><th>${prevYear}</th><th>${currYear}</th><th>النسبة من الإجمالي</th><th>نسبة النمو</th><th>التمثيل</th></tr></thead>
            <tbody>
            ${PHASES.map(ph => {
                const p = ph.stages.reduce((a, s) => a + (stagePrev[s] || 0), 0);
                const c = ph.stages.reduce((a, s) => a + (stageCurr[s] || 0), 0);
                const pctOfTotal = curr.length ? (c / curr.length * 100) : 0;
                const growth = p ? ((c - p) / p * 100) : (c ? 100 : 0);
                const cls = (c - p) >= 0 ? 'pos' : 'neg';
                return `<tr><td style="text-align:right;font-weight:700;color:${ph.color}">${ph.icon} ${ph.name}</td>
                    <td>${p}</td><td>${c}</td>
                    <td>${pctOfTotal.toFixed(1)}%</td>
                    <td class="${cls}">${p ? `${(c - p) >= 0 ? '+' : ''}${growth.toFixed(1)}%` : (c ? 'جديدة' : '—')}</td>
                    <td style="text-align:right"><span class="bar" style="width:${Math.min(180, pctOfTotal * 2)}px;background:${ph.color}"></span></td></tr>`;
            }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🔍 ماذا حدث العام الماضي وأثره على العام الحالي</h2>
        <div class="impact-grid" style="margin-bottom:14px">
            <div class="impact a"><div class="v">${totalGrad}</div><div class="l">🎓 مقعد شغر بسبب التخرج</div></div>
            <div class="impact b"><div class="v">${filledByNew}</div><div class="l">🆕 مقعد شغله طلاب جدد (مستجدون + منقولون)</div></div>
        </div>
        <div class="top-grid">
            <div class="top-card up">
                <h3>📈 أكبر الصفوف زيادةً</h3>
                ${topGainers.length ? `<ul>${topGainers.map(g => `<li><strong>${g.stage}</strong>: ${g.prev} → ${g.curr} <span class="pos">(+${g.diff}، +${g.pct.toFixed(1)}%)</span></li>`).join('')}</ul>` : '<div style="color:#6b7280;font-size:11.5px">لا توجد زيادات ملحوظة</div>'}
            </div>
            <div class="top-card down">
                <h3>📉 أكبر الصفوف انخفاضًا</h3>
                ${topLosers.length ? `<ul>${topLosers.map(g => `<li><strong>${g.stage}</strong>: ${g.prev} → ${g.curr} <span class="neg">(${g.diff}، ${g.pct.toFixed(1)}%)</span></li>`).join('')}</ul>` : '<div style="color:#6b7280;font-size:11.5px">لا توجد انخفاضات ملحوظة</div>'}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🔔 تنبيهات مهمة للإدارة قبل بدء الدراسة</h2>
        ${alerts.map(a => {
            const cls = a.startsWith('✅') ? 'ok' : ((a.startsWith('⚠️') || a.startsWith('📉')) ? 'bad' : '');
            return `<div class="alert-box ${cls}">${a}</div>`;
        }).join('')}
    </div>

    ${(newcomers.length || graduates.length || withdrawn.length || transferredIn.length || transferredOut.length || repeating.length) ? `
    <div class="section">
        <h2>📝 قوائم مرجعية بالأسماء</h2>
        <table>
            <thead><tr><th style="width:25%">الفئة</th><th style="width:8%">العدد</th><th>الأسماء</th></tr></thead>
            <tbody>
                ${newcomers.length ? `<tr><td style="font-weight:700;color:#16a34a">🆕 المستجدون</td><td>${newcomers.length}</td><td class="names-cell">${newcomers.map(s => `${s.name} <span style="color:#9ca3af">(${s.stage})</span>`).join(' · ')}</td></tr>` : ''}
                ${transferredIn.length ? `<tr><td style="font-weight:700;color:#0d9488">🏫 منقولون من مدارس</td><td>${transferredIn.length}</td><td class="names-cell">${transferredIn.map(s => `${s.name} <span style="color:#9ca3af">(${s.stage})</span>`).join(' · ')}</td></tr>` : ''}
                ${graduates.length ? `<tr><td style="font-weight:700;color:#7c3aed">🎓 الخريجون</td><td>${graduates.length}</td><td class="names-cell">${graduates.map(s => `${s.name} <span style="color:#9ca3af">(${s.stage})</span>`).join(' · ')}</td></tr>` : ''}
                ${transferredOut.length ? `<tr><td style="font-weight:700;color:#ea580c">🚪 منتقلون لمدارس أخرى</td><td>${transferredOut.length}</td><td class="names-cell">${transferredOut.map(s => `${s.name} <span style="color:#9ca3af">(${s.stage})</span>`).join(' · ')}</td></tr>` : ''}
                ${withdrawn.length ? `<tr><td style="font-weight:700;color:#dc2626">❌ المنسحبون / ملغى قيدهم</td><td>${withdrawn.length}</td><td class="names-cell">${withdrawn.map(s => `${s.name} <span style="color:#9ca3af">(${s.stage})</span>`).join(' · ')}</td></tr>` : ''}
                ${repeating.length ? `<tr><td style="font-weight:700;color:#b45309">🔁 الراسبون / المعيدون</td><td>${repeating.length}</td><td class="names-cell">${repeating.map(x => `${x.curr.name} <span style="color:#9ca3af">(${x.curr.stage})</span>`).join(' · ')}</td></tr>` : ''}
            </tbody>
        </table>
    </div>` : ''}

    <div class="sig">
        <div>مدير المدرسة</div>
        <div>أمين السر</div>
        <div>تاريخ الإصدار: ${today}</div>
    </div>
</div>
</body></html>`;
            w.document.open();
            w.document.write(html);
            w.document.close();
        }

        function printYearSummary() {
            const passPct  = DB.settings.passPct  || 50;
            const exPct    = DB.settings.exPct    || 90;
            const vgPct    = DB.settings.vgPct    || 80;
            const gPct     = DB.settings.gPct     || 65;
            const accPct   = DB.settings.accPct   || 50;
            const schoolYear = DB.schoolYear || '—';

            // ── حساب نتيجة كل طالب ──
            const promoted   = [];  // ناجح ومنتقل
            const failed     = [];  // راسب يبقى في مرحلته
            const graduated  = [];  // خريج (آخر مرحلة)
            const noGrades   = [];  // بدون درجات

            DB.students.forEach(s => {
                const grandRaw = [1,2,3].map(t => calcTotal(s.id, String(t), s.stage)).reduce((a,b)=>a+b, 0);
                const gMax  = getTermMax(s.stage) * 3;
                const grand = applyMercyGrade(grandRaw, gMax);
                const pct   = gMax > 0 ? grand / gMax * 100 : 0;
                const t1    = calcTotal(s.id, '1', s.stage);
                const t2    = calcTotal(s.id, '2', s.stage);
                const t3    = calcTotal(s.id, '3', s.stage);
                const tMax  = getTermMax(s.stage);
                const stageIdx = STAGES.indexOf(s.stage);
                const obj = { ...s, grand, pct, t1, t2, t3, tMax, gMax, isRepeater: (s.status || '').indexOf('راسب') !== -1 };
                if (grandRaw === 0) { noGrades.push(obj); return; }
                if (pct >= passPct) {
                    if (stageIdx >= 0 && stageIdx < STAGES.length - 1) {
                        promoted.push({ ...obj, to: STAGES[stageIdx + 1] });
                    } else {
                        graduated.push(obj);
                    }
                } else {
                    failed.push(obj);
                }
            });

            const totalStudents = DB.students.length;
            const withGrades    = totalStudents - noGrades.length;

            // ── ألوان التقدير ──
            function gradeColor(p) {
                if (p >= exPct)  return '#15803d';
                if (p >= vgPct)  return '#166534';
                if (p >= gPct)   return '#0c5460';
                if (p >= accPct) return '#856404';
                return '#991b1b';
            }
            function gradeText(p) {
                if (p >= exPct)  return 'ممتاز';
                if (p >= vgPct)  return 'جيد جداً';
                if (p >= gPct)   return 'جيد';
                if (p >= accPct) return 'مقبول';
                return 'راسب';
            }
            function gradeBg(p) {
                if (p >= exPct)  return '#dcfce7';
                if (p >= vgPct)  return '#d1fae5';
                if (p >= gPct)   return '#cffafe';
                if (p >= accPct) return '#fef9c3';
                return '#fee2e2';
            }

            // ── أوائل كل مرحلة (أول 3) ──
            function topInStage(stage) {
                return DB.students
                    .filter(s => s.stage === stage)
                    .map(s => {
                        const grand = applyMercyGrade([1,2,3].map(t => calcTotal(s.id,String(t),s.stage)).reduce((a,b)=>a+b,0), getTermMax(s.stage)*3);
                        const gMax  = getTermMax(s.stage)*3;
                        const pct   = gMax>0 ? grand/gMax*100 : 0;
                        return {...s, grand, pct};
                    })
                    .filter(s => s.grand > 0 && s.pct >= passPct)
                    .sort((a,b) => b.pct - a.pct)
                    .slice(0,3);
            }

            // ══════════════════════════════════════════════════════
            // البنية التعليمية للمدرسة — مرجع ثابت لفهم التدرج
            // ══════════════════════════════════════════════════════
            const SCHOOL_STRUCTURE = [
                {
                    name: 'مرحلة الحضانة',
                    icon: '🌱', color: '#5b21b6', bg: '#f5f3ff', border: '#c4b5fd',
                    stages: ['حضانة'],
                    note: 'مرحلة التمهيدي — لا درجات نجاح/رسوب رسمية'
                },
                {
                    name: 'المرحلة الابتدائية',
                    icon: '📖', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
                    stages: ['أول ابتدائي','ثاني ابتدائي','ثالث ابتدائي','رابع ابتدائي','خامس ابتدائي','سادس ابتدائي'],
                    note: 'الناجح من سادس ابتدائي ينتقل إلى أول إعدادي'
                },
                {
                    name: 'المرحلة الإعدادية',
                    icon: '📚', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7',
                    stages: ['أول إعدادي','ثاني إعدادي','ثالث إعدادي'],
                    note: 'الناجح من ثالث إعدادي ينتقل إلى أول ثانوي'
                },
                {
                    name: 'المرحلة الثانوية',
                    icon: '🎓', color: '#7f1d1d', bg: '#fff1f2', border: '#fecdd3',
                    stages: ['أول ثانوي','ثاني ثانوي','ثالث ثانوي'],
                    note: 'الناجح من ثالث ثانوي يتخرج من المدرسة'
                }
            ];

            // المرحلة الأخيرة الحقيقية (الخريجون)
            const FINAL_STAGE = STAGES[STAGES.length - 1]; // ثالث ثانوي

            // دالة: في أي مرحلة تعليمية يقع هذا الفصل؟
            function getLevelForStage(stage) {
                // أولاً: مطابقة تامة في stages المُعرَّفة
                for (const lvl of SCHOOL_STRUCTURE) {
                    if (lvl.stages.includes(stage)) return lvl;
                }
                // ثانياً: مطابقة بالكلمة الجوهرية (للمراحل المخصصة)
                const s = stage.toLowerCase();
                if (s.includes('حضان') || s.includes('روض') || s.includes('kg') || s.includes('تمهيدي')) return SCHOOL_STRUCTURE[0];
                if (s.includes('ابتدائ') || s.includes('primary')) return SCHOOL_STRUCTURE[1];
                if (s.includes('إعداد') || s.includes('اعداد') || s.includes('prep')) return SCHOOL_STRUCTURE[2];
                if (s.includes('ثانو') || s.includes('secondary')) return SCHOOL_STRUCTURE[3];
                return null;
            }

            // ── تركيبة السنة الجديدة (بعد الترقية) — الخريجون مُستثنون ──
            const newYearCounts = {};
            DB.students.forEach(s => {
                const grand = applyMercyGrade([1,2,3].map(t => calcTotal(s.id,String(t),s.stage)).reduce((a,b)=>a+b,0), getTermMax(s.stage)*3);
                const gMax  = getTermMax(s.stage)*3;
                const pct   = gMax>0 ? grand/gMax*100 : 0;
                const stageIdx = STAGES.indexOf(s.stage);
                // الخريجون (ناجحون من المرحلة الأخيرة) لا يُحسبون في السنة القادمة
                if (grand > 0 && pct >= passPct && stageIdx === STAGES.length - 1) return;
                let nextStage = s.stage;
                if (grand > 0 && pct >= passPct && stageIdx >= 0 && stageIdx < STAGES.length-1) {
                    nextStage = STAGES[stageIdx+1];
                }
                newYearCounts[nextStage] = (newYearCounts[nextStage]||0)+1;
            });

            // ── أداء المواد عبر كل المراحل ──
            const subjPerf = [];
            STAGES.forEach(stage => {
                const students = DB.students.filter(s => s.stage === stage && !isGraduate(s));
                const subjects = DB.subjects[stage] || [];
                if (!students.length || !subjects.length) return;
                subjects.forEach(subj => {
                    let total=0, cnt=0;
                    students.forEach(st => {
                        const grand = [1,2,3].map(t=>calcSubjTotal(st.id,String(t),subj.name)).reduce((a,b)=>a+b,0);
                        const sMax  = getSubjMax(subj.name,stage)*3;
                        if (sMax>0 && grand>0) { total += grand/sMax*100; cnt++; }
                    });
                    if (cnt>0) subjPerf.push({ stage, name:subj.name, avg:total/cnt, cnt });
                });
            });
            subjPerf.sort((a,b)=>b.avg-a.avg);
            const topSubjs    = subjPerf.slice(0,5);
            const bottomSubjs = [...subjPerf].sort((a,b)=>a.avg-b.avg).slice(0,5);

            // ── بناء الـ HTML ──
            const now   = new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'});
            const medals= ['🥇','🥈','🥉'];
            const statusBar = (pct) => {
                const w = Math.round(pct);
                const c = pct >= passPct ? '#16a34a' : '#dc2626';
                return `<div style="background:#e5e7eb;border-radius:99px;height:8px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${w}%;background:${c};border-radius:99px;transition:width .4s"></div></div>`;
            };

            // ── قسم الانتقالات مرتبة حسب المرحلة ──
            const promotedByStage = {};
            promoted.forEach(s => {
                if (!promotedByStage[s.stage]) promotedByStage[s.stage] = [];
                promotedByStage[s.stage].push(s);
            });
            const failedByStage = {};
            failed.forEach(s => {
                if (!failedByStage[s.stage]) failedByStage[s.stage] = [];
                failedByStage[s.stage].push(s);
            });

            // ── جدول الطلاب الناجحين لكل مرحلة — مرتب حسب ترتيب STAGES ──
            let promotedTables = '';
            STAGES.filter(s => promotedByStage[s]).forEach(stage => {
                const list = promotedByStage[stage].sort((a,b)=>b.pct-a.pct);
                promotedTables += `
                <div style="margin-bottom:18px">
                    <div style="background:#0d2645;color:#fff;padding:9px 14px;border-radius:8px 8px 0 0;font-size:13px;font-weight:900;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <span>📘 ${stage}</span>
                        <span style="font-size:11px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px">${list.length} طالب → ${list[0].to}</span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px">
                        <thead><tr style="background:#e8f5e9;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                            <th style="padding:7px 10px;text-align:right;border:1px solid #c8e6c9;color:#1a5c2a">#</th>
                            <th style="padding:7px 10px;text-align:right;border:1px solid #c8e6c9;color:#1a5c2a">اسم الطالب</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">ترم 1</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">ترم 2</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">ترم 3</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">المجموع</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">النسبة</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #c8e6c9;color:#1a5c2a">ينتقل إلى</th>
                        </tr></thead>
                        <tbody>
                            ${list.map((s,i)=>`<tr style="background:${i%2===0?'#fff':'#f0fdf4'};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;color:#666">${i+1}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;font-weight:700">${s.name}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center">${s.t1}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center">${s.t2}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center">${s.t3}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center;font-weight:900">${s.grand}/${s.gMax}</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center;font-weight:900;color:${gradeColor(s.pct)}">${s.pct.toFixed(1)}%</td>
                                <td style="padding:6px 10px;border:1px solid #c8e6c9;text-align:center;font-weight:700;color:#166534">${s.to}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            });

            // ── جدول الراسبين لكل مرحلة — مرتب حسب ترتيب STAGES ──
            let failedTables = '';
            STAGES.filter(s => failedByStage[s]).forEach(stage => {
                const list = failedByStage[stage].sort((a,b)=>a.pct-b.pct);
                failedTables += `
                <div style="margin-bottom:18px">
                    <div style="background:#7f1d1d;color:#fff;padding:9px 14px;border-radius:8px 8px 0 0;font-size:13px;font-weight:900;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <span>📕 ${stage}</span>
                        <span style="font-size:11px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px">${list.length} طالب يبقى في مرحلته</span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px">
                        <thead><tr style="background:#fee2e2;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                            <th style="padding:7px 10px;text-align:right;border:1px solid #fecaca;color:#991b1b">#</th>
                            <th style="padding:7px 10px;text-align:right;border:1px solid #fecaca;color:#991b1b">اسم الطالب</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">ترم 1</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">ترم 2</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">ترم 3</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">المجموع</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">النسبة</th>
                            <th style="padding:7px 10px;text-align:center;border:1px solid #fecaca;color:#991b1b">يبقى في</th>
                        </tr></thead>
                        <tbody>
                            ${list.map((s,i)=>`<tr style="background:${i%2===0?'#fff':'#fff5f5'};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                                <td style="padding:6px 10px;border:1px solid #fecaca;color:#666">${i+1}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;font-weight:700">${s.name}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center">${s.t1}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center">${s.t2}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center">${s.t3}/${s.tMax}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center;font-weight:900">${s.grand}/${s.gMax}</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center;font-weight:900;color:#dc2626">${s.pct.toFixed(1)}%</td>
                                <td style="padding:6px 10px;border:1px solid #fecaca;text-align:center;font-weight:700;color:#dc2626">${s.stage}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            });

            // ── قسم الخريجين ──
            let graduatedSection = '';
            if (graduated.length) {
                graduatedSection = `
                <table style="width:100%;border-collapse:collapse;font-size:12px">
                    <thead><tr style="background:#fef3c7;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:right">#</th>
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:right">اسم الطالب</th>
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:center">المرحلة</th>
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:center">المجموع</th>
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:center">النسبة</th>
                        <th style="padding:7px 10px;border:1px solid #fde68a;text-align:center">التقدير</th>
                    </tr></thead>
                    <tbody>
                        ${graduated.sort((a,b)=>b.pct-a.pct).map((s,i)=>`<tr style="background:${i%2===0?'#fff':'#fffbeb'};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                            <td style="padding:6px 10px;border:1px solid #fde68a">${i+1}</td>
                            <td style="padding:6px 10px;border:1px solid #fde68a;font-weight:700">${s.name}</td>
                            <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center">${s.stage}</td>
                            <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center;font-weight:900">${s.grand}/${s.gMax}</td>
                            <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center;font-weight:900;color:${gradeColor(s.pct)}">${s.pct.toFixed(1)}%</td>
                            <td style="padding:6px 10px;border:1px solid #fde68a;text-align:center;font-weight:700;color:${gradeColor(s.pct)}">${gradeText(s.pct)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
            }

            // ── أوائل المراحل ──
            let topStudentsHTML = '';
            STAGES.forEach(stage => {
                const tops = topInStage(stage);
                if (!tops.length) return;
                topStudentsHTML += `
                <div style="margin-bottom:14px">
                    <div style="background:#1e3a5f;color:#e8c04a;padding:8px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:900;-webkit-print-color-adjust:exact;print-color-adjust:exact">🏅 ${stage}</div>
                    <table style="width:100%;border-collapse:collapse;font-size:12px">
                        <tbody>
                            ${tops.map((s,i)=>`<tr style="background:${['#fffbeb','#f1f5f9','#f9fafb'][i]};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                                <td style="padding:7px 12px;border:1px solid #e2e8f0;font-size:16px">${medals[i]||'#'+(i+1)}</td>
                                <td style="padding:7px 12px;border:1px solid #e2e8f0;font-weight:800">${s.name}</td>
                                <td style="padding:7px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:900;color:${gradeColor(s.pct)}">${s.pct.toFixed(1)}%</td>
                                <td style="padding:7px 12px;border:1px solid #e2e8f0;text-align:center">${s.grand} درجة</td>
                                <td style="padding:7px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:${gradeColor(s.pct)}">${gradeText(s.pct)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            });

            // ── تركيبة السنة الجديدة — مُجمَّعة حسب المراحل التعليمية ──
            // حساب إجمالي الطلاب القادمين (بدون الخريجين)
            const nextYearTotal = Object.values(newYearCounts).reduce((a,b)=>a+b,0);

            // بناء صفوف الجدول: نمر على كل المراحل (حتى الفارغة) مُرتَّبة حسب STAGES
            let newYearRows = '';
            let lastLevel = null;
            let rowIdx = 0;
            STAGES.forEach(stage => {
                const cnt = newYearCounts[stage] || 0;
                const lvl = getLevelForStage(stage);
                const lvlName = lvl ? lvl.name : 'أخرى';
                const lvlColor = lvl ? lvl.color : '#374151';
                const lvlBg    = lvl ? lvl.bg    : '#f9fafb';
                const lvlBrd   = lvl ? lvl.border : '#e5e7eb';

                // رأس المجموعة عند الانتقال لمرحلة تعليمية جديدة
                if (lvlName !== lastLevel) {
                    const lvlStagesInSchool = lvl ? lvl.stages.filter(ls => STAGES.includes(ls)) : [stage];
                    const lvlTotal = lvlStagesInSchool.reduce((a,ls) => a+(newYearCounts[ls]||0),0);
                    newYearRows += `<tr style="background:${lvlBg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                        <td colspan="4" style="padding:7px 14px;border:1px solid ${lvlBrd};font-weight:900;color:${lvlColor};font-size:13px">
                            ${lvl?lvl.icon:'📌'} ${lvlName}
                            <span style="font-size:11px;font-weight:600;opacity:.75;margin-right:8px">— إجمالي ${lvlTotal} طالب</span>
                        </td>
                    </tr>`;
                    lastLevel = lvlName;
                }

                const isEmpty = cnt === 0;
                const barW = nextYearTotal > 0 ? Math.round(cnt/nextYearTotal*100) : 0;
                const pctOfAll = nextYearTotal > 0 ? Math.round(cnt/nextYearTotal*100) : 0;

                newYearRows += `<tr style="background:${isEmpty?'#f9fafb':'#fff'};-webkit-print-color-adjust:exact;print-color-adjust:exact">
                    <td style="padding:6px 14px 6px 28px;border:1px solid #e2e8f0;font-weight:${isEmpty?'400':'700'};color:${isEmpty?'#9ca3af':'#1e293b'}">${stage}${isEmpty?` <span style="font-size:10px;color:#ef4444;font-weight:700">⚠ لا يوجد طلاب</span>`:''}</td>
                    <td style="padding:6px 14px;border:1px solid #e2e8f0;text-align:center;font-size:${isEmpty?'14px':'18px'};font-weight:900;color:${isEmpty?'#9ca3af':'#1d4ed8'}">${isEmpty?'—':cnt}</td>
                    <td style="padding:6px 14px;border:1px solid #e2e8f0">
                        ${isEmpty
                            ? `<span style="font-size:11px;color:#9ca3af;font-style:italic">مرحلة فارغة في السنة القادمة</span>`
                            : `<div style="background:#bfdbfe;border-radius:99px;height:12px;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact"><div style="height:100%;width:${barW}%;background:#2563eb;border-radius:99px;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div></div>`
                        }
                    </td>
                    <td style="padding:6px 14px;border:1px solid #e2e8f0;text-align:center;color:${isEmpty?'#9ca3af':'#4b5563'}">${isEmpty?'—':pctOfAll+'%'}</td>
                </tr>`;
                rowIdx++;
            });

            // صف الخريجين المُستثنَين
            newYearRows += `<tr style="background:#fffbeb;-webkit-print-color-adjust:exact;print-color-adjust:exact">
                <td style="padding:7px 14px;border:1px solid #fde68a;font-weight:700;color:#92400e">🎓 خريجو ${FINAL_STAGE} — تركوا المدرسة</td>
                <td style="padding:7px 14px;border:1px solid #fde68a;text-align:center;font-size:18px;font-weight:900;color:#b45309">${graduated.length}</td>
                <td style="padding:7px 14px;border:1px solid #fde68a"><span style="font-size:11px;color:#92400e;font-style:italic">تخرجوا من المدرسة — لا يُحسبون في السنة القادمة</span></td>
                <td style="padding:7px 14px;border:1px solid #fde68a;text-align:center;color:#92400e">${totalStudents>0?Math.round(graduated.length/totalStudents*100)+'%':'—'}</td>
            </tr>`;

            // ── موادٍ الأعلى أداءً ──
            let subjPerfHTML = '';
            if (topSubjs.length) {
                subjPerfHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:10px">
                    <div>
                        <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:8px">🟢 أعلى أداءً</div>
                        ${topSubjs.map(s=>`<div style="display:flex;justify-content:space-between;padding:5px 10px;background:#f0fdf4;border-radius:7px;margin-bottom:5px;font-size:12px;border:1px solid #bbf7d0">
                            <span><strong>${s.name}</strong> <span style="color:#6b7280;font-size:10px">(${s.stage})</span></span>
                            <span style="font-weight:900;color:#16a34a">${s.avg.toFixed(1)}%</span>
                        </div>`).join('')}
                    </div>
                    <div>
                        <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:8px">🔴 تحتاج اهتمام</div>
                        ${bottomSubjs.map(s=>`<div style="display:flex;justify-content:space-between;padding:5px 10px;background:#fff5f5;border-radius:7px;margin-bottom:5px;font-size:12px;border:1px solid #fecaca">
                            <span><strong>${s.name}</strong> <span style="color:#6b7280;font-size:10px">(${s.stage})</span></span>
                            <span style="font-weight:900;color:#dc2626">${s.avg.toFixed(1)}%</span>
                        </div>`).join('')}
                    </div>
                </div>`;
            }

            // ── تجميع الـ HTML النهائي ──
            const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>ملخص السنة الدراسية ${schoolYear} — مدرسة البابا شنودة</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Cairo',sans-serif;direction:rtl;background:#fff;color:#1a1a1a;font-size:13px}
  .page-wrap{padding:24px 28px;max-width:1000px;margin:0 auto}
  .section{margin-bottom:28px;page-break-inside:avoid}
  .section-title{background:linear-gradient(135deg,#0d2645,#1a3d6e);color:#fff;padding:10px 18px;border-radius:10px 10px 0 0;font-size:14px;font-weight:900;display:flex;align-items:center;gap:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .section-body{border:1.5px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:16px;background:#fff}
  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:0}
  .stat-box{border-radius:10px;padding:14px 12px;text-align:center;border:1.5px solid}
  .stat-label{font-size:11px;font-weight:700;margin-bottom:5px}
  .stat-val{font-size:26px;font-weight:900}
  .stat-sub{font-size:10px;margin-top:3px;opacity:.7}
  h1{font-family:'Amiri',serif;font-size:22px;color:#0d2645;text-align:center;margin-bottom:3px}
  .sub-head{font-size:12px;color:#6b7280;text-align:center;margin-bottom:20px}
  .header-line{border:none;border-top:3px solid #c9a227;margin:12px 0 20px}
  @media print{
    body{padding:0}
    .page-wrap{padding:14px 18px}
    .section{page-break-inside:avoid}
    .no-break{page-break-inside:avoid}
  }
</style>
</head>
<body>
<div class="page-wrap">

  <!-- ── رأس التقرير ── -->
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-family:'Amiri',serif;font-size:13px;color:#9a7a1a;margin-bottom:6px">مدرسة البابا شنودة والأرشيذياكون حبيب جرجس</div>
    <h1>📋 ملخص نهاية السنة الدراسية</h1>
    <div style="font-size:16px;font-weight:900;color:#c9a227;margin:4px 0">${schoolYear}</div>
    <div style="font-size:11px;color:#9ca3af;margin-top:4px">تاريخ الطباعة: ${now}</div>
  </div>
  <hr class="header-line">

  <!-- ── البنية التعليمية للمدرسة ── -->
  <div style="margin-bottom:20px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 18px">
    <div style="font-size:13px;font-weight:900;color:#0d2645;margin-bottom:10px">🏫 البنية التعليمية لمدرسة البابا شنودة</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
      ${SCHOOL_STRUCTURE.map(lvl => {
        const activeStages = lvl.stages.filter(st => STAGES.includes(st));
        const studentCount = activeStages.reduce((a,st)=>a+(DB.students.filter(s=>s.stage===st).length),0);
        const hasNoStudents = studentCount === 0;
        return `<div style="border:1.5px solid ${lvl.border};border-radius:9px;padding:10px 12px;background:${lvl.bg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div style="font-size:16px;margin-bottom:4px">${lvl.icon}</div>
          <div style="font-size:11px;font-weight:900;color:${lvl.color};margin-bottom:5px">${lvl.name}</div>
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px">${activeStages.length > 0 ? activeStages[0]+(activeStages.length>1?' → '+activeStages[activeStages.length-1]:'') : '—'}</div>
          ${hasNoStudents
            ? `<div style="font-size:11px;font-weight:700;color:#ef4444;background:#fee2e2;border-radius:5px;padding:3px 7px;display:inline-block">⚠️ لا يوجد طلاب</div>`
            : `<div style="font-size:11px;font-weight:700;color:${lvl.color}">${studentCount} طالب</div>`
          }
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- ── قسم 1: الإحصاءات العامة ── -->
  <div class="section">
    <div class="section-title">📊 القسم الأول — الإحصاءات العامة</div>
    <div class="section-body">
      <div class="stat-grid">
        <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe">
          <div class="stat-label" style="color:#1d4ed8">👥 إجمالي الطلاب</div>
          <div class="stat-val" style="color:#1d4ed8">${totalStudents}</div>
          <div class="stat-sub">${STAGES.filter(s=>DB.students.some(x=>x.stage===s)).length} مرحلة نشطة</div>
        </div>
        <div class="stat-box" style="background:#f0fdf4;border-color:#86efac">
          <div class="stat-label" style="color:#166534">✅ ناجحون ومنتقلون</div>
          <div class="stat-val" style="color:#166534">${promoted.length}</div>
          <div class="stat-sub">${withGrades>0?((promoted.length/withGrades)*100).toFixed(1):'0'}% من المتقدمين</div>
        </div>
        <div class="stat-box" style="background:#fff5f5;border-color:#fca5a5">
          <div class="stat-label" style="color:#991b1b">⚠️ راسبون</div>
          <div class="stat-val" style="color:#dc2626">${failed.length}</div>
          <div class="stat-sub">${withGrades>0?((failed.length/withGrades)*100).toFixed(1):'0'}% من المتقدمين</div>
        </div>
        <div class="stat-box" style="background:#fffbeb;border-color:#fde68a">
          <div class="stat-label" style="color:#92400e">🎓 خريجون</div>
          <div class="stat-val" style="color:#b45309">${graduated.length}</div>
          <div class="stat-sub">أتمّوا ${FINAL_STAGE}</div>
        </div>
      </div>
      ${noGrades.length ? `<div style="margin-top:12px;padding:10px 14px;background:#f8f8f8;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;color:#6b7280">
        📋 <strong>${noGrades.length} طالب</strong> بدون درجات مرصودة — لن يُطبَّق عليهم أي تغيير في المرحلة
      </div>` : ''}
      <div style="margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px">
        <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">📈 نسبة النجاح الكلية</div>
        <div style="background:#e5e7eb;border-radius:99px;height:16px;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div style="height:100%;width:${withGrades>0?Math.round((promoted.length+graduated.length)/withGrades*100):0}%;background:linear-gradient(90deg,#16a34a,#22c55e);border-radius:99px;-webkit-print-color-adjust:exact;print-color-adjust:exact"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-top:5px">
          <span>0%</span>
          <span style="font-weight:900;color:#16a34a;font-size:14px">${withGrades>0?((promoted.length+graduated.length)/withGrades*100).toFixed(1):0}% نجاح</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── قسم 2: الناجحون والمنتقلون ── -->
  ${promoted.length ? `<div class="section">
    <div class="section-title" style="background:linear-gradient(135deg,#166534,#16a34a);-webkit-print-color-adjust:exact;print-color-adjust:exact">⬆️ القسم الثاني — الناجحون والمنتقلون (${promoted.length} طالب)</div>
    <div class="section-body" style="border-color:#86efac">
      ${promotedTables}
    </div>
  </div>` : ''}

  <!-- ── قسم 3: الراسبون ── -->
  ${failed.length ? `<div class="section">
    <div class="section-title" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);-webkit-print-color-adjust:exact;print-color-adjust:exact">⚠️ القسم الثالث — الراسبون (${failed.length} طالب — يبقون في مرحلتهم)</div>
    <div class="section-body" style="border-color:#fca5a5">
      ${failedTables}
    </div>
  </div>` : ''}

  <!-- ── قسم 4: الخريجون ── -->
  ${graduated.length ? `<div class="section">
    <div class="section-title" style="background:linear-gradient(135deg,#78350f,#d97706);-webkit-print-color-adjust:exact;print-color-adjust:exact">🎓 القسم الرابع — خريجو ${FINAL_STAGE} (${graduated.length} طالب — أتمّوا مسيرتهم في المدرسة)</div>
    <div class="section-body" style="border-color:#fde68a">
      <div style="font-size:12px;color:#92400e;font-weight:700;margin-bottom:10px;padding:8px 12px;background:#fffbeb;border-radius:7px;border:1px solid #fde68a">
        🏫 هؤلاء الطلاب أنهوا <strong>المرحلة الثانوية</strong> وتخرجوا من مدرسة البابا شنودة — لن يُحسبوا ضمن طلاب السنة الجديدة
      </div>
      ${graduatedSection}
    </div>
  </div>` : ''}

  <!-- ── قسم 5: تركيبة السنة الجديدة ── -->
  <div class="section">
    <div class="section-title">🏫 القسم الخامس — تركيبة السنة الجديدة (بعد الترقية)</div>
    <div class="section-body">
      <div style="font-size:12px;color:#6b7280;margin-bottom:10px">توزيع الطلاب على المراحل في السنة الجديدة — بعد تطبيق قرارات النجاح والرسوب · <strong>الخريجون من ${FINAL_STAGE} مُستثنَون</strong></div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#eff6ff;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <th style="padding:8px 14px;border:1px solid #bfdbfe;text-align:right">المرحلة الدراسية</th>
          <th style="padding:8px 14px;border:1px solid #bfdbfe;text-align:center">عدد الطلاب</th>
          <th style="padding:8px 14px;border:1px solid #bfdbfe">التوزيع النسبي</th>
          <th style="padding:8px 14px;border:1px solid #bfdbfe;text-align:center">النسبة</th>
        </tr></thead>
        <tbody>${newYearRows}</tbody>
        <tfoot>
          <tr style="background:#1e3a5f;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            <td style="padding:8px 14px;border:1px solid #1e3a5f;font-weight:900">طلاب السنة الجديدة (بدون خريجين)</td>
            <td style="padding:8px 14px;border:1px solid #1e3a5f;text-align:center;font-weight:900">${nextYearTotal}</td>
            <td style="padding:8px 14px;border:1px solid #1e3a5f"></td>
            <td style="padding:8px 14px;border:1px solid #1e3a5f;text-align:center">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- ── قسم 6: أوائل المراحل ── -->
  ${topStudentsHTML ? `<div class="section">
    <div class="section-title" style="background:linear-gradient(135deg,#1e3a5f,#c9a227);-webkit-print-color-adjust:exact;print-color-adjust:exact">🏆 القسم السادس — أوائل الطلاب في كل مرحلة</div>
    <div class="section-body" style="border-color:#fde68a">
      ${topStudentsHTML}
    </div>
  </div>` : ''}

  <!-- ── قسم 7: أداء المواد ── -->
  ${subjPerfHTML ? `<div class="section">
    <div class="section-title">📚 القسم السابع — تحليل أداء المواد</div>
    <div class="section-body">
      <div style="font-size:12px;color:#6b7280;margin-bottom:6px">متوسط أداء الطلاب في كل مادة عبر كل الترمات</div>
      ${subjPerfHTML}
    </div>
  </div>` : ''}

  <!-- ── توقيع ── -->
  <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;text-align:center">
    <div><div style="border-top:1.5px solid #374151;padding-top:6px;font-size:11px;color:#6b7280">توقيع المدرس</div></div>
    <div style="text-align:center">
      <div style="font-family:'Amiri',serif;font-size:24px;color:#0d2645">✞</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:3px">${now}</div>
    </div>
    <div><div style="border-top:1.5px solid #374151;padding-top:6px;font-size:11px;color:#6b7280">توقيع مدير المدرسة</div></div>
  </div>

</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

            const w = window.open('', '_blank');
            w.document.write(html);
            w.document.close();
        }
    