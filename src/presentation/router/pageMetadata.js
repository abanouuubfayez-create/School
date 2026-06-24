
(function(){
  'use strict';

  // ── Page metadata: title + parent ─────────────────────────────────────
  const PAGE_META = {
    'dashboard':         { title: 'لوحة التحكم', parent: null,         icon: '🏠' },
    'teacher-profile':   { title: 'ملفي الشخصي', parent: 'dashboard',  icon: '👤' },
    'students':          { title: 'تسجيل الطلاب', parent: 'dashboard', icon: '👦' },
    'promote':           { title: 'ترقية الطلاب', parent: 'students',  icon: '⬆️' },
    'absence':           { title: 'سجل الغياب',  parent: 'students',   icon: '📅' },
    'subjects':          { title: 'إدارة المواد', parent: 'dashboard', icon: '📚' },
    'exams':             { title: 'رصد الدرجات', parent: 'subjects',   icon: '✏️' },
    'grades-report':     { title: 'تقرير الرصد الشامل', parent: 'exams', icon: '📋' },
    'certificates':      { title: 'الشهادات الترمية', parent: 'dashboard', icon: '🏆' },
    'annual':            { title: 'الشهادة السنوية', parent: 'certificates', icon: '🎓' },
    'total':             { title: 'مجموع الترمات',  parent: 'certificates', icon: '📊' },
    'top':               { title: 'الطلاب الأوائل',  parent: 'certificates', icon: '🥇' },
    'new-year-report':   { title: 'تقرير بدء العام', parent: 'dashboard', icon: '🏫' },
    'print':             { title: 'الطباعة',        parent: 'dashboard', icon: '🖨️' },
    'settings':          { title: 'الإعدادات',      parent: 'dashboard', icon: '⚙️' },
    'teacher-log':       { title: 'سجل نشاط المدرسين', parent: 'settings', icon: '📋' },
    'yearhistory':       { title: 'سجل الأعوام',    parent: 'settings', icon: '🗂️' },
    'deacons':           { title: 'قائمة الشمامسة', parent: 'dashboard', icon: '🕊️' },
    'deacons-attendance':{ title: 'حضور القداسات',  parent: 'deacons',  icon: '📅' },
    'deacons-services':  { title: 'توزيع الخدمات', parent: 'deacons',  icon: '🗓️' },
    'media':             { title: 'امتحانات وصور',  parent: 'dashboard', icon: '📋' },
    'graduation-certs':  { title: 'شهادات التخرج',  parent: 'dashboard', icon: '🎖️' },
    'final-cert':        { title: 'شهادة التخرج النهائية', parent: 'graduation-certs', icon: '🎓' },
    'graduates':         { title: 'صفحة الخريجين',  parent: 'graduation-certs', icon: '🏅' },
    'books':             { title: 'جدول المدرسة',  parent: 'dashboard', icon: '📅' },
    'schedule-detail':   { title: 'جدول الحصص التفصيلي', parent: 'books', icon: '📆' },
    'teacher-schedule':  { title: 'جدول المدرسين',  parent: 'books',   icon: '👨‍🏫' },
    'assign-schedule':   { title: 'جدول أسماء المدرسين', parent: 'books', icon: '📋' },
    'exam-files':        { title: 'ملفات الامتحانات', parent: 'dashboard', icon: '📝' },
    'install-guide':     { title: 'دليل تثبيت التطبيق', parent: 'settings', icon: '📲' },
  };

  let _currentPage = 'dashboard';
  let _suppressPush = false;

  // ── Build breadcrumb bar + back button (inject into .main) ────────────
  function ensureBreadcrumbBar() {
    if (document.getElementById('app-breadcrumb-bar')) return;
    const main = document.querySelector('.main') || document.querySelector('#main-content');
    if (!main) return;
    const bar = document.createElement('div');
    bar.id = 'app-breadcrumb-bar';
    bar.innerHTML = `
      <button id="app-back-btn" title="رجوع">⟶ رجوع</button>
      <div id="app-breadcrumb-trail"></div>
    `;
    main.insertBefore(bar, main.firstChild);
    document.getElementById('app-back-btn').addEventListener('click', function(){
      const meta = PAGE_META[_currentPage];
      if (meta && meta.parent) {
        navigate(meta.parent);
      } else {
        try { history.back(); } catch(_){}
      }
    });
  }

  function renderBreadcrumb(page) {
    const trail = document.getElementById('app-breadcrumb-trail');
    if (!trail) return;
    const chain = [];
    let cur = page;
    let safety = 8;
    while (cur && safety-- > 0) {
      chain.unshift(cur);
      const m = PAGE_META[cur];
      cur = m ? m.parent : null;
    }
    if (!chain.length) chain.push(page);
    trail.innerHTML = chain.map((p, i) => {
      const m = PAGE_META[p] || { title: p, icon: '' };
      const isLast = i === chain.length - 1;
      if (isLast) {
        return `<span class="crumb current">${m.icon||''} ${m.title}</span>`;
      }
      return `<span class="crumb" data-page="${p}">${m.icon||''} ${m.title}</span><span class="sep">‹</span>`;
    }).join('');
    trail.querySelectorAll('.crumb[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.getAttribute('data-page')));
    });
    // Update back button
    const backBtn = document.getElementById('app-back-btn');
    if (backBtn) {
      const meta = PAGE_META[page];
      backBtn.disabled = !meta || !meta.parent;
    }
  }

  // ── Patch navigate() to add breadcrumb + history ─────────────────────
  function patchNavigate() {
    if (typeof window.navigate !== 'function') {
      setTimeout(patchNavigate, 100);
      return;
    }
    if (window.__navPatched) return;
    window.__navPatched = true;
    const original = window.navigate;
    window.navigate = function(page) {
      const result = original.apply(this, arguments);
      try {
        _currentPage = page;
        ensureBreadcrumbBar();
        renderBreadcrumb(page);
        if (!_suppressPush) {
          const newHash = '#/' + page;
          if (location.hash !== newHash) {
            history.pushState({ page: page }, '', newHash);
          }
        }
      } catch(e) { console.warn('[nav-enhance]', e); }
      return result;
    };
  }

  // ── popstate: handle browser back/forward ────────────────────────────
  window.addEventListener('popstate', function(e){
    const page = (e.state && e.state.page) || hashToPage();
    if (page) {
      _suppressPush = true;
      try { window.navigate && window.navigate(page); }
      finally { _suppressPush = false; }
    }
  });

  function hashToPage() {
    const h = location.hash || '';
    const m = h.match(/^#\/([a-z0-9-]+)/i);
    return m ? m[1] : null;
  }

  // ── Initial deep-link: open page from hash on load ───────────────────
  function applyInitialHash() {
    const page = hashToPage();
    if (page && PAGE_META[page] && typeof window.navigate === 'function') {
      _suppressPush = true;
      try { window.navigate(page); }
      finally { _suppressPush = false; }
    } else if (typeof window.navigate === 'function') {
      // ensure breadcrumb renders for default page
      ensureBreadcrumbBar();
      renderBreadcrumb(_currentPage);
    }
  }

  // ── Group exams toolbar buttons under dropdowns ──────────────────────
  function groupExamsToolbar() {
    const examsPage = document.getElementById('page-exams');
    if (!examsPage || examsPage.dataset.nvGrouped) return;
    const ph = examsPage.querySelector('.ph > div:last-child'); // top actions row
    const toolbar = examsPage.querySelector('.toolbar');
    if (!ph || !toolbar) return;

    // Helper: find a button by its onclick substring
    function findBtn(container, onclickFrag) {
      return Array.from(container.querySelectorAll('button')).find(b => {
        const oc = b.getAttribute('onclick') || '';
        return oc.includes(onclickFrag);
      });
    }

    // ── Export dropdown (from .ph top row) ────────────────────────────
    const exportItems = [
      { frag: "doPrint('exams')",           label: "📄 تصدير PDF (هذه المرحلة)" },
      { frag: "printAllExams()",            label: "📄 PDF كل المراحل" },
      { frag: "printClassDetailedCertificates()", label: "🎓 شهادات الفصل التفصيلية" },
      { frag: "printClassAnnualCertificates()",   label: "🏆 شهادات السنة التفصيلية" },
    ];
    const exportBtns = exportItems.map(it => ({ ...it, el: findBtn(ph, it.frag) })).filter(x => x.el);
    if (exportBtns.length) {
      const wrap = document.createElement('div');
      wrap.className = 'nv-dropdown';
      wrap.innerHTML = `
        <button type="button" class="btn btn-primary nv-dropdown-btn">📄 طباعة وتصدير ▾</button>
        <div class="nv-dropdown-menu"></div>
      `;
      const menu = wrap.querySelector('.nv-dropdown-menu');
      exportBtns.forEach(({ el, label }) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.textContent = label;
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          wrap.classList.remove('open');
          el.click();
        });
        menu.appendChild(item);
        el.style.display = 'none';
      });
      // Keep recalc-att-btn visible (it's a primary action)
      ph.appendChild(wrap);
      wireDropdown(wrap);
    }

    // ── Actions dropdown (from .toolbar) ──────────────────────────────
    const actionItems = [
      { frag: "recalcAttendanceNow()",      label: "🎯 حساب الحضور من الغياب" },
      { frag: "openGradesExcelImport()",    label: "📊 استيراد الدرجات (Excel)" },
      { frag: "openPasteModal()",           label: "📋 لصق من Excel" },
      { frag: "undoLastGradesImport()",     label: "↩️ تراجع عن آخر استيراد" },
      { sep: true },
      { frag: "confirmDeleteTermGrades()",  label: "🗑️ حذف درجات الترم", danger: true },
    ];
    // Search in both .ph AND .toolbar for recalc btn (it lives in .ph)
    const containers = [ph, toolbar];
    const actionBtns = actionItems.map(it => {
      if (it.sep) return it;
      let el = null;
      for (const c of containers) { el = findBtn(c, it.frag); if (el) break; }
      return { ...it, el };
    }).filter(x => x.sep || x.el);

    if (actionBtns.some(x => !x.sep && x.el)) {
      const wrap = document.createElement('div');
      wrap.className = 'nv-dropdown';
      wrap.innerHTML = `
        <button type="button" class="btn nv-dropdown-btn" style="background:linear-gradient(135deg,#475569,#64748b);color:#fff">⋯ إجراءات ▾</button>
        <div class="nv-dropdown-menu"></div>
      `;
      const menu = wrap.querySelector('.nv-dropdown-menu');
      actionBtns.forEach(it => {
        if (it.sep) {
          const s = document.createElement('div');
          s.className = 'nv-sep';
          menu.appendChild(s);
          return;
        }
        const item = document.createElement('button');
        item.type = 'button';
        item.textContent = it.label;
        if (it.danger) item.style.color = '#b91c1c';
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          wrap.classList.remove('open');
          it.el.click();
        });
        menu.appendChild(item);
        it.el.style.display = 'none';
      });
      toolbar.appendChild(wrap);
      wireDropdown(wrap);
    }

    examsPage.dataset.nvGrouped = '1';
  }

  function wireDropdown(wrap) {
    const btn = wrap.querySelector('.nv-dropdown-btn');
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      // close other open dropdowns
      document.querySelectorAll('.nv-dropdown.open').forEach(d => {
        if (d !== wrap) d.classList.remove('open');
      });
      const willOpen = !wrap.classList.contains('open');
      wrap.classList.toggle('open', willOpen);
      if (willOpen) positionDropdownMenu(wrap);
    });
  }
  function positionDropdownMenu(wrap) {
    const btn = wrap.querySelector('.nv-dropdown-btn');
    const menu = wrap.querySelector('.nv-dropdown-menu');
    if (!btn || !menu) return;
    const margin = 12;
    const rect = btn.getBoundingClientRect();
    const maxWidth = Math.min(320, window.innerWidth - (margin * 2));
    menu.style.width = Math.max(260, Math.min(maxWidth, window.innerWidth - (margin * 2))) + 'px';
    const menuWidth = menu.offsetWidth || maxWidth;
    let left = rect.right - menuWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));
    let top = rect.bottom + 6;
    const menuHeight = menu.offsetHeight || 0;
    if (top + menuHeight + margin > window.innerHeight) top = Math.max(margin, rect.top - menuHeight - 6);
    menu.style.setProperty('--nv-menu-left', left + 'px');
    menu.style.setProperty('--nv-menu-top', top + 'px');
  }
  document.addEventListener('click', () => {
    document.querySelectorAll('.nv-dropdown.open').forEach(d => d.classList.remove('open'));
  });
  window.addEventListener('resize', () => {
    document.querySelectorAll('.nv-dropdown.open').forEach(positionDropdownMenu);
  });
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.nv-dropdown.open').forEach(positionDropdownMenu);
  }, true);

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot() {
    patchNavigate();
    ensureBreadcrumbBar();
    groupExamsToolbar();
    // re-run group after a tick in case page rendered later
    setTimeout(groupExamsToolbar, 500);
    setTimeout(groupExamsToolbar, 1500);
    // Seed initial state so popstate always has a page
    try {
      const initPage = hashToPage() || _currentPage || 'dashboard';
      history.replaceState({ page: initPage }, '', '#/' + initPage);
    } catch(_){}
    applyInitialHash();
    // Re-render breadcrumb periodically in case nav happens through other paths
    setInterval(() => {
      const active = document.querySelector('.page.active');
      if (active) {
        const id = active.id.replace(/^page-/, '');
        if (id && id !== _currentPage) {
          _currentPage = id;
          renderBreadcrumb(id);
        }
      }
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
