
        // ══════════════════════════════════════════════
        // GLOBAL SEARCH
        // ══════════════════════════════════════════════
        let _gsHighlight = -1;

        function openGlobalSearch() {
            document.getElementById('global-search-overlay').style.display = 'flex';
            const inp = document.getElementById('gs-input');
            inp.value = ''; _gsHighlight = -1;
            renderGlobalSearch();
            setTimeout(() => inp.focus(), 60);
        }
        function closeGlobalSearch() {
            document.getElementById('global-search-overlay').style.display = 'none';
        }
        function renderGlobalSearch() {
            const q = (document.getElementById('gs-input').value || '').trim().toLowerCase();
            const el = document.getElementById('gs-results');
            _gsHighlight = -1;
            if (!DB || !DB.students.length) {
                el.innerHTML = '<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">لا توجد بيانات بعد</div>'; return;
            }
            let list = DB.students;
            if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || (s.stage || '').includes(q) || (s.phone || '').includes(q));
            else list = list.slice(0, 14);
            if (!list.length) {
                el.innerHTML = `<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">🔍 لا نتائج لـ "${q}"</div>`; return;
            }
            el.innerHTML = list.slice(0, 18).map((s, i) => {
                const grandRaw = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
                const gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw, gMax), pct = gMax > 0 ? grand / gMax * 100 : 0;
                const gc = getGradeColor(pct);
                const absCount = _spGetAbsTotal(s);
                const absTag = absCount >= 5 ? `<span style="background:#fde8e8;color:#c0392b;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;margin-right:4px">غياب ${absCount}×</span>` :
                    absCount >= 2 ? `<span style="background:#fff3cd;color:#856404;border-radius:10px;padding:1px 7px;font-size:10px;font-weight:700;margin-right:4px">غياب ${absCount}×</span>` : '';
                return `<div class="gs-item" data-idx="${i}" data-sid="${s.id}"
      onclick="openSP('${s.id}');closeGlobalSearch()"
      style="display:flex;align-items:center;gap:12px;padding:11px 20px;cursor:pointer;border-bottom:1px solid var(--bg);transition:background .1s">
      <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy-light));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;overflow:hidden">
        ${s.photo ? `<img src="${s.photo}" style="width:38px;height:38px;object-fit:cover;border-radius:50%">` : '👤'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px;color:var(--navy)">${s.name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px">${s.stage} ${absTag}</div>
      </div>
      ${grand > 0 ? `<div style="text-align:left;flex-shrink:0">
        <div style="font-weight:900;font-size:15px;color:${gc}">${pct.toFixed(0)}%</div>
        <div style="font-size:10px;color:var(--muted)">${getGradeText(pct)}</div>
      </div>`: ''}<span style="color:var(--border);font-size:18px">›</span></div>`;
            }).join('') + (list.length > 18 ? `<div style="padding:10px 20px;text-align:center;font-size:11px;color:var(--muted)">+ ${list.length - 18} نتيجة — اكتب أكثر للتضييق</div>` : '');
        }
        function _gsSetHL(i) {
            _gsHighlight = i;
            document.querySelectorAll('.gs-item').forEach((el, j) => {
                el.classList.toggle('gs-active', j === i);
            });
        }
        function handleGSKey(e) {
            const items = document.querySelectorAll('.gs-item');
            if (e.key === 'ArrowDown') { e.preventDefault(); _gsSetHL(Math.min(_gsHighlight + 1, items.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); _gsSetHL(Math.max(_gsHighlight - 1, 0)); }
            else if (e.key === 'Enter' && _gsHighlight >= 0) { const it = items[_gsHighlight]; if (it) { openSP(it.dataset.sid); closeGlobalSearch(); } }
            else if (e.key === 'Escape') { closeGlobalSearch(); }
        }
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (document.getElementById('app').style.display !== 'none') openGlobalSearch();
            }
        });

        // ══════════════════════════════════════════════
        // STUDENT PROFILE (بطاقة الطالب)
        // ══════════════════════════════════════════════
        let _spSt = null;

        function openSP(sid) {
            const s = DB.students.find(x => x.id == sid); if (!s) return;
            _spSt = s;
            // Header
            const av = document.getElementById('sp-avatar');
            av.innerHTML = s.photo ? `<img src="${s.photo}" style="width:62px;height:62px;object-fit:cover">` : '👤';
            document.getElementById('sp-name').textContent = s.name;
            const age = s.dob ? Math.floor((new Date() - new Date(s.dob)) / 31557600000) : null;
            document.getElementById('sp-meta').innerHTML =
                `<span>🏫 ${s.stage}</span> &nbsp;•&nbsp; <span>📅 ${DB.schoolYear}</span>` +
                (age ? ` &nbsp;•&nbsp; <span>🎂 ${age} سنة</span>` : '') +
                (s.phone ? ` &nbsp;•&nbsp; <span>📞 ${s.phone}</span>` : '');
            // Rank badge
            const ranked = getTopStudents(s.stage, 0).map((x, i) => ({ ...x, rank: i + 1 }));
            const myRank = ranked.find(x => x.id === s.id);
            const rb = document.getElementById('sp-rank-badge');
            if (myRank) {
                const medal = myRank.rank === 1 ? '🥇' : myRank.rank === 2 ? '🥈' : myRank.rank === 3 ? '🥉' : '';
                rb.innerHTML = `<div style="background:rgba(255,255,255,.12);border:1px solid rgba(201,162,39,.45);border-radius:12px;padding:8px 16px;text-align:center;flex-shrink:0">
      <div style="font-size:24px;line-height:1">${medal || '#' + myRank.rank}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:3px">في المرحلة</div>
      <div style="font-size:15px;font-weight:900;color:#ffd700">${myRank.pct.toFixed(1)}%</div>
    </div>`;
            } else rb.innerHTML = '';
            // Alert strip
            const alerts = [];
            const grandRaw = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
            const gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw, gMax), pct = gMax > 0 ? grand / gMax * 100 : 0;
            if (grandRaw > 0 && pct < (DB.settings.passPct || 50)) alerts.push(`❌ مجموع الطالب ${pct.toFixed(1)}% — أقل من نسبة النجاح`);
            if ((s.status || '').indexOf('راسب') !== -1) alerts.push('🔄 طالب معيد — رسب العام الماضي');
            if (getMercyInfo(grandRaw, gMax)) alerts.push(`🎯 تم تطبيق درجة رأفة (+${getMercyInfo(grandRaw, gMax).added})`);
            const absT = _spGetAbsTotal(s);
            if (absT >= 5) alerts.push(`⚠️ غاب ${absT} حصة هذا العام`);
            const strip = document.getElementById('sp-alert-strip');
            if (alerts.length) {
                strip.innerHTML = `<div style="background:#fff3cd;border-bottom:2px solid #ffc107;padding:9px 20px;font-size:12px;font-weight:700;color:#856404;display:flex;gap:16px;flex-wrap:wrap">${alerts.map(a => `<span>${a}</span>`).join('')}</div>`;
            } else strip.innerHTML = '';
            // Update notes tab badge
            const nc2 = spGetNotesCount(s.id);
            const nt = document.getElementById('sp-tab-notes');
            if (nt) nt.innerHTML = '📝 ملاحظات' + (nc2 ? ` <span style="background:#1e40af;color:#fff;border-radius:20px;padding:0 6px;font-size:10px">${nc2}</span>` : '');
            switchSPTab('grades');
            openModal('modal-sp');
        }

        function switchSPTab(tab) {
            document.querySelectorAll('.sp-tab').forEach(b => b.classList.remove('sp-tab-active'));
            const t = document.getElementById('sp-tab-' + tab); if (t) t.classList.add('sp-tab-active');
            const body = document.getElementById('sp-body');
            if (!_spSt) return;
            if (tab === 'grades') body.innerHTML = _spGrades(_spSt);
            if (tab === 'absence') body.innerHTML = _spAbsence(_spSt);
            if (tab === 'compare') body.innerHTML = _spCompare(_spSt);
            if (tab === 'info') body.innerHTML = _spInfo(_spSt);
            if (tab === 'notes') body.innerHTML = _spNotes(_spSt);
        }

        function _spGrades(s) {
            const subjs = DB.subjects[s.stage] || [];
            if (!subjs.length) return '<div style="padding:30px;text-align:center;color:var(--muted)">لا توجد مواد لهذه المرحلة</div>';
            let h = '';
            [1, 2, 3].forEach(term => {
                const rawTotal = calcTotal(s.id, String(term), s.stage), max = getTermMax(s.stage), total = applyMercyGrade(rawTotal, max), pct = max > 0 ? total / max * 100 : 0;
                const _mInfo = getMercyInfo(rawTotal, max);
                h += `<div style="margin-bottom:20px">
      <div class="sp-term-hdr">
        <span>الترم ${['الأول', 'الثاني', 'الثالث'][term - 1]}</span>
        <span style="opacity:.75;font-size:12px">${total} / ${max}${_mInfo ? ' <span style="color:#d97706;font-size:10px">🎯+' + _mInfo.added + '</span>' : ''}</span>
        <span class="badge ${getGradeClass(pct)}" style="font-size:11px">${getGradeText(pct)} — ${pct.toFixed(1)}%</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">
        ${subjs.map(sj => {
                    const t = calcSubjTotal(s.id, String(term), sj.name), m = getSubjMax(sj.name, s.stage), sp = m > 0 ? t / m * 100 : 0;
                    const col = getGradeColor(sp);
                    return `<div class="sp-subj-card">
            <div style="position:absolute;bottom:0;left:0;right:0;height:${sp.toFixed(0)}%;background:${col};opacity:.08;pointer-events:none"></div>
            <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:5px">${sj.name}</div>
            <div style="font-size:22px;font-weight:900;color:${col}">${t}</div>
            <div style="font-size:10px;color:var(--muted)">من ${m}</div>
            <div style="font-size:11px;font-weight:700;color:${col};margin-top:2px">${sp.toFixed(0)}%</div>
          </div>`;
                }).join('')}
      </div>
    </div>`;
            });
            const grandRaw2 = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
            const gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw2, gMax), gPct = gMax > 0 ? grand / gMax * 100 : 0;
            const _gMercy = getMercyInfo(grandRaw2, gMax);
            h += `<div style="background:linear-gradient(135deg,var(--navy),var(--navy-light));border-radius:14px;padding:18px 20px;text-align:center;color:#fff;margin-top:4px">
    <div style="font-size:11px;opacity:.65;margin-bottom:6px">المجموع الكلي للعام الدراسي</div>
    <div style="font-size:40px;font-weight:900;color:#ffd700;line-height:1">${grand}</div>
    <div style="opacity:.65;margin:4px 0">من ${gMax} درجة${_gMercy ? ' <span style="font-size:12px;color:#fbbf24">🎯 رأفة +' + _gMercy.added + '</span>' : ''}</div>
    <div style="font-size:15px;font-weight:700;color:#ffd700">${getGradeText(gPct)} — ${gPct.toFixed(2)}%</div>
  </div>`;
            return h;
        }

        function _spAbsence(s) {
            const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
            const mNames = { 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر' };
            const subjs = (DB.subjects[s.stage] || []).map(x => x.name);
            let totAbs = 0, totSess = 0;
            const rows = months.map(m => {
                const sessions = getSessionCount(m);
                let abs = subjs.reduce((a, sj) => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= sessions; w++)if (d[w]) a++; return a; }, 0);
                const maxM = subjs.length * sessions;
                totAbs += abs; totSess += maxM;
                const pct = maxM > 0 ? abs / maxM * 100 : 0;
                const col = pct >= (DB.settings.absMaxPct || 60) ? '#c0392b' : pct >= (DB.settings.absWarnPct || 33) ? '#e67e22' : '#27ae60';
                return `<div style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--bg)">
      <div style="min-width:62px;font-size:12px;font-weight:700;color:var(--navy)">${mNames[m]}</div>
      <div style="flex:1;background:var(--bg);border-radius:5px;height:10px;overflow:hidden">
        <div style="background:${col};height:100%;width:${maxM > 0 ? pct.toFixed(0) : 0}%;border-radius:5px;transition:width .5s"></div>
      </div>
      <div style="min-width:56px;text-align:center;font-size:12px;font-weight:700;color:${col}">${abs}/${maxM}</div>
      <span style="font-size:14px">${abs === 0 ? '✅' : '❌'}</span>
    </div>`;
            }).join('');
            const totalPct = totSess > 0 ? totAbs / totSess * 100 : 0;
            const sc = totalPct >= (DB.settings.absMaxPct || 60) ? '#c0392b' : totalPct >= (DB.settings.absWarnPct || 33) ? '#e67e22' : '#27ae60';
            return `<div style="display:grid;gap:12px;margin-bottom:20px" class="resp-3col-grid">
    <div style="background:${sc}18;border:2px solid ${sc};border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:28px;font-weight:900;color:${sc}">${totAbs}</div><div style="font-size:11px;color:var(--muted)">حصص غياب</div>
    </div>
    <div style="background:#e8f5e918;border:2px solid #27ae60;border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:28px;font-weight:900;color:#27ae60">${totSess - totAbs}</div><div style="font-size:11px;color:var(--muted)">حصور</div>
    </div>
    <div style="background:${sc}18;border:2px solid ${sc};border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:28px;font-weight:900;color:${sc}">${totalPct.toFixed(1)}%</div><div style="font-size:11px;color:var(--muted)">نسبة الغياب</div>
    </div>
  </div>
  <div style="font-weight:700;font-size:12px;color:var(--muted);margin-bottom:8px">التفاصيل الشهرية</div>${rows}`;
        }

        function _spCompare(s) {
            const subjs = DB.subjects[s.stage] || [];
            const TL = ['الأول', 'الثاني', 'الثالث'], TC = ['#0d2645', '#1a7a38', '#7a1a1a'];
            const terms = [1, 2, 3].map(t => { const rawTot = calcTotal(s.id, String(t), s.stage), mx = getTermMax(s.stage), tot = applyMercyGrade(rawTot, mx); return { tot, mx, pct: mx > 0 ? tot / mx * 100 : 0 }; });
            const maxPct = Math.max(...terms.map(x => x.pct), 1);
            let h = `<div style="margin-bottom:22px">
    <div style="font-weight:700;font-size:12px;color:var(--muted);margin-bottom:10px">📊 مقارنة الترمات</div>
    <div style="display:flex;align-items:flex-end;gap:16px;height:130px;padding:0 8px;position:relative">
      <div style="position:absolute;top:0;left:0;right:0;border-top:1px dashed #ddd;font-size:9px;color:var(--muted);padding-right:4px">${maxPct.toFixed(0)}%</div>
      ${terms.map((t, i) => {
                const h2 = maxPct > 0 ? Math.round(t.pct / maxPct * 100) : 0;
                const trend = i > 0 ? (t.pct > terms[i - 1].pct ? '▲' : '▼') : '';
                const tc = trend === '▲' ? '#27ae60' : trend === '▼' ? '#c0392b' : '';
                return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px">
          <div style="font-size:12px;font-weight:700;color:${TC[i]}">${t.pct.toFixed(1)}%${trend ? ` <span style="color:${tc}">${trend}</span>` : ''}</div>
          <div style="width:100%;background:${TC[i]};border-radius:8px 8px 0 0;height:${h2}%;min-height:8px;transition:height .6s"></div>
          <div style="font-size:11px;color:var(--muted)">ترم ${TL[i]}</div>
        </div>`;
            }).join('')}
    </div>
  </div>`;
            if (subjs.length) {
                h += `<div style="font-weight:700;font-size:12px;color:var(--muted);margin-bottom:10px">مقارنة المواد عبر الترمات</div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border)">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:linear-gradient(135deg,var(--navy),var(--navy-light));color:#fff">
        <th style="padding:8px 12px;text-align:right;white-space:nowrap">المادة</th>
        ${TL.map(l => `<th style="padding:8px;text-align:center;white-space:nowrap">الترم ${l}</th>`).join('')}
        <th style="padding:8px;text-align:center">الأفضل</th>
      </tr></thead><tbody>
      ${subjs.map(sj => {
                    const scores = [1, 2, 3].map(t => calcSubjTotal(s.id, String(t), sj.name));
                    const mx = getSubjMax(sj.name, s.stage), best = Math.max(...scores);
                    return `<tr style="border-bottom:1px solid var(--bg)">
          <td style="padding:8px 12px;font-weight:700;white-space:nowrap">${sj.name}</td>
          ${scores.map((sc, i) => {
                        const pct = mx > 0 ? sc / mx * 100 : 0, col = getGradeColor(pct);
                        const isBest = sc === best && sc > 0;
                        return `<td style="padding:8px;text-align:center;font-weight:700;color:${col};background:${isBest ? col + '15' : ''}">${sc}<span style="font-size:9px;color:var(--muted)">/${mx}</span></td>`;
                    }).join('')}
          <td style="padding:8px;text-align:center"><span style="background:#e8f5e9;color:#155724;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700">ترم ${scores.indexOf(best) + 1}</span></td>
        </tr>`;
                }).join('')}
    </tbody></table></div>`;
            }
            return h;
        }

        function _spInfo(s) {
            const f = [
                { l: 'الاسم الكامل', v: s.name }, { l: 'المرحلة', v: s.stage }, { l: 'النوع', v: (s.gender || '—') + (s.deacon ? ' — ✝️ شماس' : '') },
                { l: 'تاريخ الميلاد', v: s.dob || '—' }, { l: 'الموبايل', v: s.phone || '—' }, { l: 'موبايل آخر', v: s.phone2 || '—' },
                { l: 'العنوان', v: s.address || '—' }, { l: 'أب الاعتراف', v: s.father || '—' }, { l: 'الحالة', v: s.status || '—' },
                { l: 'العام', v: s.year || DB.schoolYear }, { l: 'المبلغ المدفوع', v: s.paid ? (s.paid + ' جنيه') : '—' }, { l: 'كود الطالب', v: s.code || s.id },
            ];
            return `<div class="fgrid">${f.map(x => `<div style="background:var(--bg);border-radius:10px;padding:11px 14px">
    <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:4px">${x.l}</div>
    <div style="font-size:13px;font-weight:700;color:var(--navy)">${x.v}</div>
  </div>`).join('')}</div>
  <div style="margin-top:16px;padding-top:14px;border-top:2px solid var(--bg);display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn-gold btn-sm" onclick="closeModal('modal-sp');editStudent('${s.id}')">✏️ تعديل البيانات</button>
    <button class="btn btn-outline btn-sm allow-ro" onclick="switchSPTab('notes')">📝 ملاحظات الطالب</button>
  </div>`;
        }


        function _escHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

        function _spNotes(s) {
            if (!DB.notes) DB.notes = {};
            const ro = !IS_EDIT_MODE;
            const terms = [
                { num: 1, label: 'الترم الأول', bg: '#0d2645' },
                { num: 2, label: 'الترم الثاني', bg: '#1a5c2a' },
                { num: 3, label: 'الترم الثالث', bg: '#7a1a1a' }
            ];
            let h = '<div style="display:flex;flex-direction:column;gap:14px">';
            if (ro) {
                h += '<div style="background:#fff8e1;border:1px solid #ffc107;border-radius:10px;padding:10px 14px;font-size:12px;color:#856404;font-weight:700">🔒 وضع العرض فقط — سجّل دخولك لإضافة أو تعديل الملاحظات</div>';
            }
            terms.forEach(t => {
                const key = s.id + '_term_' + t.num;
                const note = DB.notes[key] || '';
                const hasNote = note.trim().length > 0;
                h += '<div style="background:var(--card);border:1.5px solid ' + t.bg + '30;border-radius:12px;overflow:hidden">'
                    + '<div style="background:linear-gradient(135deg,' + t.bg + ',' + t.bg + 'dd);padding:9px 16px;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:space-between">'
                    + '<span>📝 ' + t.label + '</span>'
                    + '<span id="sp-note-saved-' + t.num + '" style="font-size:11px;opacity:.85">' + (hasNote ? '✏️ يوجد ملاحظة' : '') + '</span>'
                    + '</div>'
                    + '<div style="padding:12px">'
                    + '<textarea id="sp-note-term-' + t.num + '" rows="3"'
                    + ' placeholder="' + (ro ? 'لا توجد ملاحظات' : 'اكتب ملاحظاتك في ' + t.label + ' (سلوك، أداء، متابعة...)') + '"'
                    + ' style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:13px;resize:vertical;outline:none;background:#fff;color:var(--text);transition:border-color .2s;line-height:1.9;direction:rtl"'
                    + (ro ? ' readonly' : '')
                    + ' onfocus="if(!this.readOnly)this.style.borderColor=\'var(--gold)\'"'
                    + ' onblur="this.style.borderColor=\'var(--border)\';spAutoSaveNote(\'' + s.id + '\',' + t.num + ')"'
                    + ' oninput="clearTimeout(this._t2);this._t2=setTimeout(()=>spAutoSaveNote(\'' + s.id + '\',' + t.num + '),1000)"'
                    + '>' + _escHtml(note) + '</textarea>'
                    + '</div></div>';
            });
            const genKey = s.id + '_general';
            const genNote = DB.notes[genKey] || '';
            const hasGen = genNote.trim().length > 0;
            h += '<div style="background:var(--card);border:1.5px solid var(--gold-dark)40;border-radius:12px;overflow:hidden">'
                + '<div style="background:linear-gradient(135deg,var(--gold-dark),var(--gold));padding:9px 16px;color:var(--navy);font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:space-between">'
                + '<span>📌 ملاحظات عامة</span>'
                + '<span id="sp-note-saved-general" style="font-size:11px;opacity:.85">' + (hasGen ? '✏️ يوجد ملاحظة' : '') + '</span>'
                + '</div>'
                + '<div style="padding:12px">'
                + '<textarea id="sp-note-general" rows="3"'
                + ' placeholder="' + (ro ? 'لا توجد ملاحظات عامة' : 'ملاحظات دائمة عن الطالب (سلوكية، توصيات للمعلم التالي...)') + '"'
                + ' style="width:100%;padding:10px 12px;border:2px solid var(--border);border-radius:8px;font-family:\'Cairo\',sans-serif;font-size:13px;resize:vertical;outline:none;background:#fff;color:var(--text);transition:border-color .2s;line-height:1.9;direction:rtl"'
                + (ro ? ' readonly' : '')
                + ' onfocus="if(!this.readOnly)this.style.borderColor=\'var(--gold)\'"'
                + ' onblur="this.style.borderColor=\'var(--border)\';spAutoSaveNote(\'' + s.id + '\',\'general\')"'
                + ' oninput="clearTimeout(this._t2);this._t2=setTimeout(()=>spAutoSaveNote(\'' + s.id + '\',\'general\'),1000)"'
                + '>' + _escHtml(genNote) + '</textarea>'
                + '</div></div>';
            if (!ro) {
                const tc = [1, 2, 3].filter(n => DB.notes[s.id + '_term_' + n] && DB.notes[s.id + '_term_' + n].trim()).length + (genNote ? 1 : 0);
                h += '<div style="font-size:11px;color:var(--muted);text-align:center;padding:4px">💡 الملاحظات تُحفظ تلقائياً أثناء الكتابة' + (tc ? ' · <strong>' + tc + ' ملاحظة مسجلة</strong>' : '') + '</div>';
            }
            h += '</div>';
            return h;
        }

        function spAutoSaveNote(sid, termOrGeneral) {
            if (!IS_EDIT_MODE) return;
            if (!DB.notes) DB.notes = {};
            const isGen = termOrGeneral === 'general';
            const key = isGen ? sid + '_general' : sid + '_term_' + termOrGeneral;
            const elId = isGen ? 'sp-note-general' : 'sp-note-term-' + termOrGeneral;
            const savedId = isGen ? 'sp-note-saved-general' : 'sp-note-saved-' + termOrGeneral;
            const el = document.getElementById(elId); if (!el) return;
            const val = el.value.trim();
            if (val) DB.notes[key] = val; else delete DB.notes[key];
            saveDB();
            const sv = document.getElementById(savedId);
            if (sv) { sv.textContent = '✅ حُفظ'; setTimeout(() => { if (sv) sv.textContent = val ? '✏️ يوجد ملاحظة' : ''; }, 2000); }
        }

        function openSPNotes(sid) { openSP(sid); setTimeout(() => switchSPTab('notes'), 150); }

        function spGetNotesCount(sid) {
            if (!DB.notes) return 0;
            return [1, 2, 3].filter(n => DB.notes[sid + '_term_' + n] && DB.notes[sid + '_term_' + n].trim()).length
                + (DB.notes[sid + '_general'] && DB.notes[sid + '_general'].trim() ? 1 : 0);
        }


        function _spGetAbsTotal(s) {
            const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
            const subjs = (DB.subjects[s.stage] || []).map(x => x.name);
            let t = 0;
            months.forEach(m => {
                const se = getSessionCount(m);
                subjs.forEach(sj => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= se; w++)if (d[w]) t++; });
            });
            return t;
        }

        function spGoToExams() {
            if (!_spSt) return;
            closeModal('modal-sp');
            navigate('exams');
            setTimeout(() => {
                const el = document.getElementById('exam-stage-sel');
                if (el) { el.value = _spSt.stage; renderExamsTable(); }
                setTimeout(() => {
                    [...document.querySelectorAll('#exams-tbody tr')].forEach(r => {
                        if (r.textContent.includes(_spSt.name)) {
                            r.style.outline = '3px solid var(--gold)'; r.style.outlineOffset = '2px';
                            r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => r.style.outline = '', 2500);
                        }
                    });
                }, 350);
            }, 120);
        }

        function spPrintReport() {
            if (!_spSt) return;
            const s = _spSt, subjs = DB.subjects[s.stage] || [];
            const CSS = `<style>body{font-family:'Cairo',sans-serif;direction:rtl;padding:24px;color:#1a1205;font-size:12px}h2{color:#0d2645;margin:0 0 4px}h3{color:#0d2645;margin:18px 0 8px;font-size:13px;border-bottom:2px solid #eee;padding-bottom:4px}table{width:100%;border-collapse:collapse}th{background:#0d2645;color:#fff;padding:7px 10px;font-size:11px}td{padding:6px 10px;border-bottom:1px solid #eee}.badge{border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700}.gr{color:#155724;background:#d4edda}.gw{color:#856404;background:#fff3cd}.gd{color:#721c24;background:#f8d7da}</style>`;
            const terms = [1, 2, 3];
            let html = CSS + `<h2>${s.name}</h2><p style="color:#888;margin:0 0 16px">${s.stage} — ${DB.schoolYear}${s.phone ? ' — 📞 ' + s.phone : ''}</p>`;
            html += `<h3>الدرجات</h3><table><thead><tr><th>المادة</th>${terms.map(t => `<th>الترم ${['الأول', 'الثاني', 'الثالث'][t - 1]}</th>`).join('')}<th>المجموع</th></tr></thead><tbody>`;
            subjs.forEach(sj => {
                const scores = terms.map(t => calcSubjTotal(s.id, String(t), sj.name));
                const mx = getSubjMax(sj.name, s.stage);
                html += `<tr><td>${sj.name}</td>${scores.map(sc => `<td style="text-align:center;font-weight:700">${sc}/${mx}</td>`).join('')}<td style="text-align:center;font-weight:900">${scores.reduce((a, b) => a + b, 0)}/${mx * 3}</td></tr>`;
            });
            const tots = terms.map(t => calcTotal(s.id, String(t), s.stage));
            const grandRaw = tots.reduce((a, b) => a + b, 0), gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw, gMax), pct = gMax > 0 ? grand / gMax * 100 : 0;
            html += `<tr style="background:#f5f5f5;font-weight:900"><td>المجموع</td>${tots.map(t => `<td style="text-align:center">${t}/${getTermMax(s.stage)}</td>`).join('')}<td style="text-align:center">${grand}/${gMax} — <span class="${pct >= (DB.settings.vgPct || 80) ? 'gr' : pct >= (DB.settings.passPct || 50) ? 'gw' : 'gd'}">${pct.toFixed(1)}%</span></td></tr></tbody></table>`;
            // Absence summary
            const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
            const mNames = { 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر' };
            const absSubjs = (DB.subjects[s.stage] || []).map(x => x.name);
            let totAbs = 0;
            const absRows = months.map(m => {
                const se = getSessionCount(m);
                let ab = absSubjs.reduce((a, sj) => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= se; w++)if (d[w]) a++; return a; }, 0);
                const mx = absSubjs.length * se;
                totAbs += ab;
                return `<tr><td>${mNames[m]}</td><td style="text-align:center">${ab}</td><td style="text-align:center">${mx}</td><td style="text-align:center;font-weight:700">${mx > 0 ? (ab / mx * 100).toFixed(0) + '%' : '—'}</td></tr>`;
            }).join('');
            html += `<h3>سجل الغياب (إجمالي: ${totAbs} حصة)</h3><table><thead><tr><th>الشهر</th><th>غياب</th><th>إجمالي الحصص</th><th>النسبة</th></tr></thead><tbody>${absRows}</tbody></table>`;
            // Add notes section to print report
            const notes = DB.notes || {};
            const termNotes = [1, 2, 3].map(t => ({ t, n: notes[s.id + '_term_' + t] || '' })).filter(x => x.n);
            const genN = notes[s.id + '_general'] || '';
            if (termNotes.length || genN) {
                html += '<h3>الملاحظات</h3>';
                if (genN) html += '<p style="background:#fffbe6;border-right:3px solid #f0c040;padding:8px 12px;border-radius:4px;margin-bottom:8px"><strong>ملاحظات عامة:</strong> ' + genN + '</p>';
                termNotes.forEach(x => { const tl = ['الأول', 'الثاني', 'الثالث'][x.t - 1]; html += '<p style="background:#f8f8ff;border-right:3px solid #6366f1;padding:8px 12px;border-radius:4px;margin-bottom:6px"><strong>الترم ' + tl + ':</strong> ' + x.n + '</p>'; });
            }
            setPrint(html, `تقرير_${s.name}`);
        }

        // ══════════════════════════════════════════════
        // WHATSAPP MESSAGES
        // ══════════════════════════════════════════════
        let _waSt = null;
        let _waType = 'grades';

        function openWA(sid) {
            const s = DB.students.find(x => x.id == sid); if (!s) return;
            _waSt = s; _waType = 'grades';
            // ضبط رقم الهاتف
            const ph = s.phone || s.phone2 || '';
            document.getElementById('wa-phone-input').value = ph;
            document.getElementById('wa-phone-display').textContent = s.name + (ph ? ' — 📞 ' + ph : '');
            document.getElementById('wa-title').textContent = 'رسالة لولي أمر: ' + s.name;
            // الترم الحالي
            const termSel = document.getElementById('wa-term-sel');
            if (termSel) termSel.value = '1';
            waSetType('grades');
            openModal('modal-whatsapp');
        }

        function waSetType(type) {
            _waType = type;
            const tabs = ['grades', 'absence', 'cert', 'custom'];
            tabs.forEach(t => {
                const btn = document.getElementById('wa-tab-' + t); if (!btn) return;
                const active = t === type;
                btn.style.background = active ? 'linear-gradient(135deg,#075e54,#128c7e)' : 'var(--bg)';
                btn.style.color = active ? '#fff' : 'var(--navy)';
            });
            waRefreshMsg();
        }

        function waRefreshMsg() {
            if (!_waSt) return;
            const s = _waSt;
            const term = (document.getElementById('wa-term-sel') || { value: '1' }).value;
            const school = DB.settings.schoolShort || 'مدرسة البابا شنودة';
            const year = DB.schoolYear || '';
            const tNames = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث', all: 'السنوي' };
            const tLabel = tNames[term] || '';
            let msg = '';

            if (_waType === 'grades') {
                const subjs = DB.subjects[s.stage] || [];
                let gradesLines = '';
                if (term === 'all') {
                    subjs.forEach(sj => {
                        const tots = [1, 2, 3].map(t => calcSubjTotal(s.id, String(t), sj.name));
                        const grand = tots.reduce((a, b) => a + b, 0);
                        const mx = getSubjMax(sj.name, s.stage) * 3;
                        if (grand > 0) gradesLines += `• ${sj.name}: ${grand}/${mx}\n`;
                    });
                    const rawTotal = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
                    const gMax = getTermMax(s.stage) * 3;
                    const total = applyMercyGrade(rawTotal, gMax);
                    const pct = gMax > 0 ? total / gMax * 100 : 0;
                    const grade = getGradeText(pct);
                    msg = `باسم الآب والابن والروح القدس الإله الواحد، آمين.\n\n`;
                    msg += `ولي أمر الابن/الابنة المبارك/ة\n`;
                    msg += `✨ ${s.name}\n\n`;
                    msg += `تحية مباركة من ${school} 🎵\n\n`;
                    msg += `📊 نتيجة العام الدراسي ${year}:\n`;
                    msg += `━━━━━━━━━━━━━━━\n`;
                    msg += gradesLines;
                    msg += `━━━━━━━━━━━━━━━\n`;
                    msg += `📌 المجموع الكلي: ${total}/${gMax}\n`;
                    msg += `📈 النسبة: ${pct.toFixed(1)}%\n`;
                    msg += `🏅 التقدير: ${grade}\n\n`;
                    msg += `نشكر تعاونكم ومتابعتكم ونصلي من أجل ابنكم/ابنتكم 🙏\n`;
                    msg += `مع تحياتنا\nإدارة ${school} ✞`;
                } else {
                    subjs.forEach(sj => {
                        const tot = calcSubjTotal(s.id, String(term), sj.name);
                        const mx = getSubjMax(sj.name, s.stage);
                        if (tot > 0) gradesLines += `• ${sj.name}: ${tot}/${mx}\n`;
                    });
                    const rawTotal2 = calcTotal(s.id, String(term), s.stage);
                    const max = getTermMax(s.stage);
                    const total = applyMercyGrade(rawTotal2, max);
                    const pct = max > 0 ? total / max * 100 : 0;
                    const grade = getGradeText(pct);
                    msg = `باسم الآب والابن والروح القدس الإله الواحد، آمين.\n\n`;
                    msg += `ولي أمر الابن/الابنة المبارك/ة\n`;
                    msg += `✨ ${s.name}\n\n`;
                    msg += `تحية مباركة من ${school} 🎵\n\n`;
                    msg += `📊 نتيجة الترم ${tLabel} ${year}:\n`;
                    msg += `━━━━━━━━━━━━━━━\n`;
                    if (gradesLines) msg += gradesLines;
                    else msg += `(لا توجد درجات مسجلة بعد)\n`;
                    msg += `━━━━━━━━━━━━━━━\n`;
                    msg += `📌 المجموع: ${total}/${max}\n`;
                    msg += `📈 النسبة: ${pct.toFixed(1)}%\n`;
                    msg += `🏅 التقدير: ${grade}\n\n`;
                    msg += `نشكر تعاونكم ومتابعتكم ونصلي من أجل ابنكم/ابنتكم 🙏\n`;
                    msg += `مع تحياتنا\nإدارة ${school} ✞`;
                }
            }
            else if (_waType === 'absence') {
                const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
                const mNames = { 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر', 1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل', 5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس' };
                const subjs = (DB.subjects[s.stage] || []).map(x => x.name);
                let totAbs = 0, totSess = 0;
                const absDetails = [];
                months.forEach(m => {
                    const se = getSessionCount(m);
                    let monthAbs = 0;
                    subjs.forEach(sj => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= se; w++)if (d[w]) monthAbs++; });
                    const maxM = subjs.length * se;
                    totAbs += monthAbs; totSess += maxM;
                    if (monthAbs > 0) absDetails.push(`• ${mNames[m]}: ${monthAbs} حصة`);
                });
                const pct = totSess > 0 ? totAbs / totSess * 100 : 0;
                const warn = pct >= (DB.settings.absMaxPct || 60) ? '🚨 تجاوز الحد الأقصى للغياب!' : pct >= (DB.settings.absWarnPct || 33) ? '⚠️ نسبة الغياب مرتفعة' : '';
                msg = `باسم الآب والابن والروح القدس الإله الواحد، آمين.\n\n`;
                msg += `ولي أمر الطالب/ة: ${s.name}\nالمرحلة: ${s.stage}\n\n`;
                msg += `${warn || '📋 إشعار غياب'}\n\n`;
                msg += `نُحيطكم علماً بأن ابنكم/ابنتكم غاب بمجموع:\n`;
                msg += `❌ ${totAbs} حصة من أصل ${totSess} حصة\n`;
                msg += `📊 نسبة الغياب: ${pct.toFixed(1)}%\n\n`;
                if (absDetails.length) { msg += `📅 تفاصيل الغياب الشهري:\n${absDetails.join('\n')}\n\n`; }
                msg += `نرجو منكم متابعة الحضور المنتظم وإبلاغنا بأسباب الغياب.\n`;
                msg += `ونصلي أن يحفظ الرب ابنكم/ابنتكم 🙏\n\n`;
                msg += `مع تحياتنا\nإدارة ${school} ✞`;
            }
            else if (_waType === 'cert') {
                const rawTotal = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
                const gMax = getTermMax(s.stage) * 3;
                const total = applyMercyGrade(rawTotal, gMax);
                const pct = gMax > 0 ? total / gMax * 100 : 0;
                const grade = getGradeText(pct);
                msg = `باسم الآب والابن والروح القدس الإله الواحد، آمين.\n\n`;
                msg += `مبارك لولي أمر الابن/الابنة المبارك/ة 🎉\n\n`;
                msg += `✨ ${s.name}\n\n`;
                msg += `يسعدنا أن نبشّركم بنجاح ابنكم/ابنتكم في العام الدراسي ${year} 🏆\n\n`;
                msg += `🏅 التقدير: ${grade}\n`;
                msg += `📊 النسبة الكلية: ${pct.toFixed(1)}%\n`;
                msg += `📌 المجموع: ${total}/${gMax}\n\n`;
                msg += `نصلي أن يبارك الرب مسيرته/مسيرتها العلمية ويزيده/يزيدها نعمةً ومعرفةً 🙏\n\n`;
                msg += `مع خالص التهانئ\nإدارة ${school} ✞`;
            }
            else if (_waType === 'custom') {
                msg = document.getElementById('wa-msg-text').value || `باسم الآب والابن والروح القدس الإله الواحد، آمين.\n\nولي أمر الطالب/ة: ${s.name}\n\n[اكتب رسالتك هنا]\n\nمع تحياتنا\nإدارة ${school} ✞`;
            }

            const ta = document.getElementById('wa-msg-text');
            if (ta && _waType !== 'custom') ta.value = msg;
            else if (ta && _waType === 'custom' && !ta.value) ta.value = msg;
        }

        function waFormatPhone(raw) {
            // تحويل الأرقام المصرية لصيغة الدولية
            let p = String(raw || '').replace(/\D/g, '');
            if (p.startsWith('20')) return p;
            if (p.startsWith('0')) return '20' + p.slice(1);
            if (p.startsWith('1') && p.length === 10) return '20' + p;
            return p;
        }

        function waOpenDirect() {
            const raw = document.getElementById('wa-phone-input').value;
            const phone = waFormatPhone(raw);
            const warn = document.getElementById('wa-no-phone-warn');
            if (!phone || phone.length < 10) {
                if (warn) { warn.style.display = 'inline'; setTimeout(() => warn.style.display = 'none', 3000); }
                document.getElementById('wa-phone-input').focus();
                return;
            }
            if (warn) warn.style.display = 'none';
            const msg = document.getElementById('wa-msg-text').value;
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }

        function waCopyMsg() {
            const ta = document.getElementById('wa-msg-text'); if (!ta) return;
            ta.select();
            try { document.execCommand('copy'); } catch (e) { navigator.clipboard && navigator.clipboard.writeText(ta.value); }
            showToast('📋 تم نسخ الرسالة');
        }

        // فتح واتساب من جدول الطلاب مباشرة
        function quickWA(sid) {
            openWA(sid);
        }

        // make student names clickable in cert/annual views
        function makeNamesClickable() {
            document.querySelectorAll('.cert-name,.cert-sname,.ac-student-name').forEach(el => {
                if (el.dataset.spBound) return;
                el.dataset.spBound = '1';
                el.style.cursor = 'pointer';
                el.title = 'عرض ملف الطالب';
                const name = el.textContent.trim();
                el.addEventListener('click', () => {
                    const s = DB.students.find(x => x.name === name);
                    if (s) openSP(s.id);
                });
            });
        }

        // ══════════════════════════════════════════════
        // RISK DASHBOARD PANEL
        // ══════════════════════════════════════════════
        function renderRiskPanel() {
            const cont = document.getElementById('dash-risk-panel'); if (!cont) return;
            if (!DB || !DB.students.length) { cont.style.display = 'none'; return; }
            const passPct = DB.settings.passPct || 50, warnPct = DB.settings.absWarnPct || 33;
            const atRisk = DB.students.filter(s => {
                const grandRaw = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
                if (!grandRaw) return false;
                const gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw, gMax), pct = gMax > 0 ? grand / gMax * 100 : 0;
                return pct < passPct;
            });
            const atAbsRisk = DB.students.filter(s => {
                const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
                const subjs = (DB.subjects[s.stage] || []).map(x => x.name);
                if (!subjs.length) return false;
                let tot = 0, sess = 0;
                months.forEach(m => {
                    const se = getSessionCount(m);
                    sess += subjs.length * se;
                    subjs.forEach(sj => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= se; w++)if (d[w]) tot++; });
                });
                return sess > 0 && tot / sess * 100 >= warnPct;
            });
            if (!atRisk.length && !atAbsRisk.length) { cont.style.display = 'none'; return; }
            cont.style.display = 'block';
            const card = (title, color, bg, list, getTag) => `<div>
    <div style="font-size:12px;font-weight:700;color:${color};margin-bottom:8px">${title} (${list.length})</div>
    <div style="max-height:220px;overflow-y:auto;border:1px solid ${color}40;border-radius:10px">
      ${list.slice(0, 12).map(s => `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid ${bg};cursor:pointer;transition:background .15s" onmouseenter="this.style.background='${bg}'" onmouseleave="this.style.background=''" onclick="openSP('${s.id}')">
        <div><div style="font-weight:700;font-size:12px">${s.name}</div><div style="font-size:10px;color:var(--muted)">${s.stage}</div></div>
        ${getTag(s)}
      </div>`).join('')}
      ${list.length > 12 ? `<div style="padding:6px;text-align:center;font-size:11px;color:var(--muted)">+ ${list.length - 12} آخرون</div>` : ''}
    </div>
  </div>`;
            cont.innerHTML = `<div class="card" style="border-top:3px solid #c0392b">
    <div class="card-title" style="color:#c0392b;justify-content:space-between">
      <span>🚨 تنبيهات — طلاب تحتاج انتباه</span>
      <span style="font-size:11px;color:var(--muted);font-weight:400">انقر على أي اسم لعرض ملف الطالب</span>
    </div>
    <div style="display:grid;grid-template-columns:${atRisk.length && atAbsRisk.length ? '1fr 1fr' : '1fr'};gap:20px">
      ${atRisk.length ? card('❌ خطر رسوب', '#c0392b', '#fef0f0', atRisk, s => {
                const grandRaw = [1, 2, 3].reduce((a, t) => a + calcTotal(s.id, String(t), s.stage), 0);
                const gMax = getTermMax(s.stage) * 3, grand = applyMercyGrade(grandRaw, gMax), pct = gMax > 0 ? grand / gMax * 100 : 0;
                return `<span style="background:#fde8e8;color:#c0392b;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:900;white-space:nowrap">${pct.toFixed(1)}%</span>`;
            }) : ''}
      ${atAbsRisk.length ? card('⚠️ غياب مرتفع', '#e67e22', '#fef9e8', atAbsRisk, s => {
                const months = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
                const subjs = (DB.subjects[s.stage] || []).map(x => x.name);
                let tot = 0;
                months.forEach(m => { const se = getSessionCount(m); subjs.forEach(sj => { const d = DB.absence[`${s.id}_${m}_${sj}`] || {}; for (let w = 1; w <= se; w++)if (d[w]) tot++; }); });
                return `<span style="background:#fff3cd;color:#856404;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:900">${tot} حصة</span>`;
            }) : ''}
    </div>
  </div>`;
        }

        // ══════════════════════════════════════════════
        // KEYBOARD NAVIGATION — جدول رصد الدرجات
        // ══════════════════════════════════════════════
        document.addEventListener('keydown', function (e) {
            const a = document.activeElement;
            if (!a || !a.classList.contains('gi')) return;
            const row = a.closest('tr'), tbody = a.closest('tbody'); if (!row || !tbody) return;
            const rows = [...tbody.querySelectorAll('tr')];
            const rowIdx = rows.indexOf(row);
            const cols = [...row.querySelectorAll('input.gi')];
            const colIdx = cols.indexOf(a);

            // ↓ أو Enter
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                for (let r = rowIdx + 1; r < rows.length; r++) {
                    const nc = [...rows[r].querySelectorAll('input.gi')];
                    if (nc[colIdx]) { nc[colIdx].focus(); nc[colIdx].select(); return; }
                }
            }

            // ↑
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                for (let r = rowIdx - 1; r >= 0; r--) {
                    const pc = [...rows[r].querySelectorAll('input.gi')];
                    if (pc[colIdx]) { pc[colIdx].focus(); pc[colIdx].select(); return; }
                }
            }

            // → يمين (RTL: العمود السابق)
            if (e.key === 'ArrowRight') {
                if (a.selectionEnd === a.value.length || a.value === '') {
                    e.preventDefault();
                    if (colIdx > 0) { cols[colIdx - 1].focus(); cols[colIdx - 1].select(); }
                    else { for (let r = rowIdx - 1; r >= 0; r--) { const pc = [...rows[r].querySelectorAll('input.gi')]; if (pc.length) { pc[pc.length - 1].focus(); pc[pc.length - 1].select(); return; } } }
                }
            }

            // ← يسار (RTL: العمود التالي)
            if (e.key === 'ArrowLeft') {
                if (a.selectionStart === 0 || a.value === '') {
                    e.preventDefault();
                    if (colIdx < cols.length - 1) { cols[colIdx + 1].focus(); cols[colIdx + 1].select(); }
                    else { for (let r = rowIdx + 1; r < rows.length; r++) { const nc = [...rows[r].querySelectorAll('input.gi')]; if (nc.length) { nc[0].focus(); nc[0].select(); return; } } }
                }
            }

            // Tab / Shift+Tab
            if (e.key === 'Tab') {
                const inputs = [...tbody.querySelectorAll('input.gi')];
                const idx = inputs.indexOf(a);
                if (!e.shiftKey && idx < inputs.length - 1) { e.preventDefault(); inputs[idx + 1].focus(); inputs[idx + 1].select(); }
                else if (e.shiftKey && idx > 0) { e.preventDefault(); inputs[idx - 1].focus(); inputs[idx - 1].select(); }
            }
        });

        // ══════════════════════════════════════════════
        // PATCH renderDashboard to call risk panel
        // ══════════════════════════════════════════════
        const _origRenderDashboard = renderDashboard;
        renderDashboard = function () {
            _origRenderDashboard();
            renderRiskPanel();
            setTimeout(makeNamesClickable, 400);
        };
        const _origRenderCerts = renderCertificates;
        renderCertificates = function () { _origRenderCerts(); setTimeout(makeNamesClickable, 300); };
        const _origRenderAnnual = renderAnnual;
        renderAnnual = function () { _origRenderAnnual(); setTimeout(makeNamesClickable, 300); };

        // ══════════════════════════════════════════════
        // PWA — Service Worker Registration
        // ══════════════════════════════════════════════
        // ══ INLINE PWA MANIFEST (no external file needed) ══
        (function () {
            const icon192 = 'data:image/png;base64,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';
            const icon512 = 'data:image/png;base64,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';
            const manifest = {
                name: 'مدرسة البابا شنودة - نظام الإدارة',
                short_name: 'مدرسة البابا شنودة',
                description: 'نظام إدارة مدرسة البابا شنودة للألحان والطقس والقبطي',
                start_url: window.location.href.split('?')[0],
                scope: window.location.pathname.replace(/[^/]*$/, ''),
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#0d2645',
                theme_color: '#0d2645',
                lang: 'ar', dir: 'rtl',
                icons: [
                    { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                    { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                ]
            };
            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
            const url = URL.createObjectURL(blob);
            const ml = document.querySelector('link[rel="manifest"]');
            if (ml) ml.href = url;
        })();
        // ══ INLINE SERVICE WORKER (no sw.js file needed) ══
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swCode = `
const CACHE='school-v1';
const SHELL=[location.href];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(cached=>{
    const net=fetch(e.request).then(r=>{
      if(r&&r.status===200&&r.type!=='opaque'){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
      return r;
    }).catch(()=>{});
    return cached||net;
  }));
});
`;
                try {
                    const blob = new Blob([swCode], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);
                    navigator.serviceWorker.register(url, { scope: './' })
                        .then(r => console.log('✅ SW inline registered'))
                        .catch(e => console.warn('SW fallback:', e));
                } catch (e) { console.warn('SW blob failed:', e); }
            });
        }

        // ══════════════════════════════════════════════
        // PWA — Smart Install (Sidebar + Banner)
        // ══════════════════════════════════════════════
        let deferredPrompt = null;

        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        function _showSidebarInstallBtn() {
            if (isInStandaloneMode) return;
            const wrap = document.getElementById('sidebar-install-wrap');
            if (!wrap) return;
            wrap.style.display = 'block';
            const btn = document.getElementById('sidebar-install-btn');
            if (btn && isIOS) btn.innerHTML = '<span style="font-size:18px">📲</span> كيفية التثبيت على iPhone';
        }

        function sidebarInstallClick() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(({ outcome }) => {
                    if (outcome === 'accepted') {
                        const wrap = document.getElementById('sidebar-install-wrap');
                        if (wrap) wrap.style.display = 'none';
                    }
                    deferredPrompt = null;
                });
                if (typeof closeSidebar === 'function') closeSidebar();
            } else if (isIOS) {
                const hint = document.getElementById('sidebar-ios-hint');
                if (hint) hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
            }
        }

        function showInstallBanner(type) {
            if (isInStandaloneMode) return;
            if (sessionStorage.getItem('pwa_banner_dismissed')) return;
            const banner = document.getElementById('pwa-install-banner');
            const androidSection = document.getElementById('pwa-android-section');
            const iosSection = document.getElementById('pwa-ios-section');
            if (!banner) return;
            if (type === 'android' && androidSection) {
                androidSection.style.display = 'flex';
                if (iosSection) iosSection.style.display = 'none';
            } else if (type === 'ios' && iosSection) {
                iosSection.style.display = 'block';
                if (androidSection) androidSection.style.display = 'none';
            }
            banner.style.display = 'flex';
            banner.style.transform = 'translateY(100%)';
            banner.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                banner.style.transform = 'translateY(0)';
            }));
        }

        function dismissInstallBanner() {
            sessionStorage.setItem('pwa_banner_dismissed', '1');
            const banner = document.getElementById('pwa-install-banner');
            if (!banner) return;
            banner.style.transform = 'translateY(110%)';
            setTimeout(() => { banner.style.display = 'none'; }, 400);
        }

        // Android — native browser prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            _showSidebarInstallBtn();
            setTimeout(() => showInstallBanner('android'), 1500);
        });

        document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') dismissInstallBanner();
            deferredPrompt = null;
        });

        window.addEventListener('appinstalled', () => {
            dismissInstallBanner();
            deferredPrompt = null;
            const wrap = document.getElementById('sidebar-install-wrap');
            if (wrap) wrap.style.display = 'none';
        });

        // iOS Safari
        if (isIOS && !isInStandaloneMode) {
            const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent);
            if (isSafari) {
                window.addEventListener('load', () => {
                    _showSidebarInstallBtn();
                    setTimeout(() => showInstallBanner('ios'), 2000);
                });
            }
        }
    