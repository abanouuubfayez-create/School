import sys
import re

# 1. livetrack.js
with open('livetrack.js', 'r', encoding='utf-8') as f:
    lt = f.read()

old_lt_mount = '''  // ── ربط المستمعين اللحظيين بـ Firestore ─────────────────────────────────
  function ltMountListeners() {
    db.collection('users').where('role', '==', 'employee')
      .onSnapshot(function (snap) {'''
      
new_lt_mount = '''  // ── ربط المستمعين اللحظيين بـ Firestore ─────────────────────────────────
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
      .onSnapshot(function (snap) {'''
      
lt = lt.replace(old_lt_mount.replace('\n', '\r\n'), new_lt_mount.replace('\n', '\r\n'))
lt = lt.replace(old_lt_mount, new_lt_mount)

old_lt_tasks = '''    db.collection('tasks').orderBy('createdAt', 'desc').limit(300)
      .onSnapshot(function (snap) {'''
new_lt_tasks = '''    _ltTasksUnsub = db.collection('tasks').orderBy('createdAt', 'desc').limit(300)
      .onSnapshot(function (snap) {'''
lt = lt.replace(old_lt_tasks.replace('\n', '\r\n'), new_lt_tasks.replace('\n', '\r\n'))
lt = lt.replace(old_lt_tasks, new_lt_tasks)

old_lt_proj = '''    db.collection('projects').limit(100).onSnapshot(function (snap) {'''
new_lt_proj = '''    _ltProjUnsub = db.collection('projects').limit(100).onSnapshot(function (snap) {'''
lt = lt.replace(old_lt_proj.replace('\n', '\r\n'), new_lt_proj.replace('\n', '\r\n'))
lt = lt.replace(old_lt_proj, new_lt_proj)

old_lt_logs = '''    db.collection('attendance_logs').orderBy('serverTimestamp', 'desc').limit(30)
      .onSnapshot(function(snap) {'''
new_lt_logs = '''    _ltLogsUnsub = db.collection('attendance_logs').orderBy('serverTimestamp', 'desc').limit(30)
      .onSnapshot(function(snap) {'''
lt = lt.replace(old_lt_logs.replace('\n', '\r\n'), new_lt_logs.replace('\n', '\r\n'))
lt = lt.replace(old_lt_logs, new_lt_logs)

with open('livetrack.js', 'w', encoding='utf-8') as f:
    f.write(lt)


# 2. formsend.js
with open('formsend.js', 'r', encoding='utf-8') as f:
    fs = f.read()

old_fs_watch = '''  function fsWatchSentForms() {
    db.collection('formRequests').where('sentByUid', '==', TG_USER.uid)
      .onSnapshot(function (snap) {'''
new_fs_watch = '''  var _fsWatchSentUnsub = null;
  function fsWatchSentForms() {
    if (_fsWatchSentUnsub) { _fsWatchSentUnsub(); _fsWatchSentUnsub = null; }
    _fsWatchSentUnsub = db.collection('formRequests').where('sentByUid', '==', TG_USER.uid)
      .onSnapshot(function (snap) {'''
fs = fs.replace(old_fs_watch.replace('\n', '\r\n'), new_fs_watch.replace('\n', '\r\n'))
fs = fs.replace(old_fs_watch, new_fs_watch)

old_fs_my = '''  window.loadMyFormRequests = function (uid) {
    db.collection('formRequests').where('targetUid', '==', uid)
      .onSnapshot(function (snap) {'''
new_fs_my = '''  var _fsMyReqUnsub = null;
  window.loadMyFormRequests = function (uid) {
    if (_fsMyReqUnsub) { _fsMyReqUnsub(); _fsMyReqUnsub = null; }
    _fsMyReqUnsub = db.collection('formRequests').where('targetUid', '==', uid)
      .onSnapshot(function (snap) {'''
fs = fs.replace(old_fs_my.replace('\n', '\r\n'), new_fs_my.replace('\n', '\r\n'))
fs = fs.replace(old_fs_my, new_fs_my)

with open('formsend.js', 'w', encoding='utf-8') as f:
    f.write(fs)

# 3. app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()

old_admin = '''var _adminNotifUnsub = null;
var _adminNotifAudioCtx = null;
var _adminNotifAudioUnlocked = false;
var _adminNotifInitialDone = false;

function startAdminNotifications(){
    if(_adminNotifUnsub) return;'''
new_admin = '''var _adminNotifUnsub = null;
var _adminNotifAudioCtx = null;
var _adminNotifAudioUnlocked = false;
var _adminNotifInitialDone = false;

function startAdminNotifications(){
    if(_adminNotifUnsub) return;
    _adminNotifUnsub = true; // Prevent multiple executions'''
app = app.replace(old_admin.replace('\n', '\r\n'), new_admin.replace('\n', '\r\n'))
app = app.replace(old_admin, new_admin)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)

print('Success')
