// ─────────────────────────────────────────────────────────────────────────
// متابعة لحظية — إضافة قائمة على نظام تيك جو الحالي (لا تعدّل app.js)
// تعتمد على onSnapshot الحقيقي من Firestore على مجموعتي tasks و projects
// تُحمَّل بعد app.js مباشرة، وتُعيد استخدام دواله المشتركة:
// escH() / pstatusBadgeClass() / prioBadgeClass() / isOverdue()
// ─────────────────────────────────────────────────────────────────────────
(function () {
  if (window.__ltInit) return;
  window.__ltInit = true;

  if (typeof T !== 'undefined') T.livetrack = 'متابعة لحظية';

  var ltEmployees = [];
  var ltTasks = [];
  var ltProjects = [];
  var ltFeed = [];
  var ltTasksFirstSnap = true;
  var ltLastPushed = {}; // id -> آخر status اتعمله push في الفيد (تفادي التكرار)
  var ltTickTimer = null;

  // ── سجل النشاط: يتخزن محليًا (localStorage) ويُحتفظ به يوم واحد بس ──────
  var LT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 ساعة
  var LT_MAX_ITEMS = 300; // سقف أمان لعدد العناصر المخزّنة
  var LT_STORAGE_KEY = 'tg_livetrack_feed';

  // يحمّل السجل من localStorage ويشيل أي حدث أقدم من 24 ساعة
  function ltLoadFeed() {
    try {
      var raw = localStorage.getItem(LT_STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      var now = Date.now();
      ltFeed = (arr || []).filter(function (f) { return f && f.ts && (now - f.ts) < LT_RETENTION_MS; });
    } catch (e) {
      ltFeed = [];
    }
    ltRenderFeed();
  }
  // يحفظ السجل الحالي في localStorage
  function ltSaveFeed() {
    try { localStorage.setItem(LT_STORAGE_KEY, JSON.stringify(ltFeed)); } catch (e) {}
  }
  // يشيل من ltFeed أي حدث أقدم من 24 ساعة (وسقف أمان للعدد) — بيرجع true لو اتغيّر شيء
  function ltPruneFeed() {
    var now = Date.now();
    var before = ltFeed.length;
    ltFeed = ltFeed.filter(function (f) { return f && f.ts && (now - f.ts) < LT_RETENTION_MS; });
    if (ltFeed.length > LT_MAX_ITEMS) ltFeed = ltFeed.slice(0, LT_MAX_ITEMS);
    return ltFeed.length !== before;
  }

  // ── وقت نسبي دقيق بالعربي من Firestore Timestamp (أو تاريخ عادي) ───────
  function ltRelTime(ts) {
    if (!ts) return 'الآن';
    var d = (ts && typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return 'توقيت غير معروف';
    var now = Date.now();
    var s = Math.floor((now - d.getTime()) / 1000);
    
    if (s < 2) return 'الآن';
    if (s < 60) return 'منذ ' + s + ' ثانية';
    var m = Math.floor(s / 60);
    if (m < 60) return 'منذ ' + m + (m === 1 ? ' دقيقة' : m === 2 ? ' دقيقتين' : m <= 10 ? ' دقائق' : ' دقيقة');
    var h = Math.floor(m / 60);
    if (h < 24) return 'منذ ' + h + (h === 1 ? ' ساعة' : h === 2 ? ' ساعتين' : h <= 10 ? ' ساعات' : ' ساعة');
    var days = Math.floor(h / 24);
    if (days < 30) return 'منذ ' + days + (days === 1 ? ' يوم' : days === 2 ? ' يومين' : days <= 10 ? ' أيام' : ' يوم');
    return d.toLocaleDateString('ar-EG');
  }

  // ── التنقل لهذه الصفحة (نسخة مبسطة من go() الأصلية في app.js) ──────────
  window.goLiveTrack = function (nav) {
    document.querySelectorAll('.S-i').forEach(function (e) { e.classList.remove('a'); });
    if (nav) {
      nav.classList.add('a');
    } else {
      var el = document.querySelector('.S-i[onclick*="goLiveTrack"]');
      if (el) el.classList.add('a');
    }
    document.querySelectorAll('.pg').forEach(function (e) { e.classList.remove('a'); });
    var c = document.getElementById('pg-livetrack');
    if (!c) return;
    c.classList.add('a');
    var pT = document.getElementById('pT');
    if (pT) pT.innerText = 'متابعة لحظية';
    if (window.innerWidth <= 900) {
      var sb = document.getElementById('sb');
      if (sb) sb.classList.remove('opn');
    }
    if (!c.dataset.mounted) {
      ltInjectStyle();
      ltRenderShell(c);
      ltLoadFeed();
      ltMountListeners();
      c.dataset.mounted = '1';
    }
  };

  // ── ستايل خاص بالصفحة فقط، مبني على متغيرات التصميم الموجودة فعلاً ─────
  function ltInjectStyle() {
    if (document.getElementById('lt-style')) return;
    var css =
      '.lt-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:16px}' +
      '.lt-kpi{cursor:default}' +
      '.lt-kpi .dt2{font-size:22px;font-family:inherit}' +
      '.lt-di-live{color:var(--ok);animation:ltBlink 1.4s infinite}' +
      '.lt-grid{display:grid;grid-template-columns:1.7fr 1fr;gap:16px}' +
      '@media(max-width:900px){.lt-grid{grid-template-columns:1fr}}' +
      '.lt-panel{background:var(--w);border:1px solid var(--bd2);border-radius:var(--r);box-shadow:var(--sh-sm);overflow:hidden}' +
      '.lt-panel-h{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--bd2)}' +
      '.lt-panel-h h3{font-size:13.5px;font-weight:800;color:var(--nv);margin:0}' +
      '.lt-panel-h select{background:#fafbfd;color:var(--tx);border:1.5px solid var(--bd2);border-radius:8px;padding:6px 10px;font-size:11.5px;font-family:inherit}' +
      '.lt-live-pill{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;color:var(--ok);background:rgba(39,174,96,.1);padding:4px 12px;border:1px solid rgba(39,174,96,.2);border-radius:20px}' +
      '.lt-live-pill i{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 8px var(--ok);animation:ltPulse 1.8s infinite}' +
      '@keyframes ltPulse{0%{transform:scale(0.95);box-shadow:0 0 0 0 rgba(39,174,96,0.7)}70%{transform:scale(1);box-shadow:0 0 0 6px rgba(39,174,96,0)}100%{transform:scale(0.95);box-shadow:0 0 0 0 rgba(39,174,96,0)}}' +
      '.lt-feed{max-height:420px;overflow-y:auto}' +
      '.lt-feed-item{display:flex;gap:11px;padding:12px 18px;border-bottom:1px solid var(--bd2);animation:ltSlide .35s ease}' +
      '@keyframes ltSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}' +
      '.lt-feed-item:last-child{border-bottom:none}' +
      '.lt-feed-av{width:32px;height:32px;border-radius:9px;background:var(--bg);color:var(--nv);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}' +
      '.lt-feed-body p{margin:0 0 5px;font-size:13px;line-height:1.55;color:var(--tx)}' +
      '.lt-feed-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--tx3)}' +
      '.lt-team{padding:6px 8px;max-height:420px;overflow-y:auto}' +
      '.lt-team-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px}' +
      '.lt-team-row:hover{background:var(--bg)}' +
      '.lt-team-av{width:34px;height:34px;border-radius:9px;background:var(--bg);color:var(--nv);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;position:relative;flex-shrink:0}' +
      '.lt-dot{width:9px;height:9px;border-radius:50%;position:absolute;bottom:-2px;left:-2px;border:2px solid var(--w)}' +
      '.lt-dot.online{background:var(--ok)}' +
      '.lt-dot.idle{background:var(--bd)}' +
      '.lt-team-name{font-size:12.5px;font-weight:700;color:var(--tx)}' +
      '.lt-team-task{font-size:11px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
    var st = document.createElement('style');
    st.id = 'lt-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ── بناء هيكل الصفحة مرة واحدة ──────────────────────────────────────────
  function ltRenderShell(c) {
    c.innerHTML =
      '<div class="lt-kpis">' +
        '<div class="DC lt-kpi"><div class="di lt-di-live">●</div><div class="dt2" id="ltKpiActive">0</div><div class="dd">مهمة جارية الآن</div></div>' +
        '<div class="DC lt-kpi"><div class="di">✅</div><div class="dt2" id="ltKpiDone">0</div><div class="dd">مهام مكتملة (إجمالي)</div></div>' +
        '<div class="DC lt-kpi"><div class="di">⏰</div><div class="dt2" id="ltKpiOverdue">0</div><div class="dd">مهام متأخرة عن الموعد</div></div>' +
        '<div class="DC lt-kpi"><div class="di">👥</div><div class="dt2" id="ltKpiWorking">0</div><div class="dd">موظف لديه عمل جارٍ الآن</div></div>' +
      '</div>' +
      '<div class="lt-grid">' +
        '<div class="lt-panel">' +
          '<div class="lt-panel-h"><h3>سجل النشاط اللحظي</h3>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<button class="bt bt-o" style="padding:4px 10px;font-size:10.5px" onclick="ltForceRefresh()">🔄 تحديث</button>' +
              '<button class="bt bt-o" style="padding:4px 10px;font-size:10.5px" onclick="ltPrintFeed()">🖨 طباعة</button>' +
              '<span class="lt-live-pill"><i></i> مباشر <span id="ltTick" style="font-size:8px;opacity:0.5;margin-left:4px"></span></span>' +
            '</div>' +
          '</div>' +
          '<div class="lt-feed" id="ltFeed"><div class="empty-hint">في انتظار أول تحديث من الفريق...</div></div>' +
        '</div>' +
        '<div class="lt-panel">' +
          '<div class="lt-panel-h"><h3>حالة الفريق الآن</h3><span id="ltTeamCount" style="font-size:10.5px;color:var(--tx3)"></span></div>' +
          '<div class="lt-team" id="ltTeam"></div>' +
        '</div>' +
      '</div>' +
      '<div class="lt-panel" style="margin-top:16px">' +
        '<div class="lt-panel-h"><h3>كل المهام</h3>' +
          '<select id="ltFilterStatus">' +
            '<option value="">كل الحالات</option>' +
            '<option value="جاري العمل">جاري العمل</option>' +
            '<option value="لم يبدأ">لم يبدأ</option>' +
            '<option value="مكتمل">مكتمل</option>' +
          '</select>' +
        '</div>' +
        '<div id="ltTasksList" style="padding:14px 18px"></div>' +
      '</div>';
    document.getElementById('ltFilterStatus').addEventListener('change', ltRenderTasks);
  }

  // ── ربط المستمعين اللحظيين بـ Firestore ─────────────────────────────────
  var _ltUsersUnsub = null;
  var _ltTasksUnsub = null;
  var _ltProjUnsub = null;
  var _ltLogsUnsub = null;
  
  function ltMountListeners() {
    if (_ltUsersUnsub) { _ltUsersUnsub(); _ltUsersUnsub = null; }
    if (_ltTasksUnsub) { _ltTasksUnsub(); _ltTasksUnsub = null; }
    if (_ltProjUnsub) { _ltProjUnsub(); _ltProjUnsub = null; }
    if (_ltLogsUnsub) { _ltLogsUnsub(); _ltLogsUnsub = null; }

    _ltUsersUnsub = db.collection('users').where('role', '==', 'employee')
      .onSnapshot(function (snap) {
        ltEmployees = snap.docs.map(function (d) { return Object.assign({ uid: d.id }, d.data()); });
        ltRenderTeam();
      });

    _ltTasksUnsub = db.collection('tasks').orderBy('createdAt', 'desc').limit(300)
      .onSnapshot(function (snap) {
        snap.docChanges().forEach(function (ch) {
          if (!ltTasksFirstSnap && (ch.type === 'added' || ch.type === 'modified')) {
            ltPushFeed(Object.assign({ id: ch.doc.id }, ch.doc.data()));
          }
        });
        ltTasks = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        if (ltTasksFirstSnap) {
          var now = Date.now();
          ltTasks.forEach(function(t) {
            // Task Creation
            if(t.createdAt) {
              var tsMillis = (typeof t.createdAt.toMillis === 'function') ? t.createdAt.toMillis() : (typeof t.createdAt.getTime === 'function' ? t.createdAt.getTime() : now);
              if (now - tsMillis < LT_RETENTION_MS) {
                var exists = ltFeed.some(function(f) { return f.ts === tsMillis && f.title === t.title && f.verb.indexOf('كلّف') > -1; });
                if (!exists) {
                  ltFeed.push({
                    id: t.id,
                    name: t.createdBy || 'الإدارة',
                    verb: 'كلّف الموظف (' + (t.assignedToName || '?') + ') بمهمة',
                    title: t.title || 'بدون عنوان',
                    status: 'جديدة',
                    ts: tsMillis
                  });
                }
              }
            }
            // Task Status Update
            if(t.statusUpdatedAt) {
              var tsMillis = (typeof t.statusUpdatedAt.toMillis === 'function') ? t.statusUpdatedAt.toMillis() : (typeof t.statusUpdatedAt.getTime === 'function' ? t.statusUpdatedAt.getTime() : now);
              if (now - tsMillis < LT_RETENTION_MS) {
                var exists = ltFeed.some(function(f) { return f.ts === tsMillis && f.title === t.title; });
                if (!exists) {
                  ltFeed.push({
                    id: t.id,
                    name: t.assignedToName || 'موظف',
                    verb: t.status === 'مكتمل' ? 'أنهى مهمة' : t.status === 'جاري العمل' ? 'بدأ العمل على' : 'أعاد فتح مهمة',
                    title: t.title || 'بدون عنوان',
                    status: t.status || 'لم يبدأ',
                    ts: tsMillis
                  });
                }
              }
            }
            ltLastPushed[t.id] = t.status;
          });
          ltFeed.sort(function(a,b) { return b.ts - a.ts; });
          ltPruneFeed();
          ltSaveFeed();
          ltRenderFeed();
        }
        ltTasksFirstSnap = false;
        ltRenderKpis();
        ltRenderTeam();
        ltRenderTasks();
      });

    _ltProjUnsub = db.collection('projects').limit(100).onSnapshot(function (snap) {
      ltProjects = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      ltRenderTeam();
    });

    _ltLogsUnsub = db.collection('attendance_logs').orderBy('serverTimestamp', 'desc').limit(30)
      .onSnapshot(function(snap) {
        snap.docChanges().forEach(function(ch) {
          if (ch.type === 'added' || ch.type === 'modified') {
            var d = ch.doc.data();
            var status = d.checkOut ? 'انصراف' : 'حضور';
            var tsMillis = d.serverTimestamp ? d.serverTimestamp.toMillis() : (d.timestamp ? (d.timestamp.toMillis ? d.timestamp.toMillis() : d.timestamp) : Date.now());
            
            // تفادي التكرار
            var exists = ltFeed.some(function(f) { return f.id === ch.doc.id && f.status === status; });
            if (exists) return;

            ltFeed.unshift({
              id: ch.doc.id,
              name: d.name || 'موظف',
              verb: 'سجل ' + status,
              title: 'يوم: ' + d.date + ' | الساعة: ' + (d.checkOut || d.checkIn),
              status: status,
              ts: tsMillis
            });
            ltPruneFeed();
            ltSaveFeed();
            ltRenderFeed();
          }
        });
      });

    if (ltTickTimer) clearInterval(ltTickTimer);
    ltTickTimer = setInterval(function () {
      var tickEl = document.getElementById('ltTick');
      if(tickEl) tickEl.textContent = ':' + (new Date().getSeconds());
      if (ltPruneFeed()) ltSaveFeed();
      ltRenderFeed();
      ltRenderTeam();
    }, 5000);
  }

  // ── سجل النشاط: يضيف حدثًا جديدًا فقط عند تغيّر فعلي بعد أول تحميل ───────
  function ltPushFeed(t) {
    var status = t.status || 'لم يبدأ';
    if (ltLastPushed[t.id] === status) return;
    
    var isNew = !ltLastPushed[t.id] && status === 'لم يبدأ';
    ltLastPushed[t.id] = status;

    var verb = isNew ? 'كلّف الموظف (' + (t.assignedToName || '?') + ') بمهمة'
      : status === 'مكتمل' ? 'أنهى مهمة'
      : status === 'جاري العمل' ? 'بدأ العمل على'
      : 'أعاد فتح مهمة';
      
    var name = isNew ? (t.createdBy || 'الإدارة') : (t.assignedToName || 'موظف');

    var tsMillis = (t.statusUpdatedAt && typeof t.statusUpdatedAt.toMillis === 'function') ? t.statusUpdatedAt.toMillis() : 
                   (isNew && t.createdAt && typeof t.createdAt.toMillis === 'function') ? t.createdAt.toMillis() : Date.now();
    
    // تفادي تكرار نفس الحدث
    var exists = ltFeed.some(function(f) { return f.id === t.id && f.status === (isNew ? 'جديدة' : status); });
    if (exists) return;

    ltFeed.unshift({
      id: t.id,
      name: name,
      verb: verb,
      title: t.title || 'بدون عنوان',
      status: (isNew ? 'جديدة' : status),
      ts: tsMillis
    });
    ltPruneFeed();
    ltSaveFeed();
    ltRenderFeed();
  }

  // ── رسم سجل النشاط بالوقت النسبي المحسوب لحظة الرسم (يُستدعى كل ٣٠ ث أيضًا) ─
  function ltRenderFeed() {
    var box = document.getElementById('ltFeed');
    if (!box) return;
    if (!ltFeed.length) {
      box.innerHTML = '<div class="empty-hint">في انتظار أول تحديث من الفريق...</div>';
      return;
    }
    box.innerHTML = ltFeed.map(function (f) {
      return '<div class="lt-feed-item">' +
        '<div class="lt-feed-av">' + escH((f.name || '?').slice(0, 1)) + '</div>' +
        '<div class="lt-feed-body">' +
          '<p><b>' + escH(f.name) + '</b> ' + f.verb + ' «' + escH(f.title) + '»</p>' +
          '<div class="lt-feed-meta">' +
            '<span class="badge ' + pstatusBadgeClass(f.status) + '">' + escH(f.status) + '</span>' +
            '<span>' + ltRelTime(f.ts) + '</span>' +
          '</div>' +
        '</div></div>';
    }).join('');
  }

  function ltRenderKpis() {
    var active = ltTasks.filter(function (t) { return t.status === 'جاري العمل'; }).length;
    var done = ltTasks.filter(function (t) { return t.status === 'مكتمل'; }).length;
    var overdue = ltTasks.filter(function (t) { return isOverdue(t.deadline, t.status); }).length;
    var workingUids = {};
    ltTasks.forEach(function (t) { if (t.status === 'جاري العمل' && t.assignedTo) workingUids[t.assignedTo] = 1; });
    ltSetText('ltKpiActive', active);
    ltSetText('ltKpiDone', done);
    ltSetText('ltKpiOverdue', overdue);
    ltSetText('ltKpiWorking', Object.keys(workingUids).length);
  }
  function ltSetText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  // ── حالة الفريق: مهمة جارية إن وجدت، وإلا مشروع قيد التنفيذ، وإلا خامل ──
  function ltRenderTeam() {
    var box = document.getElementById('ltTeam');
    if (!box) return;
    var countEl = document.getElementById('ltTeamCount');
    if (countEl) countEl.textContent = ltEmployees.length + ' عضو';
    if (!ltEmployees.length) {
      box.innerHTML = '<div class="empty-hint">لا يوجد موظفون مسجّلون بعد.</div>';
      return;
    }
    var h = '';
    ltEmployees.slice()
      .sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'ar'); })
      .forEach(function (e) {
        var curTask = ltTasks.filter(function (t) { return t.assignedTo === e.uid && t.status === 'جاري العمل'; })[0];
        var curProj = !curTask && ltProjects.filter(function (p) {
          return (p.assignees || []).indexOf(e.uid) > -1 &&
                 p.progressMap && p.progressMap[e.uid] && p.progressMap[e.uid].status === 'جاري العمل';
        })[0];
        var label, dotClass;
        if (curTask) {
          label = '🗂 ' + (curTask.title || '');
          if (curTask.statusUpdatedAt) label += ' · ' + ltRelTime(curTask.statusUpdatedAt);
          dotClass = 'online';
        }
        else if (curProj) { label = '📁 ' + (curProj.title || ''); dotClass = 'online'; }
        else { label = 'لا يوجد عمل جارٍ حالياً'; dotClass = 'idle'; }

        h += '<div class="lt-team-row">' +
          '<div class="lt-team-av">' + escH((e.name || e.email || '?').slice(0, 1)) + '<span class="lt-dot ' + dotClass + '"></span></div>' +
          '<div class="lt-team-info">' +
            '<div class="lt-team-name">' + escH(e.name || e.email) + '</div>' +
            '<div class="lt-team-task">' + escH(label) + '</div>' +
          '</div></div>';
      });
    box.innerHTML = h;
  }

  // ── قائمة كل المهام مع فلترة حسب الحالة ─────────────────────────────────
  function ltRenderTasks() {
    var box = document.getElementById('ltTasksList');
    if (!box) return;
    var filterEl = document.getElementById('ltFilterStatus');
    var filter = filterEl ? filterEl.value : '';
    var list = filter ? ltTasks.filter(function (t) { return t.status === filter; }) : ltTasks;
    if (!list.length) {
      box.innerHTML = '<div class="empty-hint">لا توجد مهام مطابقة.</div>';
      return;
    }
    var h = '';
    list.forEach(function (t) {
      h += '<div class="pj-row">' +
        '<div class="pj-t">' + escH(t.title || 'بدون عنوان') +
          ' <span class="badge ' + prioBadgeClass(t.priority) + '">' + escH(t.priority || 'متوسطة') + '</span>' +
          ' <span class="badge ' + pstatusBadgeClass(t.status) + '">' + escH(t.status || 'لم يبدأ') + '</span>' +
          (isOverdue(t.deadline, t.status) ? ' <span class="badge badge-overdue">⏰ متأخرة</span>' : '') +
        '</div>' +
        '<div class="pj-meta">👤 ' + escH(t.assignedToName || '') + (t.deadline ? (' · تسليم: ' + escH(t.deadline)) : '') + '</div>' +
      '</div>';
    });
    box.innerHTML = h;
  }

  // ── طباعة سجل النشاط اللحظي بنفس فورمات مستندات النظام (تعتمد على H/SC/tgLine/FT/printDoc من app.js) ──
  window.ltPrintFeed = function () {
    if (typeof H !== 'function' || typeof printDoc !== 'function') return;
    var h = H('سجل النشاط اللحظي', 'كشف بأحدث تحديثات حالة المهام (آخر 24 ساعة)', 'LIVE ACTIVITY LOG');
    h += SC('١', 'الأحداث المسجّلة');
    if (!ltFeed.length) {
      h += tgLine('—', 'لا توجد أحداث مسجّلة خلال آخر 24 ساعة.');
    } else {
      ltFeed.forEach(function (f, i) {
        var d = new Date(f.ts);
        var timeStr = d.toLocaleDateString('ar-EG') + ' · ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        h += tgLine((i + 1) + '. ' + timeStr, (f.name || '') + ' ' + f.verb + ' «' + (f.title || '') + '» — ' + (f.status || ''));
      });
    }
    h += FT(['نسخة الإدارة']);
    printDoc(h);
  };

  window.ltForceRefresh = function() {
    ltLoadFeed();
    ltRenderFeed();
    ltRenderTeam();
    ltRenderKpis();
  };
  
  // تنظيف الذاكرة القديمة لمرة واحدة لضمان سلامة البيانات
  if(!localStorage.getItem('lt_v2')) {
     localStorage.removeItem(LT_STORAGE_KEY);
     localStorage.setItem('lt_v2', '1');
  }
})();
