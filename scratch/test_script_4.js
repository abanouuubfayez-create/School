
window.onAppSettingsUpdate = function(settings) {
    var enabled = settings.attendanceEnabled !== false;
    document.getElementById('attDisabledMsg').style.display = enabled ? 'none' : 'block';
    document.getElementById('attEnabledSec').style.display = enabled ? 'block' : 'none';

    if (settings.globalRemoteMode) {
        var tab = document.getElementById('empTabAtt');
        if (tab) tab.style.display = 'flex';
    } else if (typeof TG_USER !== 'undefined' && TG_USER) {
        var tab = document.getElementById('empTabAtt');
        if (tab) tab.style.display = (TG_USER.workMode === 'remote') ? 'flex' : 'none';
        if (TG_USER.workMode !== 'remote' && window.location.hash === '#att') window.location.hash = '';
    }
};

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function badgeReq(s){
    var cls = s === 'approved' ? 'badge-approved' : (s === 'rejected' ? 'badge-rejected' : 'badge-pending');
    var lbl = s === 'approved' ? 'موافق عليه' : (s === 'rejected' ? 'مرفوض' : 'قيد المراجعة');
    return '<span class="badge ' + cls + '">' + lbl + '</span>';
}
function empGo(id, el, force) {
    // تم إزالة فحص النص غير المحفوظ لتجنب الإزعاج
    document.querySelectorAll('.emp-tab').forEach(function(t){t.classList.remove('a');});
    document.querySelectorAll('.emp-pg').forEach(function(p){p.classList.remove('a');});
    if(el)el.classList.add('a');
    var epg = document.getElementById('epg-'+id);
    if(epg) epg.classList.add('a');
    
    if(id === 'livemeeting') {
        if(typeof initMeetingsListener === 'function') initMeetingsListener();
        if(typeof loadUsersForCalls === 'function') loadUsersForCalls();
    }
    
    // Reset global table filter
    var gf = document.getElementById("globalTableFilter");
    if(gf) { gf.value = ""; if(typeof tgFilterVisibleTables==='function') tgFilterVisibleTables(""); }
    
    if(id==='proj' && window._currentProjectIds && window.TG_USER){
        var seenProjects = JSON.parse(localStorage.getItem('seen_projects_'+TG_USER.uid) || '[]');
        window._currentProjectIds.forEach(function(pid){
            if(seenProjects.indexOf(pid)===-1) seenProjects.push(pid);
        });
        localStorage.setItem('seen_projects_'+TG_USER.uid, JSON.stringify(seenProjects));
        updateProjBadge(0);
    }
    if(id==='tasks' && window._currentTaskIds && window.TG_USER){
        var seenTasks = JSON.parse(localStorage.getItem('seen_tasks_'+TG_USER.uid) || '[]');
        window._currentTaskIds.forEach(function(tid){
            if(seenTasks.indexOf(tid)===-1) seenTasks.push(tid);
        });
        localStorage.setItem('seen_tasks_'+TG_USER.uid, JSON.stringify(seenTasks));
        updateTasksBadge(0);
    }
    if(id === 'devres' && typeof fetchEmpDevRes === 'function') {
        if(typeof updateDevResBadge === 'function') updateDevResBadge(0);
        if(window._allDevRes && window.TG_USER) {
            var seenDevres = JSON.parse(localStorage.getItem('seen_devres_'+TG_USER.uid) || '[]');
            window._allDevRes.forEach(function(d){
                if(seenDevres.indexOf(d.id)===-1) seenDevres.push(d.id);
            });
            localStorage.setItem('seen_devres_'+TG_USER.uid, JSON.stringify(seenDevres));
        }
        fetchEmpDevRes();
    }
    if(id === 'wkr' && typeof loadWeeklyReportsEmp === 'function') {
        loadWeeklyReportsEmp(epg);
    }
    if(id === 'monthlyreports' && typeof loadMonthlyReportsEmp === 'function') {
        loadMonthlyReportsEmp(epg);
    }
    if(id === 'monthlyplans' && typeof loadMonthlyPlansEmp === 'function') {
        loadMonthlyPlansEmp(epg);
    }
}

function updateProjBadge(n) {
    var el = document.getElementById('proj-badge');
    if (!el) return;
    if (n > 0) {
        el.style.display = 'inline-block';
        el.textContent = n;
    } else {
        el.style.display = 'none';
        el.textContent = '0';
    }
    if (typeof updateSmartTabTitle === 'function') updateSmartTabTitle();
}

function updateTasksBadge(n) {
    var el = document.getElementById('tasks-badge');
    if (!el) return;
    if (n > 0) {
        el.style.display = 'inline-block';
        el.textContent = n;
    } else {
        el.style.display = 'none';
        el.textContent = '0';
    }
    if (typeof updateSmartTabTitle === 'function') updateSmartTabTitle();
}

function updateDevResBadge(n) {
    var el = document.getElementById('devres-badge');
    if (!el) return;
    if (n > 0) {
        el.style.display = 'inline-block';
        el.textContent = n;
    } else {
        el.style.display = 'none';
        el.textContent = '0';
    }
    if (typeof updateSmartTabTitle === 'function') updateSmartTabTitle();
}

function updateSmartTabTitle() {
    var pb = parseInt(document.getElementById('proj-badge') ? document.getElementById('proj-badge').textContent : 0) || 0;
    var tb = parseInt(document.getElementById('tasks-badge') ? document.getElementById('tasks-badge').textContent : 0) || 0;
    var fb = parseInt(document.getElementById('forms-badge') ? document.getElementById('forms-badge').textContent : 0) || 0;
    var db = parseInt(document.getElementById('devres-badge') ? document.getElementById('devres-badge').textContent : 0) || 0;
    var mb = document.getElementById('meetingBadgeStatus');
    var isMeeting = (mb && mb.style.display !== 'none' && mb.textContent.indexOf('مباشر') !== -1) ? 1 : 0;
    
    var total = pb + tb + fb + db + isMeeting;
    var baseTitle = 'بوابة الموظف · تيك جو';
    if(total > 0) {
        document.title = '(' + total + ') ' + baseTitle;
    } else {
        document.title = baseTitle;
    }
}

