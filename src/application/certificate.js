
    (function () {
      // ── CSS for the new term certificate ──────────────────────────────
      const TERM_CERT_CSS = `
.tc-cert {
  position: relative;
  margin: 0 auto 24px;
  max-width: 920px;
  padding: 36px 34px 28px;
  border-radius: 18px;
  font-family: 'Cairo', sans-serif;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.tc-cert * { box-sizing: border-box; }
.tc-corner { position: absolute; width: 64px; height: 64px; pointer-events: none; z-index: 2; }
.tc-corner.tl { top: 10px; left: 10px; }
.tc-corner.tr { top: 10px; right: 10px; transform: scaleX(-1); }
.tc-corner.bl { bottom: 10px; left: 10px; transform: scaleY(-1); }
.tc-corner.br { bottom: 10px; right: 10px; transform: scale(-1,-1); }
.tc-inner { position: relative; z-index: 1; }
.tc-head { text-align: center; margin-bottom: 10px; }
.tc-head-with-logos { position: relative; padding: 8px 90px 6px; }
.tc-head-center { text-align: center; }
.tc-head-logo {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 68px; height: 68px; border-radius: 50%;
  border: 2px solid rgba(201,162,39,.55);
  background: #fffdf5; object-fit: cover;
  box-shadow: 0 2px 10px rgba(201,162,39,.25);
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.tc-head-logo-right { right: 12px; }
.tc-head-logo-left  { left:  12px; }
@media (max-width: 520px) {
  .tc-head-with-logos { padding: 6px 72px 4px; }
  .tc-head-logo { width: 54px; height: 54px; }
}
@media print {
  .tc-head-logo { width: 60px; height: 60px; }
}
.tc-cross { font-family: 'Amiri', serif; font-size: 28px; line-height: 1; margin-bottom: 6px; }
.tc-school { font-family: 'Amiri', serif; font-size: 22px; font-weight: 700; letter-spacing: .4px; line-height: 1.3; }
.tc-sub { font-size: 11px; opacity: .75; margin-top: 4px; }
.tc-title { font-family: 'Amiri', serif; font-size: 28px; font-weight: 700; margin-top: 12px; letter-spacing: 1px; }
.tc-divider { height: 2px; margin: 12px auto; max-width: 380px; }
.tc-student { display: flex; align-items: center; gap: 16px; justify-content: center; margin: 16px 0 8px; flex-wrap: wrap; }
.tc-photo { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; border: 3px solid #c9a227; flex-shrink: 0; }
.tc-student-info { text-align: center; }
.tc-label { font-size: 11px; opacity: .75; margin-bottom: 4px; }
.tc-name { font-family: 'Amiri', serif; font-size: 30px; font-weight: 700; line-height: 1.2; }
.tc-name-underline { width: 220px; height: 2px; margin: 6px auto 0; }
.tc-meta { font-size: 12px; opacity: .85; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
.tc-medal { display: inline-flex; align-items: center; gap: 5px; padding: 3px 11px; border-radius: 14px; font-weight: 800; font-size: 12px; }
.tc-verse { font-family: 'Amiri', serif; text-align: center; font-size: 14px; font-style: italic; margin: 14px auto 10px; max-width: 620px; line-height: 1.8; opacity: .9; }
.tc-verse-ref { font-size: 11px; opacity: .65; display: block; margin-top: 4px; font-style: normal; }
.tc-subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 10px; margin: 14px 0; }
.tc-subj { padding: 10px 8px; border-radius: 10px; text-align: center; }
.tc-subj-name { font-size: 11px; font-weight: 700; margin-bottom: 6px; opacity: .9; }
.tc-subj-score { font-size: 22px; font-weight: 900; line-height: 1; }
.tc-subj-max { font-size: 10px; opacity: .7; margin-top: 3px; }
.tc-subj-fld-row { margin-top: 5px; padding-top: 4px; border-top: 1px dashed; }
.tc-subj-fld { display: flex; justify-content: space-between; font-size: 9px; padding: 1px 2px; }
.tc-total { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 14px; padding: 14px 22px; border-radius: 14px; margin: 14px 0 18px; }
.tc-total-label { font-size: 11px; opacity: .85; }
.tc-total-score { font-family: 'Amiri', serif; font-size: 34px; font-weight: 800; line-height: 1; }
.tc-total-score small { font-size: 16px; opacity: .7; font-weight: 700; }
.tc-total-pct { font-size: 18px; font-weight: 800; text-align: center; }
.tc-grade-badge { padding: 6px 16px; border-radius: 18px; font-weight: 900; font-size: 13px; border: 2px solid; text-align: center; justify-self: end; }
.tc-footer { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: end; margin-top: 18px; }
.tc-sig { text-align: center; }
.tc-sig-line { height: 1px; margin-bottom: 5px; opacity: .55; }
.tc-sig-title { font-size: 11px; opacity: .85; font-weight: 700; }
.tc-stamp { text-align: center; font-family: 'Amiri', serif; }
.tc-stamp-cross { font-size: 26px; line-height: 1; }
.tc-stamp-date { font-size: 10px; opacity: .7; margin-top: 4px; }
.tc-meta-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px dashed; font-size: 10px; opacity: .8; }
.tc-qr { width: 64px; height: 64px; background: #fff; padding: 3px; border-radius: 5px; }
.tc-serial { letter-spacing: .5px; font-weight: 700; }
.tc-corner-svg { width: 100%; height: 100%; display: block; }

/* ── LUXE — dark navy + gold ── */
.tc-luxe {
  background: linear-gradient(135deg, #0a1f3d 0%, #1a3a6e 50%, #0a1f3d 100%);
  color: #f5e9c6;
  border: 2px solid #c9a227;
  box-shadow: 0 14px 44px rgba(13,38,69,.4), inset 0 0 0 1px rgba(201,162,39,.4), inset 0 0 0 9px rgba(245,233,198,.03);
}
.tc-luxe::before {
  content: 'مدرسة البابا شنودة';
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Amiri', serif; font-size: 88px; font-weight: 700;
  color: rgba(201,162,39,.07); transform: rotate(-18deg);
  pointer-events: none; white-space: nowrap; z-index: 0;
}
.tc-luxe .tc-school, .tc-luxe .tc-cross, .tc-luxe .tc-title { color: #f4d97a; }
.tc-luxe .tc-name { color: #ffffff; text-shadow: 0 2px 10px rgba(244,217,122,.4); }
.tc-luxe .tc-name-underline { background: #f4d97a; }
.tc-luxe .tc-divider { background: linear-gradient(90deg, transparent, #f4d97a, transparent); }
.tc-luxe .tc-photo { border-color: #f4d97a; box-shadow: 0 0 0 2px rgba(13,38,69,.6); }
.tc-luxe .tc-subj { background: rgba(255,255,255,.06); border: 1px solid rgba(201,162,39,.35); }
.tc-luxe .tc-subj-score { color: #f4d97a; }
.tc-luxe .tc-subj-fld-row { border-color: rgba(244,217,122,.3); }
.tc-luxe .tc-total { background: linear-gradient(135deg, #c9a227, #f4d97a); color: #0a1f3d; }
.tc-luxe .tc-total-label, .tc-luxe .tc-total-score, .tc-luxe .tc-total-pct { color: #0a1f3d; }
.tc-luxe .tc-grade-badge { background: #0a1f3d; color: #f4d97a; border-color: #0a1f3d; }
.tc-luxe .tc-sig-line { background: #f4d97a; }
.tc-luxe .tc-stamp-cross { color: #f4d97a; }
.tc-luxe .tc-meta-bar { border-color: rgba(244,217,122,.35); }
.tc-luxe .tc-corner-svg { color: #f4d97a; }

/* ── CLASSIC — cream + gold light ── */
.tc-classic {
  background:
    radial-gradient(circle at 0% 0%, rgba(201,162,39,.08), transparent 45%),
    radial-gradient(circle at 100% 100%, rgba(201,162,39,.08), transparent 45%),
    #fdfaf2;
  color: #2c2418;
  border: 3px double #c9a227;
  box-shadow: 0 6px 26px rgba(201,162,39,.22), inset 0 0 0 6px #fdfaf2, inset 0 0 0 7px rgba(201,162,39,.45);
}
.tc-classic::before {
  content: 'مدرسة البابا شنودة';
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Amiri', serif; font-size: 88px; font-weight: 700;
  color: rgba(201,162,39,.08); transform: rotate(-18deg);
  pointer-events: none; white-space: nowrap; z-index: 0;
}
.tc-classic .tc-school, .tc-classic .tc-title, .tc-classic .tc-name { color: #0d2645; }
.tc-classic .tc-cross { color: #c9a227; }
.tc-classic .tc-name-underline { background: #c9a227; }
.tc-classic .tc-divider { background: linear-gradient(90deg, transparent, #c9a227, transparent); }
.tc-classic .tc-subj { background: #fff; border: 1.5px solid #e0c97a; }
.tc-classic .tc-subj-name { color: #6b5e3e; }
.tc-classic .tc-subj-score { color: #0d2645; }
.tc-classic .tc-subj-fld-row { border-color: #d4c08a; }
.tc-classic .tc-total { background: linear-gradient(135deg, #fff8e1, #fdebb3); border: 2px solid #c9a227; color: #0d2645; }
.tc-classic .tc-total-label, .tc-classic .tc-total-score, .tc-classic .tc-total-pct { color: #0d2645; }
.tc-classic .tc-grade-badge { background: #fff; color: #0d2645; border-color: #c9a227; }
.tc-classic .tc-sig-line { background: #6b5e3e; }
.tc-classic .tc-stamp-cross { color: #c9a227; }
.tc-classic .tc-meta-bar { border-color: rgba(201,162,39,.45); color: #6b5e3e; }
.tc-classic .tc-corner-svg { color: #c9a227; }

/* ── Style toggle ── */
.tc-style-toggle { display: inline-flex; gap: 4px; background: var(--bg, #f3f4f6); border: 1.5px solid var(--border, #e5e7eb); border-radius: 12px; padding: 4px; }
.tc-style-toggle button { background: transparent; border: 0; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--muted, #6b7280); font-family: inherit; }
.tc-style-toggle button.active { background: var(--navy, #0d2645); color: #fff; }

@media print {
  .tc-cert { box-shadow: none !important; margin: 0 0 8mm 0 !important; page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page; }
  .tc-cert:last-child { page-break-after: auto; break-after: auto; }
  .tc-style-toggle, .no-print { display: none !important; }
}
`;

      // Inject CSS once
      const __tcStyle = document.createElement('style');
      __tcStyle.id = 'tc-cert-style';
      __tcStyle.textContent = TERM_CERT_CSS;
      document.head.appendChild(__tcStyle);

      // ── helper ──────────────────────────────────────────────────────
      function _tcQR(text) {
        try {
          if (typeof qrcode === 'undefined') return '';
          const q = qrcode(0, 'M');
          q.addData(text);
          q.make();
          return q.createDataURL(3, 2);
        } catch (e) { return ''; }
      }

      const CORNER_SVG = `<svg class="tc-corner-svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 32 Q2 2 32 2" stroke-linecap="round"/>
        <path d="M9 32 Q9 9 32 9" opacity=".55" stroke-linecap="round"/>
        <circle cx="14" cy="14" r="2.2" fill="currentColor"/>
        <path d="M16 32 L16 22 M22 32 L22 16" opacity=".4" stroke-linecap="round"/>
      </svg>`;

      function _medalHTML(rank) {
        if (!rank) return '';
        if (rank === 1) return '<span class="tc-medal" style="background:linear-gradient(135deg,#ffd96b,#f4a93e);color:#5a3a00">🥇 الأول</span>';
        if (rank === 2) return '<span class="tc-medal" style="background:linear-gradient(135deg,#e6e6e6,#bcbcbc);color:#3a3a3a">🥈 الثاني</span>';
        if (rank === 3) return '<span class="tc-medal" style="background:linear-gradient(135deg,#e6b88f,#bf7a40);color:#4a2a10">🥉 الثالث</span>';
        return `<span class="tc-medal" style="background:rgba(201,162,39,.2);color:inherit">#${rank}</span>`;
      }

      function _safeColor(p) {
        try { return getGradeColor(p); } catch (e) { return '#0d2645'; }
      }
      function _safeColorLuxe(p) {
        try {
          const st = DB.settings;
          if (p >= st.exPct)   return '#f4d97a';
          if (p >= st.vgPct)   return '#ffd966';
          if (p >= st.gPct)    return '#ffe9a8';
          if (p >= st.passPct) return '#ffb86b';
          return '#ff8a8a';
        } catch(e) { return '#f4d97a'; }
      }

      window._buildTermCertHTML = function (st, stage, term, opts) {
        opts = opts || {};
        const style = opts.style || (DB.settings && DB.settings.termCertStyle) || 'luxe';
        const subjs = (DB.subjects[stage] || []);
        const rawTotal = calcTotal(st.id, String(term), stage);
        const max = getTermMax(stage);
        const total = applyMercyGrade(rawTotal, max);
        const pct = max > 0 ? total / max * 100 : 0;
        const grade = getGradeText(pct);

        const verse = (DB.settings && DB.settings.certVerse) || 'كُلُّ مَا فَعَلْتُمْ فَاعْمَلُوهُ مِنَ الْقَلْبِ كَمَا لِلرَّبِّ';
        const verseRef = (DB.settings && DB.settings.certVerseRef) || '( كولوسي ٣ : ٢٣ )';

        const showPhoto = !DB.settings || DB.settings.certPhoto !== 0;
        const photoHtml = (showPhoto && st.photo) ? `<img src="${st.photo}" class="tc-photo" alt="">` : '';

        const stageCode = (stage || '').replace(/\s/g, '').slice(0, 8);
        const yearCode = (DB.schoolYear || '').replace(/[\/\s\-]/g, '');
        const serial = `TC-${stageCode}-T${term}-${yearCode}-${String(st.id).slice(-6)}`;
        const qrText = `${serial} | ${st.name} | ${stage} | ${TERM_NAMES[term]} | ${total}/${max} (${pct.toFixed(1)}%) | ${grade}`;
        const qrSrc = _tcQR(qrText);
        const qrHtml = qrSrc ? `<img src="${qrSrc}" class="tc-qr" alt="QR">` : '';

        const sigRight = (DB.settings && DB.settings.certSigRight) || 'المدرّس / المدرّسة';
        const sigLeft = (DB.settings && DB.settings.certSigLeft) || 'مدير المدرسة';

        const fmap = { behavior: 'سلوك', oral: 'شفوي', attendance: 'حضور', written: 'تحريري' };
        const subjsHtml = subjs.map(s => {
          const t = calcSubjTotal(st.id, String(term), s.name);
          const m = getSubjMax(s.name, stage);
          const sp = m > 0 ? t / m * 100 : 0;
          const flds = ['behavior', 'oral', 'attendance', 'written'].filter(f => s[f] > 0);
          const bk = flds.length > 1
            ? `<div class="tc-subj-fld-row">${flds.map(f => `<div class="tc-subj-fld"><span>${fmap[f]}</span><span style="font-weight:900">${getGrade(st.id, String(term), s.name, f) || 0}/${s[f]}</span></div>`).join('')}</div>`
            : '';
          return `<div class="tc-subj">
            <div class="tc-subj-name">${s.name}</div>
            <div class="tc-subj-score" style="color:${(style==='luxe' ? _safeColorLuxe(sp) : _safeColor(sp))}">${t}</div>
            <div class="tc-subj-max">من ${m}</div>
            ${bk}
          </div>`;
        }).join('');

        const dateStr = (function () {
          try { return new Date().toLocaleDateString('ar-EG'); } catch (e) { return new Date().toLocaleDateString(); }
        })();

        return `<div class="tc-cert tc-${style}">
          <div class="tc-corner tl">${CORNER_SVG}</div>
          <div class="tc-corner tr">${CORNER_SVG}</div>
          <div class="tc-corner bl">${CORNER_SVG}</div>
          <div class="tc-corner br">${CORNER_SVG}</div>
          <div class="tc-inner">
            <div class="tc-head tc-head-with-logos">
              ${SCHOOL_LOGO_B64 ? `<img src="${SCHOOL_LOGO_B64}" class="tc-head-logo tc-head-logo-right" alt="">` : ''}
              ${CHURCH_LOGO_B64 ? `<img src="${CHURCH_LOGO_B64}" class="tc-head-logo tc-head-logo-left" alt="">` : ''}
              <div class="tc-head-center">
                <div class="tc-cross">✠</div>
                <div class="tc-school">مدرسة البابا شنودة والأرشيذياكون حبيب جرجس</div>
                <div class="tc-sub">للألحان والطقس والقبطي — ${DB.schoolYear || ''}</div>
                <div class="tc-title">شهادة تقدير — ${TERM_NAMES[term]}</div>
              </div>
            </div>
            <div class="tc-divider"></div>
            <div class="tc-student">
              ${photoHtml}
              <div class="tc-student-info">
                <div class="tc-label">يُشهد بأن الطالب / الطالبة</div>
                <div class="tc-name">${st.name}</div>
                <div class="tc-name-underline"></div>
                <div class="tc-meta"><span>${st.stage}</span><span>•</span><span>${TERM_NAMES[term]}</span><span>•</span><span>${DB.schoolYear || ''}</span>${opts.rank ? '<span>•</span>' + _medalHTML(opts.rank) : ''}</div>
              </div>
            </div>
            <div class="tc-verse">«${verse}»<span class="tc-verse-ref">${verseRef}</span></div>
            ${subjs.length ? `<div class="tc-subjects">${subjsHtml}</div>` : ''}
            <div class="tc-total">
              <div>
                <div class="tc-total-label">المجموع الكلي</div>
                <div class="tc-total-score">${total} <small>/ ${max}</small></div>
              </div>
              <div class="tc-total-pct">${pct.toFixed(1)}%</div>
              <div class="tc-grade-badge">${grade}</div>
            </div>
            <div class="tc-footer">
              <div class="tc-sig">
                <div class="tc-sig-line"></div>
                <div class="tc-sig-title">${sigRight}</div>
              </div>
              <div class="tc-stamp">
                <div class="tc-stamp-cross">✠</div>
                <div class="tc-stamp-date">${dateStr}</div>
              </div>
              <div class="tc-sig">
                <div class="tc-sig-line"></div>
                <div class="tc-sig-title">${sigLeft}</div>
              </div>
            </div>
            <div class="tc-meta-bar">
              <div><span style="opacity:.7">رقم الشهادة:</span> <span class="tc-serial">${serial}</span></div>
              ${qrHtml}
            </div>
          </div>
        </div>`;
      };

      window.setTermCertStyle = function (s) {
        DB.settings = DB.settings || {};
        DB.settings.termCertStyle = s;
        try { saveDB(); } catch (e) {}
        if (typeof renderCertificates === 'function') renderCertificates();
      };

      function _rankMap(students, stage, term) {
        const max = getTermMax(stage);
        const arr = students.map(st => {
          const raw = calcTotal(st.id, String(term), stage);
          const t = applyMercyGrade(raw, max);
          const p = max > 0 ? t / max * 100 : 0;
          return { id: st.id, p };
        });
        arr.sort((a, b) => b.p - a.p);
        const m = {};
        arr.forEach((x, i) => { m[x.id] = i + 1; });
        return m;
      }

      // ── Override renderCertificates (screen view) ──────────────────
      window.renderCertificates = function () {
        const stage = (document.getElementById('cert-stage-sel') || { value: STAGES[0] }).value;
        const term = (document.getElementById('cert-term-sel') || { value: '1' }).value;
        const cntEl = document.getElementById('cert-student-count');
        const allInStage = DB.students.filter(s => s.stage === stage && !isGraduate(s));
        if (cntEl) cntEl.textContent = allInStage.length + ' طالب';
        const q = ((document.getElementById('cert-search') || {}).value || '').toLowerCase();
        const filtered = allInStage.filter(s => !q || s.name.toLowerCase().includes(q));
        const container = document.getElementById('certs-container');
        if (!container) return;
        if (!filtered.length) {
          container.innerHTML = '<div class="empty-state"><div class="icon">🏆</div><p>لا يوجد طلاب</p></div>';
          return;
        }
        const ranks = _rankMap(allInStage, stage, term);
        const students = (typeof _sortStudentsForPrint === 'function')
          ? _sortStudentsForPrint(filtered, stage, term)
          : filtered;
        const style = (DB.settings && DB.settings.termCertStyle) || 'luxe';

        const styleToggle = `<div class="no-print" style="display:flex;justify-content:center;margin:6px 0 16px"><div class="tc-style-toggle">
          <button class="${style === 'luxe' ? 'active' : ''}" onclick="setTermCertStyle('luxe')">🌌 فاخر داكن</button>
          <button class="${style === 'classic' ? 'active' : ''}" onclick="setTermCertStyle('classic')">📜 كلاسيكي فاتح</button>
        </div></div>`;

        const infoBanner = `<div class="certs-info-banner">
          <div class="cib-item"><span class="cib-label">📚 المرحلة</span><span class="cib-value">${stage}</span></div>
          <div class="cib-divider"></div>
          <div class="cib-item"><span class="cib-label">📅 الترم</span><span class="cib-value">${TERM_NAMES[term]}</span></div>
          <div class="cib-divider"></div>
          <div class="cib-item"><span class="cib-label">🗓️ العام الدراسي</span><span class="cib-value">${DB.schoolYear || '—'}</span></div>
          <div class="cib-divider"></div>
          <div class="cib-item"><span class="cib-label">👥 عدد الطلاب</span><span class="cib-value">${students.length} طالب</span></div>
        </div>`;

        container.innerHTML = infoBanner + styleToggle +
          students.map(st => _buildTermCertHTML(st, stage, term, { style, rank: ranks[st.id] })).join('');
      };

      // ── Override buildCertsHTML (print/PDF) ────────────────────────
      const __origBuild = window.buildCertsHTML;
      // v37: يدعم studentIdFilter لطباعة شهادة طالب واحد فقط (إصلاح: كان يطبع كل المرحلة)
      window.buildCertsHTML = function (stage, term, studentIdFilter) {
        const allInStage = DB.students.filter(s => s.stage === stage && !isGraduate(s));
        const max = getTermMax(stage);
        const passPct = (DB.settings && DB.settings.passPct) || 50;
        const _isPassing = st => {
          const raw = calcTotal(st.id, String(term), stage);
          const total = applyMercyGrade(raw, max);
          const pct = max > 0 ? total / max * 100 : 0;
          return raw > 0 && pct >= passPct;
        };
        // عند طلب طالب محدد: نطبع له شهادته فقط بغضّ النظر عن النجاح/الرسوب
        let selected;
        if (studentIdFilter) {
          selected = allInStage.filter(st => String(st.id) === String(studentIdFilter));
        } else {
          selected = allInStage.filter(_isPassing);
        }
        const students = (typeof _sortStudentsForPrint === 'function')
          ? _sortStudentsForPrint(selected, stage, term)
          : selected;

        // الترتيب يُحسب من كامل المرحلة حتى يكون رقم الترتيب صحيحاً حتى لطالب واحد
        const ranks = _rankMap(allInStage.filter(_isPassing), stage, term);

        const CSS = (typeof _getBuilderCSS === 'function') ? _getBuilderCSS() : '';
        const teacherStr = (typeof _getTeacherStrForPrint === 'function') ? _getTeacherStrForPrint(stage) : '';
        const header = (typeof _buildHeader === 'function')
          ? _buildHeader(`الشهادات الترمية — ${TERM_NAMES[term]}`, `${stage} — ${DB.schoolYear}`, teacherStr, students.length)
          : '';
        const footer = (typeof _buildPrintFooter === 'function') ? _buildPrintFooter(teacherStr) : '';

        let html = CSS + `<style>${TERM_CERT_CSS}</style>` + header;
        if (!students.length) return html + `<p style="text-align:center;padding:30px;color:#888">لا يوجد طلاب</p>`;
        const style = (DB.settings && DB.settings.termCertStyle) || 'luxe';
        students.forEach(st => {
          html += _buildTermCertHTML(st, stage, term, { style, rank: ranks[st.id] });
        });
        html += footer;
        return html;
      };
    })();
    