function playTaskProjNotification() {
    try {
        var ctx = window._tgAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._tgAudioCtx = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        
        var toneFn = typeof _tgTone === 'function' ? _tgTone : function(c, freq, start, dur, vol) {
            var osc = c.createOscillator(), gain = c.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.linearRampToValueAtTime(vol, start + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
            osc.connect(gain); gain.connect(c.destination);
            osc.start(start); osc.stop(start + dur + 0.03);
        };
        
        // A pleasant double note chime (C5 then G5)
        toneFn(ctx, 523.25, now, 0.15, 0.15);
        toneFn(ctx, 783.99, now + 0.12, 0.25, 0.15);
        
    } catch(e) {
        console.error("Audio error:", e);
    }
}

var _projectsUnsub = null;
function loadMyProjects(){
    if(_projectsUnsub) { 
        // Already listening — just refresh the box reference in case DOM was re-rendered
        return; 
    }
    var isInitialProjects = true;
    var box = document.getElementById('myProjectsList');
    _projectsUnsub = db.collection('projects').where('assignees','array-contains',TG_USER.uid)
        .onSnapshot(function(snap){
            if(snap.empty){
                box.innerHTML='<div class="empty-hint">لا توجد مشاريع مُسندة إليك حالياً.</div>';
                updateProjBadge(0);
                window._currentProjectIds = [];
                isInitialProjects = false;
                return;
            }
            var projects=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
            var proms=projects.map(function(p){
                return db.collection('projectComments').where('projectId','==',p.id).get().then(function(csnap){
                    p.comments=csnap.docs.map(function(d){return Object.assign({id:d.id},d.data());})
                        .sort(function(a,b){
                            var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                            var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                            return am-bm;
                        });
                    return p;
                });
            });
            Promise.all(proms).then(function(projectsList){
                renderProjectsHtml(projectsList);
                
                var currentIds = projectsList.map(function(p){ return p.id; });
                window._currentProjectIds = currentIds;
                
                var seenProjects = JSON.parse(localStorage.getItem('seen_projects_'+TG_USER.uid) || '[]');
                var isTabActive = document.getElementById('epg-proj').classList.contains('a');
                
                if(isTabActive){
                    currentIds.forEach(function(id){
                        if(seenProjects.indexOf(id)===-1) seenProjects.push(id);
                    });
                    localStorage.setItem('seen_projects_'+TG_USER.uid, JSON.stringify(seenProjects));
                }
                
                var unseenCount = 0;
                currentIds.forEach(function(id){
                    var p = projectsList.find(function(proj){ return proj.id === id; });
                    if(seenProjects.indexOf(id)===-1 && p.createdByUid!==TG_USER.uid){
                        unseenCount++;
                    }
                });
                
                if(!isInitialProjects){
                    var hasNewProj = false;
                    snap.docChanges().forEach(function(change){
                        if(change.type==='added'){
                            var pData = change.doc.data();
                            if(pData.createdByUid!==TG_USER.uid){
                                hasNewProj = true;
                            }
                        }
                    });
                    if(hasNewProj){
                        playTaskProjNotification();
                    }
                }
                
                updateProjBadge(unseenCount);
                isInitialProjects = false;
            });
        }, function(err){
            box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل المشاريع: '+esc(err.message)+'</div>';
        });
}

function renderProjectsHtml(projects){
    var box = document.getElementById('myProjectsList');
    var label = document.getElementById('projCountLabel');
    if(label) label.textContent = projects.length + ' مشروع';
    if(!projects.length){
        box.innerHTML='<div class="empty-hint">لا توجد مشاريع مُسندة إليك حالياً.</div>';
        return;
    }
    // Store for detail view
    window._projectsData = projects;
    var h = '<div class="emp-proj-grid">';
    projects.forEach(function(p){
        var pm = (p.progressMap && p.progressMap[TG_USER.uid]) || {progress:0, status:'لم يبدأ', note:''};
        var prog = pm.progress || 0;
        var mine = (p.createdByUid === TG_USER.uid);
        var isCompleted = (p.status === 'مكتمل') || (pm.status === 'مكتمل');
        // Stripe color by priority
        var stripeColor = p.priority === 'عالية' ? 'linear-gradient(90deg,var(--no),#e87272)'
            : p.priority === 'منخفضة' ? 'linear-gradient(90deg,var(--ok),#40c674)'
            : 'linear-gradient(90deg,var(--nv),var(--gd))';
        // تمييز المشاريع ذات الملاحظات/التعليقات
        var hasComments = (p.comments && p.comments.length > 0);
        var commentBadge = hasComments
            ? '<span style="background:var(--no);color:#fff;border-radius:12px;padding:1px 7px;font-size:9px;font-weight:800;margin-right:4px">💬 '+p.comments.length+'</span>'
            : '';
        // بطاقة مكتملة بتصميم مختلف
        var cardStyle = isCompleted ? 'opacity:.7;border:1.5px solid var(--ok)' : '';
        
        var pVal = p.priority === 'عالية' ? 3 : (p.priority === 'متوسطة' ? 2 : 1);
        var sVal = isCompleted ? 3 : (pm.status === 'متوقف' ? 1 : 2);
        var dVal = (p.createdAt && p.createdAt.toMillis) ? p.createdAt.toMillis() : ((p.createdAt && new Date(p.createdAt).getTime()) || 0);
        var dlVal = p.deadline ? new Date(p.deadline).getTime() : 9999999999999;

        h += '<div class="emp-proj-card" onclick="openProjectDetail(\''+p.id+'\')" style="'+cardStyle+'" data-prio="'+pVal+'" data-status="'+sVal+'" data-date="'+dVal+'" data-deadline="'+dlVal+'">';
        h += '<div class="emp-proj-card-stripe" style="background:'+(isCompleted?'linear-gradient(90deg,var(--ok),#40c674)':stripeColor)+'"></div>';
        h += '<div class="emp-proj-card-top">';
        h += '<div class="emp-proj-card-title">'+esc(p.title||'بدون عنوان')+(mine?' <span class="badge" style="background:var(--gd);color:#1b2a4a;font-size:8.5px">مشروعي</span>':'')+(isCompleted?' <span style="background:var(--ok);color:#fff;border-radius:12px;padding:1px 7px;font-size:9px;font-weight:800">✅ مكتمل</span>':'')+commentBadge+'</div>';
        if(p.description) h += '<div class="emp-proj-card-desc">'+esc(p.description)+'</div>';
        
        // Progress Section
        h += '<div style="margin-top:auto">';
        h += '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:5px;color:var(--nv)"><span>التقدم</span><span>'+prog+'%</span></div>';
        h += '<div class="emp-proj-card-bar"><div class="emp-proj-card-bar-in" style="width:'+prog+'%"></div></div>';
        h += '</div>';
        h += '</div>'; // end top
        
        h += '<div class="emp-proj-card-footer">';
        h += '<span>'+(p.priority?'<span class="tg-tag tg-tag-prio-'+(p.priority==='عالية'?'high':(p.priority==='منخفضة'?'low':'med'))+'">'+p.priority+'</span>':'')+'</span>';
        h += '<span>'+(p.deadline ? '📅 ' + p.deadline : 'بلا موعد')+'</span>';
        h += '</div>';
        h += '</div>';
    });
    h += '</div>';
    box.innerHTML = h;
}
function openProjectDetail(pid){
    var p = window._projectsData && window._projectsData.find(function(x){ return x.id===pid; });
    if(!p) return;
    var pm = (p.progressMap && p.progressMap[TG_USER.uid]) || {progress:0, status:'لم يبدأ', note:''};
    var prog = pm.progress || 0;
    var mine = (p.createdByUid === TG_USER.uid);

    document.getElementById('projListView').style.display = 'none';
    var dv = document.getElementById('projDetailView');
    dv.style.display = 'block';

    var h = '<div class="emp-proj-detail">';
    // Back button
    h += '<button class="emp-proj-back" onclick="closeProjectDetail()">&#x2B05; العودة لقائمة المشاريع</button>';
    // Header
    h += '<div class="emp-proj-detail-header">';
    h += '<div class="emp-proj-detail-title">'+esc(p.title||'بدون عنوان')+(mine?' <span class="badge" style="background:rgba(201,162,39,.25);color:#fde47f;font-size:9px">مشروعي</span>':'')+'</div>';
    if(p.description) h += '<div class="emp-proj-detail-desc">'+esc(p.description)+'</div>';
    h += '<div class="emp-proj-detail-tags">'+projectTagsHtml(p)+'</div>';
    if(p.createdBy) h += '<div style="font-size:11px;color:var(--tx3);margin-top:6px">👤 أُنشئ بواسطة: <strong>'+esc(p.createdBy)+'</strong>'+(p.createdByRole?' ('+esc(p.createdByRole)+')':'')+'</div>';
    if(p.fileUrl){
        var fType = p.fileType || '';
        h += '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd)">';
        if(fType.indexOf('image/')===0){
            h += '<a href="'+p.fileUrl+'" target="_blank"><img src="'+p.fileUrl+'" style="max-width:100%;max-height:200px;border-radius:6px;display:block"></a>';
        } else if(fType.indexOf('video/')===0){
            h += '<video src="'+p.fileUrl+'" controls style="max-width:100%;max-height:200px;border-radius:6px"></video>';
        } else {
            h += '<a href="'+p.fileUrl+'" target="_blank" style="color:var(--nv);font-weight:700;text-decoration:underline;display:inline-block">📎 '+esc(p.fileName||'ملف مرفق')+'</a>';
        }
        h += '</div>';
    }
    if(p.linkUrl){
        h += '<div style="margin-top:8px"><a href="'+esc(p.linkUrl)+'" target="_blank" style="color:var(--gd);font-weight:700;text-decoration:underline;font-size:13px">🔗 رابط خارجي للمشروع</a></div>';
    }
    h += '</div>'; // end header

    // Section 1: Progress
    h += '<div class="proj-sec">';
    h += '<div class="proj-sec-title">📊 تقدّمي في المشروع</div>';
    
    h += '<div class="prog-ui-container">';
    h += '<div class="prog-ui-bg-icon">📊</div>';
    h += '<span class="prog-ui-val" id="dpv_'+p.id+'">'+prog+'%</span>';
    h += '<span class="prog-ui-lbl">نسبة الإنجاز الحالية</span>';
    h += '<input type="range" class="modern-slider" min="0" max="100" value="'+prog+'" id="dpr_'+p.id+'" oninput="document.getElementById(\'dpv_'+p.id+'\').textContent=this.value+\'%\';document.getElementById(\'dpbar_fill_'+p.id+'\').style.width=this.value+\'%\'">';
    h += '<div class="prog-bar-container"><div class="prog-bar-fill" id="dpbar_fill_'+p.id+'" style="width:'+prog+'%"></div></div>';
    h += '</div>';

    h += '<div class="modern-card">';
    h += '<div class="fr fr2">';
    h += '<div class="fg"><label>الحالة الحالية</label><select id="dps_'+p.id+'" style="height:42px;border-radius:10px">'+['لم يبدأ','جاري العمل','مكتمل'].map(function(s){return '<option'+(pm.status===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div>';
    h += '<div class="fg"><label>ملاحظة عن الإنجاز (اختياري)</label><input type="text" id="dpn_'+p.id+'" style="height:42px;border-radius:10px" placeholder="مثال: انتهيت من التصاميم الأولية..." value="'+esc(pm.note||'')+'"></div>';
    h += '</div>';
    h += '<button class="bt bt-p" style="margin-top:20px;width:100%;height:48px;font-size:15px;font-weight:800;box-shadow:0 10px 20px rgba(15,23,42,0.15)" onclick="saveProjDetailProgress(\''+p.id+'\')">💾 حفظ تحديث التقدم</button>';
    h += '<div id="dpmsg_'+p.id+'" style="font-size:12px;margin-top:12px;text-align:center;font-weight:600"></div>';
    h += '</div>';
    h += '</div>'; // end proj-sec

    // Section 2: Chat / Discussion
    h += '<div class="proj-sec">';
    h += '<div class="proj-sec-title">💬 النقاش والملاحظات</div>';
    h += projectChatHtml(p.id, 'empChatLog_'+p.id, 'empChatInput_'+p.id);
    h += '</div>';

    // Section 3: Manage (mine only) - Removed due to Firestore rules (employees cannot edit/delete projects)

    h += '</div>'; // end emp-proj-detail
    dv.innerHTML = h;
    renderProjectChat(p.id, p.comments||[], 'empChatLog_'+p.id);
}
function closeProjectDetail(){
    document.getElementById('projDetailView').style.display = 'none';
    document.getElementById('projDetailView').innerHTML = '';
    document.getElementById('projListView').style.display = 'block';
}
function saveProjDetailProgress(id){
    var prog = parseInt(document.getElementById('dpr_'+id).value)||0;
    var status = document.getElementById('dps_'+id).value;
    var note = document.getElementById('dpn_'+id).value;
    var msg = document.getElementById('dpmsg_'+id);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    
    // Check if late on completion
    var isLate = false;
    if(status === 'مكتمل'){
        var p = window._projectsData && window._projectsData.find(function(x){ return x.id===id; });
        if(p && p.deadline) {
            var dl = new Date(p.deadline);
            dl.setHours(23,59,59,999);
            if(new Date() > dl) isLate = true;
        }
    }

    var upd = {}; upd['progressMap.'+TG_USER.uid] = {progress:prog, status:status, note:note, updatedAt:new Date()};
    db.collection('projects').doc(id).update(upd)
        .then(function(){ 
            msg.style.color='var(--ok)'; msg.textContent='✅ تم حفظ التحديث.'; 
            if(status === 'مكتمل' && typeof tgCelebrate === 'function') tgCelebrate(isLate);
            // إشعار الأدمن
            db.collection('projects').doc(id).get().then(function(doc){
                var pTitle = doc.exists ? doc.data().title : 'مشروع';
                tgNotifyAdmins('📈 تحديث إنجاز مشروع', (TG_USER.name||'موظف') + ' حدث تقدمه في: ' + pTitle + ' إلى ' + prog + '%', 'project-progress');
                if(status === 'مكتمل') {
                    db.collection('achievements').add({
                        uid: TG_USER.uid, userName: TG_USER.name,
                        title: 'إتمام مشروع: ' + pTitle,
                        description: 'إنجاز تلقائي (مشروع)',
                        date: new Date().toISOString().split('T')[0],
                        reactions: {}, createdAt: new Date()
                    }).catch(function(){});
                }
            }).catch(function(){});
        })
        .catch(function(e){ msg.style.color='var(--no)'; msg.textContent='❌ '+e.message; });
}
// saveMyProjDetailEdit removed


// legacy employee project creation/editing functions removed
function saveProjectProgress(id){
    var progress=parseInt(document.getElementById('pr_'+id).value,10)||0;
    var status=document.getElementById('ps_'+id).value;
    var note=document.getElementById('pn_'+id).value||'';
    var msg=document.getElementById('pmsg_'+id);
    var field={}; field['progressMap.'+TG_USER.uid]={progress:progress,status:status,note:note,updatedAt:new Date()};
    db.collection('projects').doc(id).update(field).then(function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم الحفظ';
        if(status === 'مكتمل' && typeof tgCelebrate === 'function') tgCelebrate();
        setTimeout(function(){msg.textContent='';},2500);
        // إشعار الأدمن
        db.collection('projects').doc(id).get().then(function(doc){
            var pTitle = doc.exists ? doc.data().title : 'مشروع';
            tgNotifyAdmins('📊 تحديث حالة مشروع', (TG_USER.name||'موظف') + ' حدث حالة ' + pTitle + ' إلى: ' + status, 'project-status');
            if(status === 'مكتمل') {
                db.collection('achievements').add({
                    uid: TG_USER.uid, userName: TG_USER.name,
                    title: 'إتمام مشروع: ' + pTitle,
                    description: 'إنجاز تلقائي (مشروع)',
                    date: new Date().toISOString().split('T')[0],
                    reactions: {}, createdAt: new Date()
                }).catch(function(){});
            }
        }).catch(function(){});
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

// ── لوحة الإنجازات ────────────────────────────────────────────────────────
var _achUnsub = null;
var _achFilter = 'mine';

function loadMyAchievements(){
    if(_achUnsub) _achUnsub();
    var box=document.getElementById('myAchList');
    
    loadTeammates(function() {
        var namesMap = {};
        if(_teammatesCache) _teammatesCache.forEach(function(e){ namesMap[e.id] = e.name; });
        namesMap[TG_USER.uid] = TG_USER.name;

        _achUnsub = db.collection('achievements').orderBy('date', 'desc').limit(50).onSnapshot(function(snap){
            window._lastAchSnap = snap;
            renderAchievements(snap, namesMap);
        }, function(err){ 
            if(box) box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر التحميل: '+esc(err.message)+'</div>'; 
        });
    });
}

function renderAchievements(snap, namesMap) {
    var box=document.getElementById('myAchList');
    if(!box) return;
    if(!snap || snap.empty){ 
        box.innerHTML='<div class="empty-hint">لا توجد إنجازات مسجّلة بعد. كن أول من يضيف إنجازاً!</div>'; 
        return; 
    }

    var h='<div style="display:flex;flex-direction:column;gap:16px">';
    var count = 0;
    
    snap.forEach(function(doc){
        var a = doc.data();
        var isMine = a.uid === TG_USER.uid;
        
        // Filter based on selected tab
        if(_achFilter === 'mine' && !isMine) return;
        if(_achFilter === 'team' && isMine) return;
        
        count++;
        var reactions = a.reactions || {};
        var displayName = a.userName || namesMap[a.uid] || 'موظف';
        var isAnyAdmin = (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin');
        var canDelete = isAnyAdmin || isMine;
        
        h+='<div class="ac-row" style="border-right:4px solid '+(isMine?'var(--ok)':'var(--gd)')+'">'+
           '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
           '<div><div style="font-weight:700;color:var(--gd);font-size:13px;margin-bottom:2px">👤 '+displayName+(isMine?' (أنت)':'')+'</div>'+
           '<div class="ac-t" style="font-size:15px">🏆 '+esc(a.title)+'</div></div>'+
           '<div style="display:flex;gap:4px">'+
             (isMine?'<button class="bt bt-o" style="padding:2px 8px;font-size:10px" onclick="printAchievementDoc(TG_USER,{title:\''+esc(a.title)+'\',description:\''+esc(a.description||'')+'\',date:\''+esc(a.date||'')+'\'})">🖨 طباعة</button>':'')+
             (canDelete?'<button class="bt bt-o" style="padding:2px 8px;font-size:10px;border-color:var(--no);color:var(--no)" onclick="deleteAchievement(\''+doc.id+'\')">🗑 حذف</button>':'')+
           '</div>'+
           '</div>'+
           (a.description?'<div class="ac-meta">'+esc(a.description)+'</div>':'')+
           '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">'+
             '<div style="font-size:10px;color:var(--tx3)">📅 '+esc(a.date||'')+'</div>'+
             '<div class="ac-reactions" style="display:flex;gap:6px;align-items:center">'+
               renderReactions(doc.id, reactions, namesMap)+
               '<div class="reaction-picker" style="position:relative">'+
                 '<button class="bt-reaction-add" onclick="toggleEmojiPicker(\''+doc.id+'\')">➕</button>'+
                 '<div id="picker-'+doc.id+'" class="emoji-picker-popup">'+
                   ['👏','🔥','⭐','🙌','💪','❤️'].map(e => '<span onclick="addReaction(\''+doc.id+'\',\''+e+'\')">'+e+'</span>').join('')+
                 '</div>'+
               '</div>'+
             '</div>'+
           '</div>'+
           '</div>';
    });
    
    if(count === 0) {
        var msg = _achFilter === 'mine' ? 'لم تقم بإضافة أي إنجازات بعد.' : 'لا توجد إنجازات من الزملاء حالياً.';
        box.innerHTML = '<div class="empty-hint">' + msg + '</div>';
    } else {
        h+='</div>';
        box.innerHTML=h;
    }
}

function switchAchFilter(f) {
    _achFilter = f;
    var tMine = document.getElementById('achTabMine');
    var tTeam = document.getElementById('achTabTeam');
    if(tMine) tMine.classList.toggle('active', f === 'mine');
    if(tTeam) tTeam.classList.toggle('active', f === 'team');
    
    // Use cached snapshot to re-render immediately
    if(window._lastAchSnap) {
        var namesMap = {};
        if(_teammatesCache) _teammatesCache.forEach(function(e){ namesMap[e.id] = e.name; });
        namesMap[TG_USER.uid] = TG_USER.name;
        renderAchievements(window._lastAchSnap, namesMap);
    } else {
        loadMyAchievements();
    }
}

function renderReactions(docId, reactions, namesMap) {
    var h = '';
    for (var emoji in reactions) {
        var uids = reactions[emoji];
        var count = uids.length;
        if (count > 0) {
            var reacted = uids.indexOf(TG_USER.uid) > -1;
            var hoverNames = uids.map(uid => namesMap[uid] || 'موظف').join('، ');
            h += '<div class="reaction-chip '+(reacted?'active':'')+'" title="'+esc(hoverNames)+'" onclick="addReaction(\''+docId+'\',\''+emoji+'\')">'+
                 emoji + ' <span class="count">' + count + '</span>'+
                 '</div>';
        }
    }
    return h;
}

function toggleEmojiPicker(id) {
    var p = document.getElementById('picker-'+id);
    var all = document.querySelectorAll('.emoji-picker-popup');
    all.forEach(el => { if(el.id !== 'picker-'+id) el.classList.remove('show'); });
    p.classList.toggle('show');
}

function addReaction(docId, emoji) {
    var docRef = db.collection('achievements').doc(docId);
    db.runTransaction(function(transaction) {
        return transaction.get(docRef).then(function(doc) {
            if (!doc.exists) return;
            var reactions = doc.data().reactions || {};
            if (!reactions[emoji]) reactions[emoji] = [];
            
            var idx = reactions[emoji].indexOf(TG_USER.uid);
            if (idx > -1) {
                reactions[emoji].splice(idx, 1);
            } else {
                reactions[emoji].push(TG_USER.uid);
            }
            transaction.update(docRef, { reactions: reactions });
        });
    }).then(function() {
        document.querySelectorAll('.emoji-picker-popup').forEach(el => el.classList.remove('show'));
    }).catch(function(err) { console.error("Reaction failed: ", err); });
}

function addAchievement(){
    var title=(document.getElementById('achTitle').value||'').trim();
    var date=document.getElementById('achDate').value||new Date().toISOString().split('T')[0];
    var desc=(document.getElementById('achDesc').value||'').trim();
    var msg=document.getElementById('achMsg');
    if(!title){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب عنوان الإنجاز.'; return; }
    db.collection('achievements').add({
        uid:TG_USER.uid, 
        userName:TG_USER.name,
        title:title, 
        description:desc, 
        date:date,
        reactions: {},
        createdAt: new Date()
    }).then(function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تمت الإضافة';
        document.getElementById('achTitle').value=''; document.getElementById('achDesc').value='';
        showCelebration();
        sendAchievementNotification(title);
        loadMyAchievements();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

function deleteAchievement(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) return;
    db.collection('achievements').doc(id).delete()
        .catch(function(err){ alert('❌ فشل الحذف: ' + err.message); });
}

function sendAchievementNotification(achTitle) {
    loadTeammates(function() {
        if (!_teammatesCache) return;
        _teammatesCache.forEach(function(emp) {
            db.collection('notifications').add({
                toUid: emp.id,
                fromUid: TG_USER.uid,
                fromName: TG_USER.name,
                title: 'إنجاز جديد! 🏆',
                body: 'قام ' + TG_USER.name + ' بإضافة إنجاز: ' + achTitle,
                type: 'achievement',
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        // إشعار للأدمن أيضاً
        tgNotifyAdmins('🏆 إنجاز جديد لموظف', 'قام الموظف ' + TG_USER.name + ' بإضافة إنجاز جديد: ' + achTitle, 'achievement-new');
    });
}

function showCelebration() {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#c9a227', '#ffffff', '#22c55e', '#3b82f6'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}


// ── مهامي ───────────────────────────────────────────────────────────
var _tasksUnsub = null;
var _teammatesCache = null;
function loadTeammates(cb){
    // جلب جميع الموظفين والمديرين لضمان وصول الإشعارات للجميع وربط الأسماء بشكل صحيح
    db.collection('users').get().then(function(snap){
        _teammatesCache = [];
        snap.forEach(function(d){
            var u = d.data();
            _teammatesCache.push({id:d.id, name:u.name, role:u.role});
        });
        if(cb) cb();
    }).catch(function(err){ console.error("Error loading teammates:", err); if(cb) cb(); });
}

function loadMyTasks(){
    loadTeammates(function(){
        if(_tasksUnsub) return;
    var isInitialTasks = true;
    var box = document.getElementById('myTasksList');
    _tasksUnsub = db.collection('tasks').where('assignedTo','==',TG_USER.uid)
        .onSnapshot(function(snap){
            if(snap.empty){
                box.innerHTML='<div class="empty-hint">لا توجد مهام مُكلَّفة إليك حالياً.</div>';
                updateTasksBadge(0);
                window._currentTaskIds = [];
                isInitialTasks = false;
                return;
            }
            var rows=[];
            snap.forEach(function(d){rows.push(Object.assign({id:d.id},d.data()));});
            rows.sort(function(a,b){
                var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                return bm-am;
            });
            
            renderTasksHtml(rows);
            
            var currentIds = rows.map(function(t){ return t.id; });
            window._currentTaskIds = currentIds;
            
            var seenTasks = JSON.parse(localStorage.getItem('seen_tasks_'+TG_USER.uid) || '[]');
            var isTabActive = document.getElementById('epg-tasks').classList.contains('a');
            
            if(isTabActive){
                currentIds.forEach(function(id){
                    if(seenTasks.indexOf(id)===-1) seenTasks.push(id);
                });
                localStorage.setItem('seen_tasks_'+TG_USER.uid, JSON.stringify(seenTasks));
            }
            
            var unseenCount = 0;
            currentIds.forEach(function(id){
                if(seenTasks.indexOf(id)===-1) unseenCount++;
            });
            
            if(!isInitialTasks){
                var hasNewTask = false;
                snap.docChanges().forEach(function(change){
                    if(change.type==='added') hasNewTask = true;
                });
                if(hasNewTask){
                    playTaskProjNotification();
                }
            }
            
            updateTasksBadge(unseenCount);
            isInitialTasks = false;
        }, function(err){
            box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل المهام: '+esc(err.message)+'</div>';
        });
    });
}

function renderTasksHtml(rows){
    var box=document.getElementById('myTasksList');

    function taskCard(t){
        var attachHtml = '';
        if(t.fileUrl && t.fileType){
            if(t.fileType.indexOf('image/')===0){
                attachHtml = '<div style="margin-top:6px"><a href="'+t.fileUrl+'" target="_blank"><img src="'+t.fileUrl+'" style="max-width:140px;max-height:100px;border-radius:6px;display:block"></a></div>';
            } else if(t.fileType.indexOf('video/')===0){
                attachHtml = '<div style="margin-top:6px"><video src="'+t.fileUrl+'" controls style="max-width:180px;border-radius:6px"></video></div>';
            } else {
                attachHtml = '<div style="margin-top:6px"><a href="'+t.fileUrl+'" target="_blank" style="color:var(--nv);font-weight:700;text-decoration:underline">📎 '+esc(t.fileName||'ملف مرفق')+'</a></div>';
            }
        }
        var isDone = t.status === 'مكتمل';
        var isOverdue = t.deadline && !isDone && new Date(t.deadline) < new Date();
        var cardStyle = isDone ? 'opacity:.65;border-right-color:var(--ok)' : (isOverdue ? 'border-right-color:var(--no)' : '');

        var createdAtStr = '';
        if(t.createdAt && typeof t.createdAt.toDate === 'function') {
            var cd = t.createdAt.toDate();
            createdAtStr = cd.toLocaleString('en-US', { hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('AM', 'ص').replace('PM', 'م');
        } else if(t.createdAt) {
            var cd = new Date(t.createdAt);
            if(!isNaN(cd.getTime())) createdAtStr = cd.toLocaleString('en-US', { hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('AM', 'ص').replace('PM', 'م');
        }

        var historyHtml = '';
        if(t.history && t.history.length > 0) {
            historyHtml += '<div style="margin-top:10px;padding:8px;background:rgba(0,0,0,0.03);border-radius:6px;font-size:11px">';
            historyHtml += '<div style="font-weight:700;color:var(--nv);margin-bottom:6px">📜 مسار المهمة:</div>';
            t.history.forEach(function(hi){
                if(hi.action === 'forwarded') {
                    var dStr = hi.date ? new Date(hi.date).toLocaleString('en-US', { hour12: true, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('AM', 'ص').replace('PM', 'م') : '';
                    historyHtml += '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid var(--bd)">';
                    historyHtml += '<div><span style="color:var(--gd);font-weight:700">من:</span> '+esc(hi.fromName)+' <span style="color:var(--gd);font-weight:700">إلى:</span> '+esc(hi.toName)+' <span style="color:var(--tx3);font-size:9.5px">('+dStr+')</span></div>';
                    historyHtml += '<div style="margin-top:2px;color:var(--tx2)">💬 '+esc(hi.note)+'</div>';
                    historyHtml += '</div>';
                }
            });
            historyHtml += '</div>';
        }

        var pVal = t.priority === 'عالية' ? 3 : (t.priority === 'متوسطة' ? 2 : 1);
        var sVal = t.status === 'مكتمل' ? 3 : (t.status === 'جاري العمل' ? 2 : 1);
        var dVal = (t.createdAt && t.createdAt.toMillis) ? t.createdAt.toMillis() : ((t.createdAt && new Date(t.createdAt).getTime()) || 0);
        var dlVal = t.deadline ? new Date(t.deadline).getTime() : 9999999999999;
        var empVal = esc(t.assignedToName || '');

        return '<div class="pj-row" style="'+cardStyle+'" data-prio="'+pVal+'" data-status="'+sVal+'" data-date="'+dVal+'" data-deadline="'+dlVal+'" data-emp="'+empVal+'" data-priority="'+esc(t.priority||'متوسطة')+'" data-taskstatus="'+(isDone?'مكتمل':(t.status||'لم يبدأ'))+'">'+
            '<div class="pj-t">'+esc(t.title||'بدون عنوان')+
            ' <span class="badge badge-prio"'+(isDone?' style="background:var(--ok);color:#fff"':'')+(isOverdue?' style="background:var(--no);color:#fff"':'')+'>'+esc(t.priority||'متوسطة')+'</span>'+
            (isDone?' <span style="background:var(--ok);color:#fff;border-radius:10px;padding:1px 8px;font-size:9px;font-weight:800">✅ مكتملة</span>':'')+(isOverdue?' <span style="background:var(--no);color:#fff;border-radius:10px;padding:1px 8px;font-size:9px;font-weight:800">⏰ متأخرة</span>':'')+
            '</div>'+
            (t.description?'<div class="pj-meta">'+esc(t.description)+'</div>':'')+
            (createdAtStr?'<div class="pj-meta" style="font-size:10.5px;color:var(--tx3);margin-top:2px">🕒 تاريخ الإنشاء: <strong>'+createdAtStr+'</strong></div>':'')+
            (t.deadline?'<div class="pj-meta"'+(isOverdue?' style="color:var(--no);font-weight:700"':'')+'>📅 تاريخ التسليم: '+esc(t.deadline)+'</div>':'')+
            (t.createdBy?'<div class="pj-meta" style="font-size:10.5px;color:var(--tx3);margin-top:2px">👤 أنشأها: <strong>'+esc(t.createdBy)+'</strong>'+(t.createdByRole?' <span style="opacity:.75">('+esc(t.createdByRole)+')</span>':'')+'</div>':'')+
            attachHtml+
            historyHtml+
            (isDone?'<div style="font-size:11px;color:var(--ok);font-weight:700;margin-top:8px">✅ تم إنجاز هذه المهمة</div>':
            '<div class="fg" style="max-width:220px;margin:8px 0"><label>حالة المهمة</label><select id="tks_'+t.id+'" onchange="saveTaskStatus(\''+t.id+'\')">'+
            ['لم يبدأ','جاري العمل','متوقف','مكتمل'].map(function(s){return '<option'+(s===(t.status||'لم يبدأ')?' selected':'')+'>'+s+'</option>';}).join('')+
            '</select></div>'+
            '<button class="bt bt-p" onclick="saveTaskStatus(\''+t.id+'\')">💾 حفظ الحالة</button>'+
            ' <span id="tkmsg_'+t.id+'" style="font-size:10.5px"></span>'+
            '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd)">'+
            '<div style="font-size:11px;font-weight:700;color:var(--nv);margin-bottom:6px">🔄 إرسال المهمة لزميل</div>'+
            '<div class="fg" style="margin-bottom:8px"><label>اختر الزميل</label><select id="tkfwd_'+t.id+'"><option value="">-- اختر الزميل --</option>'+
            (_teammatesCache||[]).map(function(emp){return '<option value="'+emp.id+'">'+esc(emp.name)+'</option>';}).join('')+
            '</select></div>'+
            '<div class="fg" style="margin-bottom:8px"><label>ماذا أنجزت؟ (ملاحظة للأدمن والزميل)</label><textarea id="tkfwd_note_'+t.id+'" rows="2" placeholder="اكتب ما أنجزته أو سبب الإرسال..."></textarea></div>'+
            '<button class="bt bt-o" onclick="forwardTask(\''+t.id+'\')">📩 إرسال المهمة للزميل</button>'+
            ' <span id="tkfwd_msg_'+t.id+'" style="font-size:10.5px"></span>'+
            '</div>')+
            '</div>';
    }

    if(!rows.length){
        box.innerHTML = '<div class="empty-hint">لا توجد مهام مكلّفة إليك حالياً.</div>';
    } else {
        var h = '<div class="tasks-grid">';
        rows.forEach(function(t){ h += taskCard(t); });
        h += '</div>';
        box.innerHTML = h;
    }

    tgUpdateEmpTaskTabCounts(rows);
    tgApplyEmpTaskFilter();
}


window.updateTasksEmployeeSummary = function() {
    var cards = document.querySelectorAll('#myTasksList .pj-row');
    var total = 0, pending = 0, progress = 0, hold = 0, completed = 0, overdue = 0;

    cards.forEach(function(card) {
        if (card.style.display !== 'none') {
            total++;
            var cardStatus = card.getAttribute('data-taskstatus') || 'لم يبدأ';
            var dlVal = card.getAttribute('data-deadline');
            var deadlineTime = parseFloat(dlVal);
            var isOD = deadlineTime && deadlineTime < 9999999999999 && deadlineTime < Date.now() && cardStatus !== 'مكتمل';

            if (isOD) overdue++;
            if (cardStatus === 'مكتمل') completed++;
            else if (cardStatus === 'جاري العمل') progress++;
            else if (cardStatus === 'متوقف') hold++;
            else pending++;
        }
    });

    var summaryBox = document.getElementById('tasksEmployeeSummary');
    if (summaryBox) {
        summaryBox.innerHTML =
            '<div class="p-stat-box"><div class="p-stat-val">'+total+'</div><div class="p-stat-lbl">إجمالي مهامي</div></div>' +
            '<div class="p-stat-box" style="border-right: 3px solid var(--gd)"><div class="p-stat-val" style="color:var(--gd)">'+pending+'</div><div class="p-stat-lbl">لم تبدأ</div></div>' +
            '<div class="p-stat-box" style="border-right: 3px solid #3b82f6"><div class="p-stat-val" style="color:#3b82f6">'+progress+'</div><div class="p-stat-lbl">جاري العمل</div></div>' +
            '<div class="p-stat-box" style="border-right: 3px solid #ef4444"><div class="p-stat-val" style="color:#ef4444">'+hold+'</div><div class="p-stat-lbl">متوقفة</div></div>' +
            '<div class="p-stat-box" style="border-right: 3px solid var(--ok)"><div class="p-stat-val" style="color:var(--ok)">'+completed+'</div><div class="p-stat-lbl">مكتملة</div></div>' +
            '<div class="p-stat-box" style="border-right: 3px solid var(--no)"><div class="p-stat-val" style="color:var(--no)">'+overdue+'</div><div class="p-stat-lbl">متأخرة ⏰</div></div>';
    }
};

function loadMyRequests(){
    var box=document.getElementById('myReqList');
    db.collection('requests').where('uid','==',TG_USER.uid).get().then(function(snap){
        if(snap.empty){ box.innerHTML='<div class="empty-hint">لا توجد طلبات بعد.</div>'; return; }
        var rows=[]; snap.forEach(function(d){rows.push(d.data());});
        rows.sort(function(a,b){
            var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
            var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
            return bm-am;
        });
        window._reqCache=rows;
        var html = `
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-bottom:12px;">
                <button type="button" onclick="tgExpandAllCards('myReqList')" class="bt bt-o" style="font-size:11px; padding:5px 12px; border-radius:16px; font-weight:700;">📂 فتح جميع الطلبات</button>
                <button type="button" onclick="tgCollapseAllCards('myReqList')" class="bt bt-o" style="font-size:11px; padding:5px 12px; border-radius:16px; font-weight:700;">📁 طي جميع الطلبات</button>
            </div>
        `;

        rows.forEach(function(r,i){
            // عرض المرفق إذا وجد
            var attachHtml = '';
            if(r.fileUrl && r.fileType){
                if(r.fileType.indexOf('image/')===0){
                    attachHtml = '<div style="margin-top:8px"><a href="'+r.fileUrl+'" target="_blank"><img src="'+r.fileUrl+'" style="max-width:180px;max-height:120px;border-radius:8px;display:block;border:1px solid var(--bd);"></a></div>';
                } else if(r.fileType.indexOf('video/')===0){
                    attachHtml = '<div style="margin-top:8px"><video src="'+r.fileUrl+'" controls style="max-width:220px;border-radius:8px;border:1px solid var(--bd);"></video></div>';
                } else {
                    attachHtml = '<div style="margin-top:8px"><a href="'+r.fileUrl+'" target="_blank" style="color:#0284c7;font-weight:700;font-size:11.5px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;background:rgba(2,132,199,0.08);padding:4px 12px;border-radius:16px;">📎 '+esc(r.fileName||'ملف مرفق')+'</a></div>';
                }
            }

            var dynamicFieldsHtml = '';
            if (r.dynamicData) {
                var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
                var fieldLabels = {};
                if (tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
                
                var items = [];
                for (var k in r.dynamicData) {
                    var v = r.dynamicData[k];
                    if (v === true) v = '✅ نعم / تم التسليم';
                    if (v === false) v = '❌ لا / غير مكتمل';
                    var lbl = fieldLabels[k] || k;
                    if (lbl === 'chk1') lbl = 'تسليم العهدة المالية';
                    if (lbl === 'chk2') lbl = 'تسليم العهدة العينية';
                    if (lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
                    if (lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';

                    items.push(
                        '<div style="background:var(--bg2); padding:10px 14px; border-radius:10px; border:1px solid var(--bd);">' +
                            '<span style="font-size:11.5px; color:var(--tx2); font-weight:700; display:block; margin-bottom:3px;">' + esc(lbl) + '</span>' +
                            '<strong style="font-size:13.5px; color:var(--tx); font-weight:800; word-break:break-word;">' + esc(v) + '</strong>' +
                        '</div>'
                    );
                }

                if (items.length > 0) {
                    dynamicFieldsHtml = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-top:12px; background:var(--bg); padding:14px; border-radius:12px; border:1px solid var(--bd);">' + items.join('') + '</div>';
                }
            }

            var dtStr = r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleString('ar-EG') : '';
            var bodyId = 'myReqBody_' + i;

            html += '<div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:18px; margin-bottom:16px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
                        '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">' +
                            '<h4 style="font-size:16px; font-weight:900; color:var(--tx); margin:0;">📝 ' + esc(r.type || 'طلب') + '</h4>' +
                            badgeReq(r.status) +
                            (dtStr ? '<span style="font-size:12px; color:var(--tx2); font-weight:700; background:var(--bg); padding:3px 10px; border-radius:12px; border:1px solid var(--bd);">📅 ' + esc(dtStr) + '</span>' : '') +
                        '</div>' +
                        '<div style="display:flex; align-items:center; gap:8px;">' +
                            '<button type="button" class="bt" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; font-size:12px; padding:6px 18px; font-weight:800; border-radius:20px; border:none; cursor:pointer;" onclick="printRequestDoc(TG_USER, window._reqCache[' + i + '])">🖨 طباعة</button>' +
                            '<button type="button" onclick="tgToggleCardDetails(\'' + bodyId + '\', this)" class="bt tg-toggle-btn" style="background:var(--bg); border:1.5px solid var(--bd); color:var(--tx); font-size:12.5px; padding:6px 16px; border-radius:30px; font-weight:800; cursor:pointer;">🔻 عرض التفاصيل والبنود</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="' + bodyId + '" class="tg-card-body" style="display:none; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">' +
                        (r.details ? '<div style="background:var(--bg); padding:10px 14px; border-radius:10px; border:1px solid var(--bd); font-size:13.5px; color:var(--tx); font-weight:600; margin-bottom:8px;">' + esc(r.details) + '</div>' : '') +
                        (r.fromDate ? '<div style="font-size:12.5px; color:var(--tx2); font-weight:700; margin-bottom:8px;">📅 الفترة: من ' + esc(r.fromDate) + (r.toDate ? (' إلى ' + esc(r.toDate)) : '') + '</div>' : '') +
                        dynamicFieldsHtml +
                        attachHtml +
                    '</div>' +
                 '</div>';
        });
        box.innerHTML = html;
    }).catch(function(err){ box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر التحميل: '+esc(err.message)+'</div>'; });
}
function initEmployeeReqForm() {
    if (!window.FS_TEMPLATES) {
        setTimeout(initEmployeeReqForm, 300);
        return;
    }
    var sel = document.getElementById('reqType');
    if(!sel) return;
    var html = '<option value="">-- اختر نوع النموذج أو الطلب --</option>';
    for (var k in window.FS_TEMPLATES) {
        html += '<option value="' + k + '">📝 ' + window.FS_TEMPLATES[k].title + '</option>';
    }
    html += '<option value="other">💬 طلب عادي / أخرى</option>';
    sel.innerHTML = html;
}
setTimeout(initEmployeeReqForm, 500);

function tgOnReqTypeChange(val) {
    var dynWrap = document.getElementById('reqDynamicFormWrap');
    var extWrap = document.getElementById('reqExtraFields');
    if (!val || val === 'other') {
        dynWrap.style.display = 'none';
        dynWrap.innerHTML = '';
        extWrap.style.display = 'block';
        return;
    }
    extWrap.style.display = 'none';
    dynWrap.style.display = 'block';
    
    var tpl = window.FS_TEMPLATES[val];
    var off = window.FS_OFFICIAL ? window.FS_OFFICIAL[val] : null;
    var h = '';
    
    if (off && typeof off.fill === 'function') {
        h = off.fill();
    } else if (tpl && typeof tpl.fill === 'function') {
        h = tpl.fill();
    } else if (tpl && tpl.fields) {
        h += '<div class="set-sec-title" style="margin-top:0">' + escH(tpl.title) + '</div>';
        tpl.fields.forEach(function(f) {
            h += '<div class="fg"><label>' + escH(f.label) + '</label>';
            if (f.type === 'textarea') {
                h += '<textarea data-fid="' + f.id + '" rows="2"></textarea>';
            } else if (f.type === 'select') {
                h += '<select data-fid="' + f.id + '">';
                (f.options||[]).forEach(function(opt) { h += '<option value="'+escH(opt)+'">'+escH(opt)+'</option>'; });
                h += '</select>';
            } else {
                h += '<input type="' + (f.type||'text') + '" data-fid="' + f.id + '">';
            }
            h += '</div>';
        });
    }
    dynWrap.innerHTML = h;
}

function submitRequest(){
    var type = document.getElementById('reqType').value;
    var dynWrap = document.getElementById('reqDynamicFormWrap');
    var msg = document.getElementById('reqMsg');
    
    if(!type){ msg.style.color='var(--no)'; msg.textContent='الرجاء اختيار نوع الطلب أولاً.'; return; }
    
    var reqData = {
        uid: TG_USER.uid,
        status: 'pending',
        createdAt: new Date()
    };
    
    var fileInput = document.getElementById('reqFile');
    var file = fileInput && fileInput.files && fileInput.files[0];
    
    if (type !== 'other') {
        var tpl = window.FS_TEMPLATES[type];
        reqData.type = 'نموذج: ' + (tpl ? tpl.title : type);
        reqData.formTemplateId = type;
        reqData.dynamicData = {};
        
        var missing = false;
        var radioFids = {};
        dynWrap.querySelectorAll('[data-fid]').forEach(function (el) {
            var fid = el.getAttribute('data-fid');
            if (el.type === 'radio') {
                radioFids[fid] = true;
                if (el.checked) reqData.dynamicData[fid] = el.value;
                return;
            }
            var v = (el.value || '').trim();
            if (el.type !== 'checkbox' && !v) missing = true;
            reqData.dynamicData[fid] = el.type === 'checkbox' ? el.checked : v;
        });
        Object.keys(radioFids).forEach(function (fid) { if (!reqData.dynamicData[fid]) missing = true; });
        
        if (missing) { msg.style.color = 'var(--no)'; msg.textContent = 'من فضلك املأ كل حقول النموذج.'; return; }
    } else {
        var details = (document.getElementById('reqDetails').value||'').trim();
        var from = document.getElementById('reqFrom').value||'';
        var to = document.getElementById('reqTo').value||'';
        if(!details){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب تفاصيل الطلب.'; return; }
        reqData.type = 'أخرى';
        reqData.details = details;
        reqData.fromDate = from;
        reqData.toDate = to;
    }

    var doSave = function(finalData) {
        msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الإرسال...';
        db.collection('requests').add(finalData).then(function(){
            msg.style.color='var(--ok)'; msg.textContent='✅ تم إرسال الطلب بنجاح';
            document.getElementById('reqType').value = '';
            tgOnReqTypeChange('');
            document.getElementById('reqDetails').value='';
            if(fileInput) fileInput.value='';
            document.getElementById('reqFileName').textContent='';
            loadMyRequests();
            tgNotifyAdmins('📩 طلب جديد من موظف', (TG_USER.name||'موظف') + ' أرسل طلباً جديداً: ' + finalData.type, 'request-new');
            setTimeout(function(){ msg.textContent=''; }, 3000);
        }).catch(function(err){ 
            msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; 
        });
    };

    if(file && type === 'other'){
        var MAX_MB = 20;
        if(file.size > MAX_MB * 1024 * 1024){ msg.style.color='var(--no)'; msg.textContent='الملف كبير جداً (الحد الأقصى '+MAX_MB+' MB).'; return; }
        var prog = document.getElementById('reqUploadProg');
        if(prog) { prog.style.display = 'block'; prog.textContent = '⏳ جاري رفع المرفق... 0%'; }
        var uniqueName = TG_USER.uid + '/' + Date.now() + '_' + file.name;
        tgUploadFile('requests', uniqueName, file,
            function(pct){ if(prog) prog.textContent = '⏳ جاري رفع المرفق... ' + pct + '%'; },
            function(errMsg){
                if(prog) prog.style.display='none';
                msg.style.color='var(--no)'; msg.textContent='❌ تعذر رفع الملف: '+errMsg;
            },
            function(publicUrl){
                if(prog) { prog.style.display='none'; prog.textContent=''; }
                reqData.fileUrl = publicUrl;
                reqData.fileName = file.name;
                reqData.fileType = file.type;
                doSave(reqData);
            }
        );
    } else {
        doSave(reqData);
    }
}

// ── تقاريري الأسبوعية ───────────────────────────────────────────────
function sundayOf(d){
    var dt=new Date(d);
    var day=dt.getDay(); // 0=Sun...6=Sat
    var diff= -day; // رجّع للأحد
    dt.setDate(dt.getDate()+diff);
    return dt.toISOString().split('T')[0];
}
function loadMyWeeklyReports(){
    var box=document.getElementById('myWkrList');
    db.collection('weeklyReports').where('uid','==',TG_USER.uid).get().then(function(snap){
        if(snap.empty){ box.innerHTML='<div class="empty-hint">لا توجد تقارير أسبوعية مُرسلة بعد.</div>'; return; }
        var rows=[]; snap.forEach(function(d){rows.push(Object.assign({id:d.id}, d.data()));});
        rows.sort(function(a,b){return (a.createdAt>b.createdAt)?-1:1;}); // Sort newest first
        var uniqueRows = [];
        var seen = {};
        rows.forEach(function(r){
            if(!seen[r.weekStart]){
                seen[r.weekStart] = true;
                uniqueRows.push(r);
            }
        });
        uniqueRows.sort(function(a,b){return (a.weekStart<b.weekStart)?1:-1;});
        window._wkrCache=uniqueRows;
        var h='';
        uniqueRows.forEach(function(r,i){
            var waMsg = encodeURIComponent(
                'التقرير الأسبوعي - ' + (TG_USER.name||'موظف') + '\n' +
                'الأسبوع: ' + (r.weekStart||'') + '\n' +
                '---\n' + (r.content||'')
            );
            h+='<div class="ac-row"><div class="ac-t">📆 أسبوع '+esc(r.weekStart||'')+
               ' <button class="bt bt-o" style="padding:2px 8px;font-size:10px;margin-right:8px" onclick="printWeeklyReportDoc(TG_USER,window._wkrCache['+i+'])">🖨 طباعة</button>'+
               ' <a href="https://wa.me/?text='+waMsg+'" target="_blank" class="bt bt-g" style="padding:2px 8px;font-size:10px;margin-right:8px;display:inline-flex;align-items:center;gap:4px;text-decoration:none">📲 واتساب</a></div>'+
               (r.content?'<div class="ac-meta">'+esc(r.content)+'</div>':'')+'</div>';
        });
        box.innerHTML=h;
    }).catch(function(err){ box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر التحميل: '+esc(err.message)+'</div>'; });
}
function submitWeeklyReport(){
    var btn = event ? event.currentTarget : null;
    if(btn) btn.disabled = true;
    var weekStart=document.getElementById('wkrStart').value||sundayOf(new Date());
    var content=(document.getElementById('wkrContent').value||'').trim();
    var msg=document.getElementById('wkrMsg');
    if(!content){ 
        msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب ملخص الأسبوع.'; 
        if(btn) btn.disabled = false;
        return; 
    }
    
    db.collection('weeklyReports').where('uid','==',TG_USER.uid).where('weekStart','==',weekStart).get().then(function(snap){
        if(!snap.empty){
            // Update existing report
            var docId = snap.docs[0].id;
            return db.collection('weeklyReports').doc(docId).update({
                content: content,
                createdAt: new Date(),
                reviewedByAdmin: false
            });
        } else {
            // Create new report
            return db.collection('weeklyReports').add({
                uid:TG_USER.uid,
                name: TG_USER.name || '',
                email: TG_USER.email || '',
                weekStart:weekStart, content:content,
                createdAt:new Date()
            });
        }
    }).then(function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم حفظ التقرير بنجاح';
        document.getElementById('wkrContent').value='';
        loadMyWeeklyReports();
        tgNotifyAdmins('📆 تقرير أسبوعي', (TG_USER.name||'موظف') + ' قام بتقديم تقريره الأسبوعي', 'weekly-report-new');
        if(btn) btn.disabled = false;
    }).catch(function(err){ 
        msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; 
        if(btn) btn.disabled = false;
    });
}
if(document.getElementById('wkrStart') && typeof sundayOf === 'function') document.getElementById('wkrStart').value=sundayOf(new Date());

// ── حماية الصفحة: لازم تسجيل دخول بصلاحية موظف ──────────────────
tgRequireAuth('employee', function(u){
    var isRemote = (u.workMode === 'remote');
    if (window._appSettingsCache && window._appSettingsCache.globalRemoteMode) {
        isRemote = true;
    }
    if (isRemote) {
        var tab = document.getElementById('empTabAtt');
        if (tab) tab.style.display = 'flex';
    } else {
        if(window.location.hash === '#att') window.location.hash = '';
    }
    if (typeof loadEmpAttendance === 'function') loadEmpAttendance();
    if(document.getElementById('empWhoName')) document.getElementById('empWhoName').textContent=u.name;
    if(document.getElementById('empWhoRole')) document.getElementById('empWhoRole').textContent=(u.jobTitle?(u.jobTitle+' · '):'')+'بوابة الموظف · '+u.email;
    if(document.getElementById('acctName')) document.getElementById('acctName').value=u.name||'';
    if(document.getElementById('acctEmail')) document.getElementById('acctEmail').value=u.email||'';
    if(document.getElementById('acctJobTitle')) document.getElementById('acctJobTitle').value=u.jobTitle||'';

    // تهيئة الهيدر الجديد للبروفايل في صفحة الحساب
    if(document.getElementById('acctProfileName')) document.getElementById('acctProfileName').textContent = u.name || u.email;
    if(document.getElementById('acctProfileJob')) document.getElementById('acctProfileJob').textContent = (u.jobTitle || 'موظف') + ' · ' + u.email;
    if(document.getElementById('acctAvatarInitials')) {
        var initials = (u.name || u.email || 'U').split(' ').map(function(n){return n[0];}).join('').toUpperCase().substring(0,2);
        document.getElementById('acctAvatarInitials').textContent = initials;
    }
    
    // Check App Settings for Attendance
    db.collection('settings').doc('appSettings').get().then(function(doc){
        if(doc.exists && doc.data().enableAttendance === false){
            var el = document.getElementById('empAttendanceSection');
            if(el) el.style.display = 'none';
        }
    });

    if (typeof loadMyProjects === 'function') loadMyProjects();
    if (typeof loadMyTasks === 'function') loadMyTasks();
    if (typeof loadWeeklyReportsEmp === 'function') loadWeeklyReportsEmp();
    if (typeof loadMyAchievements === 'function') loadMyAchievements();
    if (typeof loadMyRequests === 'function') loadMyRequests();
    if (typeof tgChatMount === 'function') tgChatMount();
    if (typeof tgChatWatch === 'function') tgChatWatch();
    if (typeof loadEmpAnnouncements === 'function') loadEmpAnnouncements();
    // نماذج مطلوبة من الأدمن لملئها وإرسالها
    if (typeof loadMyFormRequests === 'function') loadMyFormRequests(u.uid);
    // تفعيل استقبال Push Notifications من Firestore
    if (typeof tgListenMyNotifications === 'function') tgListenMyNotifications(u.uid);
    // تفعيل مركز الإشعارات للموظف
    if (typeof tgListenNotifCenter === 'function') tgListenNotifCenter(u.uid, tgRenderNotifPanel);
    // PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function(){});
    }
    if (typeof loadMyDocs === 'function') loadMyDocs();
    
    // Auto-expand textareas
    document.addEventListener('input', function(e) {
        if(e.target.tagName.toLowerCase() === 'textarea') {
            e.target.style.height = 'auto';
            e.target.style.height = (e.target.scrollHeight) + 'px';
        }
    });
});

// ─── حضور وانصراف الموظف ────────────────────────────────────────────────
var _todayAttDocId = null;
function loadEmpAttendance() {
    var now = new Date();
    var y = now.getFullYear();
    var m = ('0'+(now.getMonth()+1)).slice(-2);
    var d = ('0'+now.getDate()).slice(-2);
    var todayStr = y+'-'+m+'-'+d;
    var monthPrefix = y+'-'+m;

    db.collection('attendance_logs').where('uid','==',TG_USER.uid)
      .where('date', '>=', monthPrefix+'-01')
      .where('date', '<=', monthPrefix+'-31')
      .onSnapshot(function(snap){
          var box = document.getElementById('myAttList');
          if(snap.empty){
              box.innerHTML = '<div class="empty-hint">لا توجد سجلات حضور لهذا الشهر.</div>';
              _todayAttDocId = null;
              document.getElementById('btnCheckIn').disabled = false;
              document.getElementById('btnCheckOut').disabled = true;
              document.getElementById('attStatusMsg').textContent = '';
              return;
          }
          var arr = [];
          var todayLog = null;
          var uniqueDates = {};
          snap.forEach(function(doc){
              var data = doc.data();
              // الفلترة تتم الآن على مستوى السيرفر لزيادة الكفاءة
                  if (!uniqueDates[data.date]) {
                      uniqueDates[data.date] = data;
                      uniqueDates[data.date].docId = doc.id;
                      arr.push(data);
                  } else {
                      if (data.checkOut && !uniqueDates[data.date].checkOut) {
                          Object.assign(uniqueDates[data.date], data);
                          uniqueDates[data.date].docId = doc.id;
                      } else if (!uniqueDates[data.date].checkOut && data.checkIn > uniqueDates[data.date].checkIn) {
                          Object.assign(uniqueDates[data.date], data);
                          uniqueDates[data.date].docId = doc.id;
                      }
                  }
              });
          
          if(uniqueDates[todayStr]) { 
              todayLog = uniqueDates[todayStr]; 
              _todayAttDocId = uniqueDates[todayStr].docId; 
          }

          if(arr.length === 0 && !todayLog) {
              box.innerHTML = '<div class="empty-hint">لا توجد سجلات حضور لهذا الشهر.</div>';
              _todayAttDocId = null;
              document.getElementById('btnCheckIn').disabled = false;
              document.getElementById('btnCheckOut').disabled = true;
              document.getElementById('attStatusMsg').textContent = '';
              return;
          }

          arr.sort(function(a,b){ return a.date < b.date ? 1 : -1; });
          
          if(todayLog) {
              document.getElementById('btnCheckIn').disabled = true;
              if(todayLog.checkOut) {
                  document.getElementById('btnCheckOut').disabled = true;
                  document.getElementById('attStatusMsg').textContent = 'لقد سجلت حضورك وانصرافك بنجاح اليوم.';
                  document.getElementById('attStatusMsg').style.color = 'var(--ok)';
              } else {
                  document.getElementById('btnCheckOut').disabled = false;
                  document.getElementById('attStatusMsg').textContent = '✅ مسجل حضور ('+todayLog.checkIn+') — لا تنسَ تسجيل الانصراف.';
                  document.getElementById('attStatusMsg').style.color = 'var(--nv)';
              }
          } else {
              _todayAttDocId = null;
              document.getElementById('btnCheckIn').disabled = false;
              document.getElementById('btnCheckOut').disabled = true;
              document.getElementById('attStatusMsg').textContent = 'لم تقم بتسجيل الحضور اليوم.';
              document.getElementById('attStatusMsg').style.color = 'var(--tx3)';
          }

          var h = '<table class="dt"><tr><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th></tr>';
          arr.forEach(function(a){
              var cin = a.checkIn || '-';
              var cout = a.checkOut || '-';
              var th = '-';
              if(a.checkIn && a.checkOut){
                 var dt1 = new Date(a.date+'T'+a.checkIn);
                 var dt2 = new Date(a.date+'T'+a.checkOut);
                 var diff = (dt2-dt1)/3600000;
                 th = (diff>0?diff.toFixed(1):0) + ' ساعة';
              }
              h += '<tr><td>'+a.date+'</td><td>'+cin+'</td><td>'+cout+'</td><td>'+th+'</td></tr>';
          });
          h += '</table>';
          box.innerHTML = h;
      }, function(err) {
          var box = document.getElementById('myAttList');
          box.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر تحميل السجلات: ' + esc(err.message) + '</div>';
          document.getElementById('attStatusMsg').textContent = '';
      });
}

function empCheckIn() {
    if (_todayAttDocId) return; // already checked in
    if(!confirm('هل تريد تسجيل حضورك الآن؟')) return;
    document.getElementById('btnCheckIn').disabled = true;
    var now = new Date();
    var time = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
    var date = now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2)+'-'+('0'+now.getDate()).slice(-2);
    
    document.getElementById('attStatusMsg').textContent = '⏳ جارٍ التسجيل...';
    db.collection('attendance_logs').add({
        uid: TG_USER.uid,
        name: TG_USER.name,
        date: date,
        checkIn: time,
        checkOut: null,
        timestamp: new Date(),
        serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
        // إشعار الأدمن
        tgNotifyAdmins('🕒 تسجيل حضور موظف', 'قام الموظف ' + (TG_USER.name||'') + ' بتسجيل الحضور الآن (' + time + ')', 'att-check-in');
    }).catch(function(err){ 
        var msg = document.getElementById('attStatusMsg');
        msg.textContent = 'تعذر التسجيل: ' + err.message;
        msg.style.color = 'var(--no)';
    });
}

function empCheckOut() {
    if(!_todayAttDocId) return;
    if(!confirm('هل تريد تسجيل انصرافك؟ لن تتمكن من تعديله.')) return;
    document.getElementById('btnCheckOut').disabled = true;
    var now = new Date();
    var time = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
    document.getElementById('attStatusMsg').textContent = '⏳ جارٍ التسجيل...';
    db.collection('attendance_logs').doc(_todayAttDocId).update({
        checkOut: time,
        serverTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
        // إشعار الأدمن
        tgNotifyAdmins('🕒 تسجيل انصراف موظف', 'قام الموظف ' + (TG_USER.name||'') + ' بتسجيل الانصراف الآن (' + time + ')', 'att-check-out');
    }).catch(function(err){ 
        var msg = document.getElementById('attStatusMsg');
        msg.textContent = 'تعذر التسجيل: ' + err.message;
        msg.style.color = 'var(--no)';
    });
}

// ── مستنداتي ────────────────────────────────────────────────────────
function loadMyDocs() {
    db.collection('employeeDocuments').where('uid','==',TG_USER.uid).onSnapshot(function(snap){
        var box = document.getElementById('empDocsViewList');
        if(!box) return;
        if(snap.empty){
            box.innerHTML = '<div class="empty-hint">لم يتم رفع أي مستندات بعد.</div>';
            return;
        }
        var docs = [];
        snap.forEach(function(d){ docs.push(d); });
        docs.sort(function(a,b){
            var ta = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
            var tb = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
            return tb - ta;
        });

        var h = '<div style="display:flex;flex-direction:column;gap:8px">';
        docs.forEach(function(doc){
            var d = doc.data();
            var directBadge = d.isDirectToAdmin ? '<span class="badge" style="background:var(--gd);color:var(--nv);font-size:9px;margin-right:6px">📩 مرسل للأدمن مباشرة</span>' : '';
            h += '<div style="background:rgba(0,0,0,.3);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;border-right:3px solid var(--gd)">';
            h += '<div><div style="font-weight:bold;margin-bottom:4px">'+escH(d.title)+' '+directBadge+'</div>';
            h += '<div style="font-size:11px;opacity:.6">بواسطة: '+(d.uploadedBy==='admin'?'الإدارة':'أنت')+' · '+(d.createdAt&&d.createdAt.toDate?d.createdAt.toDate().toLocaleString('ar-EG'):'')+'</div></div>';
            h += '<div style="display:flex;gap:8px"><a href="'+d.fileUrl+'" target="_blank" class="bt bt-p" style="padding:4px 10px;font-size:11px;text-decoration:none">👁 عرض</a>';
            if(d.uploadedBy === 'employee'){
                h += '<button class="bt bt-d" style="padding:4px 10px;font-size:11px" onclick="empDeleteDoc(\''+doc.id+'\', \''+d.fileUrl+'\')">🗑 حذف</button>';
            }
            h += '</div></div>';
        });
        h += '</div>';
        box.innerHTML = h;
    }, function(err){
        var box = document.getElementById('empDocsViewList');
        if(box) box.innerHTML = '<div class="empty-hint" style="color:var(--no)">خطأ في تحميل المستندات: '+escH(err.message)+'</div>';
    });
}

function empUploadDoc() {
    var titleInp = document.getElementById('empNewDocTitle');
    var fileInp = document.getElementById('empNewDocFile');
    var msg = document.getElementById('empDocUploadMsg');
    var title = (titleInp.value||'').trim();
    if(!title){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى كتابة اسم المستند.'; return; }
    if(!fileInp.files || fileInp.files.length===0){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى اختيار ملف.'; return; }
    
    var file = fileInp.files[0];
    msg.style.color = '#fff'; msg.textContent = '⏳ جارٍ الرفع... يرجى الانتظار';
    tgUploadFile('employeeDocuments/'+TG_USER.uid, file.name, file, null, function(err){
        msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر رفع الملف: '+err;
    }, function(url) {
        db.collection('employeeDocuments').add({
            uid: TG_USER.uid,
            title: title,
            fileName: file.name,
            fileType: file.type,
            fileUrl: url,
            uploadedBy: 'employee',
            createdAt: new Date()
        }).then(function(){
            // إشعار للأدمن
            tgNotifyAdmins('📄 مستند جديد في ملف موظف', (TG_USER.name||'موظف') + ' رفع مستنداً جديداً لملفه الشخصي: ' + title, 'emp-doc-personal');
            titleInp.value = '';
            fileInp.value = '';
            msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم رفع المستند بنجاح.';
            setTimeout(function(){ msg.textContent=''; }, 3000);
        }).catch(function(err){
            msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر حفظ بيانات المستند: '+err.message;
        });
    });
}

function empSendDirectToAdmin() {
    var titleInp = document.getElementById('empDirectDocTitle');
    var fileInp = document.getElementById('empDirectDocFile');
    var msg = document.getElementById('empDirectUploadMsg');
    var title = (titleInp.value||'').trim();
    if(!title){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى كتابة اسم المستند.'; return; }
    if(!fileInp.files || fileInp.files.length===0){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى اختيار ملف.'; return; }
    
    var file = fileInp.files[0];
    msg.style.color = 'var(--gd)'; msg.textContent = '⏳ جارٍ الإرسال للأدمن... يرجى الانتظار';
    tgUploadFile('employeeDocuments/'+TG_USER.uid, 'direct_'+Date.now()+'_'+file.name, file, null, function(err){
        msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر رفع الملف: '+err;
    }, function(url) {
        db.collection('employeeDocuments').add({
            uid: TG_USER.uid,
            title: title,
            fileName: file.name,
            fileType: file.type,
            fileUrl: url,
            uploadedBy: 'employee',
            isDirectToAdmin: true,
            createdAt: new Date()
        }).then(function(){
            titleInp.value = '';
            fileInp.value = '';
            msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم إرسال المستند للأدمن بنجاح.';
            setTimeout(function(){ msg.textContent=''; }, 5000);
            
            // إشعار للأدمن
            tgNotifyAdmins('📄 مستند جديد مرسل للأدمن', (TG_USER.name||'موظف') + ' أرسل مستنداً جديداً مباشرة: ' + title, 'emp-doc-direct');
        }).catch(function(err){
            msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر حفظ بيانات المستند: '+err.message;
        });
    });
}

function empDeleteDoc(docId, fileUrl) {
    if(!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    db.collection('employeeDocuments').doc(docId).delete().then(function(){
        if(fileUrl && typeof tgDeleteSupabaseFile === 'function') {
            tgDeleteSupabaseFile(fileUrl);
        }
    }).catch(function(err){
        alert('❌ خطأ أثناء الحذف: '+err.message);
    });
}

// ═══ Tab-based filtering for employee tasks ═══
window._empActiveTaskTab = '';
function tgSetEmpTaskTab(btn, status){
    window._empActiveTaskTab = status;
    
    // Update active tab
    document.querySelectorAll('.tg-task-tab').forEach(function(tab){
        tab.classList.remove('tg-task-tab-active');
    });
    btn.classList.add('tg-task-tab-active');
    
    // Apply filter
    tgApplyEmpTaskFilter();
}

function tgApplyEmpTaskFilter(){
    var status = window._empActiveTaskTab || '';
    var cards = document.querySelectorAll('#myTasksList .pj-row');
    
    cards.forEach(function(card){
        var show = false;
        var cardStatus = card.getAttribute('data-taskstatus') || 'لم يبدأ';
        var dlVal = parseFloat(card.getAttribute('data-deadline'));
        var isOverdue = dlVal && dlVal < 9999999999999 && dlVal < Date.now() && cardStatus !== 'مكتمل';
        
        if(status === ''){
            show = true; // All
        } else if(status === 'overdue'){
            show = isOverdue;
        } else {
            show = (cardStatus === status);
        }
        
        if (show) {
            card.style.removeProperty('display');
        } else {
            card.style.setProperty('display', 'none', 'important');
        }
    });
}

// Update tab counts after rendering
function tgUpdateEmpTaskTabCounts(rows){
    var counts = { all: rows.length, notstarted: 0, inprogress: 0, paused: 0, done: 0, overdue: 0 };
    var now = Date.now();
    
    rows.forEach(function(t){
        var status = t.status || 'لم يبدأ';
        if(status === 'لم يبدأ') counts.notstarted++;
        else if(status === 'جاري العمل') counts.inprogress++;
        else if(status === 'متوقف') counts.paused++;
        else if(status === 'مكتمل') counts.done++;
        
        var dlTime = t.deadline ? new Date(t.deadline).getTime() : 0;
        if(dlTime && dlTime < now && status !== 'مكتمل') counts.overdue++;
    });
    
    var map = { 'emp-tab-count-all': counts.all, 'emp-tab-count-1': counts.notstarted, 'emp-tab-count-2': counts.inprogress, 'emp-tab-count-paused': counts.paused, 'emp-tab-count-3': counts.done, 'emp-tab-count-late': counts.overdue };
    Object.keys(map).forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.textContent = map[id];
    });
}

// ── مركز الإشعارات للموظف ──────────────────────────────────────
function tgToggleNotifPanel(ev) {
    if (ev) ev.stopPropagation();
    var panel = document.getElementById('notifPanel');
    if (!panel) return;
    var willOpen = panel.style.display === 'none' || !panel.style.display;
    panel.style.display = willOpen ? 'block' : 'none';
}
document.addEventListener('click', function (ev) {
    var wrap = document.getElementById('notifWrap');
    var panel = document.getElementById('notifPanel');
    if (!wrap || !panel || panel.style.display === 'none') return;
    if (!wrap.contains(ev.target)) panel.style.display = 'none';
});
function tgTimeAgo(d) {
    if (!d) return 'الآن';
    var ms = (d && d.toMillis) ? d.toMillis() : new Date(d).getTime();
    if (!ms || isNaN(ms)) return 'توقيت غير معروف';
    var now = Date.now();
    var s = Math.floor(Math.abs(now - ms) / 1000);
    if (s < 2) return 'الآن';
    if (s < 60) return 'منذ ' + s + ' ثانية';
    var m = Math.floor(s / 60);
    if (m < 60) return (m === 1 ? 'منذ دقيقة' : m === 2 ? 'منذ دقيقتين' : m <= 10 ? 'منذ ' + m + ' دقائق' : 'منذ ' + m + ' دقيقة');
    var h = Math.floor(m / 60);
    if (h < 24) return (h === 1 ? 'منذ ساعة' : h === 2 ? 'منذ ساعتين' : h <= 10 ? 'منذ ' + h + ' ساعات' : 'منذ ' + h + ' ساعة');
    var days = Math.floor(h / 24);
    if (days < 30) return (days === 1 ? 'منذ يوم' : days === 2 ? 'منذ يومين' : days <= 10 ? 'منذ ' + days + ' أيام' : 'منذ ' + days + ' يوم');
    return new Date(ms).toLocaleDateString('ar-EG');
}
function tgRenderNotifPanel(list, unreadCount) {
    var badge = document.getElementById('notifBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }
    var bellBtn = document.getElementById('notifBellBtn');
    if (bellBtn) bellBtn.classList.toggle('has-unread', unreadCount > 0);

    var listEl = document.getElementById('notifList');
    if (!listEl) return;
    if (!list || !list.length) {
        listEl.innerHTML = '<div class="notif-empty">لا توجد إشعارات بعد</div>';
        return;
    }
    var h = '';
    list.forEach(function (n) {
        var unread = !n.read;
        h += '<div class="notif-item' + (unread ? ' unread' : '') + '" onclick="tgNotifItemClick(\'' + n.id + '\', event, \'' + (n.tag || '') + '\')">';
        h += '<div class="notif-item-dot"></div>';
        h += '<div class="notif-item-body">';
        h += '<div class="notif-item-title">' + (typeof escH === 'function' ? escH(n.title || 'إشعار') : (n.title || 'إشعار')) + '</div>';
        if (n.body) h += '<div class="notif-item-text">' + (typeof escH === 'function' ? escH(n.body) : n.body) + '</div>';
        h += '<div class="notif-item-time">' + tgTimeAgo(n.createdAt) + '</div>';
        h += '</div>';
        h += '<div class="notif-item-del" title="حذف" onclick="tgNotifDelClick(\'' + n.id + '\', event)">✕</div>';
        h += '</div>';
    });
    listEl.innerHTML = h;
}
function tgNotifItemClick(id, ev, tag) {
    if (ev) ev.stopPropagation();
    if (typeof tgMarkNotifRead === 'function') tgMarkNotifRead(id);
    var panel = document.getElementById('notifPanel');
    if (panel) panel.style.display = 'none';

    var clickTab = function(t){ var el = document.querySelector('[data-pg="'+t+'"]'); if(el) empGo(t, el); };

    if (tag === 'form-submitted' || tag === 'form-new') clickTab('forms');
    else if (tag === 'request-reviewed' || tag === 'request-new') clickTab('req');
    else if (tag === 'att-check-in' || tag === 'att-check-out') clickTab('att');
    else if (tag === 'name-change' || tag === 'achievement-new') clickTab('ach');
    else if (tag === 'project-new' || tag === 'project-update' || tag === 'project-status' || tag === 'project-progress' || tag === 'project-note' || tag === 'project-completed') clickTab('proj');
    else if (tag === 'task-new' || tag === 'task-update' || tag === 'task-status') clickTab('tasks');
    else if (tag === 'weekly-report-new' || tag === 'weekly-report-reminder') clickTab('wkr');
    else if (tag === 'emp-doc-personal' || tag === 'emp-doc-direct') clickTab('docs');
    else if (tag === 'chat-new') { if (typeof tgChatToggle === 'function') tgChatToggle(); }
}
function tgNotifDelClick(id, ev) {
    if (ev) ev.stopPropagation();
    if (typeof tgDeleteNotif === 'function') tgDeleteNotif(id);
}
