#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
═══════════════════════════════════════════════════════════════════════════════
🏢 Tech Go System — ZKTeco ADMS Cloud / Local Server Bridge
═══════════════════════════════════════════════════════════════════════════════
يقوم هذا السيرفر بالاستماع المباشر لماكينات البصمة ZKTeco عبر بروتوكول ADMS / Push SDK
واستقبال حركات الحضور والانصراف لحظياً وتخزينها محلياً ومزامنتها مع Firebase Firestore.
"""

import sys
import os
import json
import socket
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Fix Windows console UTF-8 output
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8081
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FIREBASE_PROJECT_ID = "tech-go-system"
FIREBASE_API_KEY = "AIzaSyDyyl6cHWGh838xZ6epbUSwL2qmDgLsIwM"
LOGS_FILE = os.path.join(BASE_DIR, "attlog.dat")
JSON_DB_FILE = os.path.join(BASE_DIR, "attendance_records.json")

recent_logs = []
connected_devices = {}

def get_local_ip():
    """الحصول على عنوان IP المحلي لجهاز الكمبيوتر"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def save_log_to_dat(pin, dt_str, status="0", verify="1", work_code="0"):
    """حفظ السجل في ملف attlog.dat بصيغة ZKTeco القياسية"""
    try:
        line = f"{pin}\t{dt_str}\t{status}\t{verify}\t{work_code}\t0\n"
        with open(LOGS_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as e:
        print(f"[-] خطأ في كتابة ملف attlog.dat: {e}")

def sync_to_firestore(pin, dt_str, device_sn, status=0, verify_type=1):
    """إرسال حركة البصمة لحظياً إلى Firebase Firestore عبر REST API"""
    try:
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/attendanceLive?key={FIREBASE_API_KEY}"
        
        date_part = dt_str.split(" ")[0] if " " in dt_str else dt_str
        time_part = dt_str.split(" ")[1] if " " in dt_str else ""
        
        payload = {
            "fields": {
                "pin": {"stringValue": str(pin)},
                "timestamp": {"stringValue": dt_str},
                "date": {"stringValue": date_part},
                "time": {"stringValue": time_part},
                "deviceSn": {"stringValue": str(device_sn)},
                "status": {"integerValue": str(status)},
                "verifyType": {"integerValue": str(verify_type)},
                "createdAt": {"timestampValue": datetime.utcnow().isoformat() + "Z"}
            }
        }
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in (200, 201):
                return True
    except Exception as e:
        print(f"[-] تنبيه مزامنة Firebase (تم الحفظ محلياً بنجاح): {e}")
    return False

class ZKTecoADMSHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[*] {self.client_address[0]} - {args[0]}", flush=True)
        return

    def _send_plain(self, text, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Server", "iClock Server/3.0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(text.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(text.encode("utf-8"))

    def _send_html(self, html, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def do_GET(self):
        print(f"[GET] from {self.client_address[0]}: {self.path}", flush=True)
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.lower()
        params = urllib.parse.parse_qs(parsed.query)

        sn = params.get("SN", params.get("sn", ["UNKNOWN"]))[0]

        if path in ("/", "/dashboard", "/status"):
            html = self._render_dashboard()
            self._send_html(html)
            return

        if path == "/download/attlog.dat":
            content = b""
            if os.path.exists(LOGS_FILE):
                with open(LOGS_FILE, "rb") as f:
                    content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", 'attachment; filename="attlog.dat"')
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
            return

        # ── خدمة ملفات البرنامج محلياً (attendance.html, styles.css, app.js) ──
        clean_path = path.lstrip("/").split("?")[0]
        local_file = os.path.join(BASE_DIR, clean_path)
        if clean_path and os.path.isfile(local_file):
            content_types = {
                ".html": "text/html; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".json": "application/json; charset=utf-8",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".ico": "image/x-icon",
                ".dat": "text/plain; charset=utf-8"
            }
            ext = os.path.splitext(local_file)[1].lower()
            ct = content_types.get(ext, "application/octet-stream")
            try:
                with open(local_file, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", ct)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception as e:
                pass

        # ── ZKTeco Handshake & Push Config (جميع مسارات ZKTeco الممكنة) ──
        if "cdata" in path or "ping" in path or "registry" in path or "push" in path or "options" in parsed.query.lower():
            connected_devices[sn] = {
                "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "ip": self.client_address[0]
            }
            print(f"[+] اتصال من ماكينة البصمة: SN={sn} | IP={self.client_address[0]}", flush=True)
            
            config_reply = (
                f"GET OPTION FROM: {sn}\n"
                "Stamp=0\n"
                "OpStamp=0\n"
                "PhotoStamp=0\n"
                "ErrorDelay=30\n"
                "Delay=10\n"
                "TransTimes=00:00;14:05\n"
                "TransInterval=1\n"
                "TransFlag=1111000000\n"
                "TimeZone=2\n"
                "Realtime=1\n"
                "Encrypt=0\n"
            )
            self._send_plain(config_reply)
            return

        if "getrequest" in path or "devicecmd" in path or "rtdata" in path or "fdata" in path:
            connected_devices[sn] = {
                "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "ip": self.client_address[0]
            }
            self._send_plain("OK")
            return

        # Fallback: All other GET requests from terminal
        self._send_plain("OK")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.lower()
        params = urllib.parse.parse_qs(parsed.query)

        sn = params.get("SN", params.get("sn", ["UNKNOWN"]))[0]
        table = params.get("table", params.get("TABLE", ["ATTLOG"]))[0].upper()

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="ignore")

        print(f"[POST] from {self.client_address[0]}: {self.path} (Body Length: {length})", flush=True)

        connected_devices[sn] = {
            "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "ip": self.client_address[0]
        }

        # ── استقبال حركات البصمة (ATTLOG / CDATA) ──
        if "cdata" in path or table == "ATTLOG" or "rtdata" in path or "fdata" in path:
            lines = [l.strip() for l in body.splitlines() if l.strip()]
            saved_count = 0

            for line in lines:
                parts = line.split("\t") if "\t" in line else line.split()
                if len(parts) >= 2:
                    pin = parts[0]
                    dt_str = parts[1]
                    if len(parts) > 2 and parts[2].isdigit():
                        status = parts[2]
                    else:
                        status = "0"
                    
                    verify = parts[3] if len(parts) > 3 else "1"
                    work_code = parts[4] if len(parts) > 4 else "0"

                    save_log_to_dat(pin, dt_str, status, verify, work_code)
                    sync_to_firestore(pin, dt_str, sn, status, verify)

                    log_item = {
                        "pin": pin,
                        "datetime": dt_str,
                        "status": "دخول" if status in ("0", "4") else "خروج",
                        "sn": sn,
                        "received_at": datetime.now().strftime("%H:%M:%S")
                    }
                    recent_logs.insert(0, log_item)
                    if len(recent_logs) > 50:
                        recent_logs.pop()

                    print(f" [✓ بصمة جديدة] الموظف رقم: {pin} | الوقت: {dt_str} | الماكينة: {sn}", flush=True)
                    saved_count += 1

            self._send_plain(f"OK: {saved_count}")
            return

        self._send_plain("OK")

    def _render_dashboard(self):
        local_ip = get_local_ip()
        dev_rows = ""
        if not connected_devices:
            dev_rows = "<tr><td colspan='3' style='text-align:center;color:#94a3b8;'>لا توجد ماكينات متصلة حالياً. أدخل IP السيرفر في شاشة الماكينة.</td></tr>"
        else:
            for dsn, info in connected_devices.items():
                dev_rows += f"<tr><td>🟢 <b>{dsn}</b></td><td>{info['ip']}</td><td>{info['last_seen']}</td></tr>"

        log_rows = ""
        if not recent_logs:
            log_rows = "<tr><td colspan='5' style='text-align:center;color:#94a3b8;'>في انتظار تسجيل أول بصمة من الماكينة...</td></tr>"
        else:
            for l in recent_logs[:15]:
                badge_cls = "badge-in" if l['status'] == "دخول" else "badge-out"
                log_rows += f"<tr><td><b>{l['pin']}</b></td><td>{l['datetime']}</td><td><span class='{badge_cls}'>{l['status']}</span></td><td>{l['sn']}</td><td>{l['received_at']}</td></tr>"

        html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مستقبل بصمات ZKTeco · تيك جو</title>
    <meta http-equiv="refresh" content="8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; font-family:'Cairo',sans-serif; }}
        body {{ background:#0f172a; color:#f8fafc; padding:24px; }}
        .header {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; background:#1e293b; padding:18px 24px; border-radius:16px; border:1px solid #334155; }}
        .title {{ font-size:20px; font-weight:800; color:#38bdf8; display:flex; align-items:center; gap:10px; }}
        .badge-live {{ background:#10b981; color:#fff; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; }}
        .grid {{ display:grid; grid-template-columns: 1fr 2fr; gap:20px; margin-bottom:24px; }}
        .card {{ background:#1e293b; border:1px solid #334155; border-radius:16px; padding:20px; }}
        .card-title {{ font-size:16px; font-weight:700; color:#cbd5e1; margin-bottom:14px; display:flex; align-items:center; gap:8px; }}
        .setting-box {{ background:#0f172a; border:1px dashed #0284c7; border-radius:12px; padding:14px; margin-bottom:14px; }}
        .setting-line {{ font-size:14px; margin-bottom:8px; display:flex; justify-content:space-between; }}
        .setting-val {{ font-weight:900; color:#38bdf8; direction:ltr; }}
        table {{ width:100%; border-collapse:collapse; font-size:13px; }}
        th, td {{ padding:10px 12px; text-align:right; border-bottom:1px solid #334155; }}
        th {{ background:#0f172a; color:#94a3b8; font-weight:700; }}
        .badge-in {{ background:rgba(16,185,129,0.2); color:#34d399; padding:2px 8px; border-radius:8px; font-weight:bold; }}
        .badge-out {{ background:rgba(239,68,68,0.2); color:#f87171; padding:2px 8px; border-radius:8px; font-weight:bold; }}
        .btn {{ display:inline-flex; align-items:center; gap:6px; background:#0284c7; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:13px; transition:0.2s; border:none; cursor:pointer; }}
        .btn:hover {{ background:#0369a1; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">
            <span>⏱️</span>
            <span>سيرفر ربط ماكينة البصمة ZKTeco (Tech Go ADMS)</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge-live">🟢 السيرفر يعمل ويستقبل لحظياً</span>
            <a href="/download/attlog.dat" class="btn">📥 تحميل ملف attlog.dat</a>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <div class="card-title">⚙️ الإعدادات المطلوب إدخالها في شاشة الماكينة:</div>
            <div class="setting-box">
                <div class="setting-line"><span>Server Mode:</span> <span class="setting-val">ADMS</span></div>
                <div class="setting-line"><span>Enable Domain:</span> <span class="setting-val">OFF</span></div>
                <div class="setting-line"><span>Server Address:</span> <span class="setting-val" style="background:#0369a1;color:#fff;padding:2px 6px;border-radius:6px;">{local_ip}</span></div>
                <div class="setting-line"><span>Server Port:</span> <span class="setting-val">{PORT}</span></div>
                <div class="setting-line"><span>HTTPS:</span> <span class="setting-val">OFF</span></div>
            </div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.6;">
                💡 <b>ملاحظة:</b> تأكد من اتصال جهاز الكمبيوتر وماكينة البصمة بنفس شبكة الراوتر (Wi-Fi أو كابل إيثرنت).
            </p>

            <div class="card-title" style="margin-top:20px;">📟 الماكينات المتصلة الآن:</div>
            <table>
                <thead><tr><th>الماكينة (SN)</th><th>IP</th><th>آخر ظهور</th></tr></thead>
                <tbody>{dev_rows}</tbody>
            </table>
        </div>

        <div class="card">
            <div class="card-title">📡 الحركات اللحظية المستلمة (تحديث تلقائي):</div>
            <table>
                <thead>
                    <tr>
                        <th>رقم الموظف (ID)</th>
                        <th>التاريخ والوقت</th>
                        <th>النوع</th>
                        <th>ماكينة البصمة</th>
                        <th>وقت الاستلام</th>
                    </tr>
                </thead>
                <tbody>{log_rows}</tbody>
            </table>
        </div>
    </div>
</body>
</html>"""
        return html

def run_server():
    local_ip = get_local_ip()
    print("=" * 70)
    print(" Tech Go System - ZKTeco ADMS Fingerprint Server")
    print("=" * 70)
    print(f" [+] Local Server IP:   {local_ip}")
    print(f" [+] Port:              {PORT}")
    print(f" [+] Web Dashboard:     http://{local_ip}:{PORT} or http://localhost:{PORT}")
    print(f" [+] Attlog Data File:  {LOGS_FILE}")
    print("-" * 70)
    print(" [i] Cloud Server Settings in ZKTeco Terminal:")
    print(f"     * Server Mode:     ADMS")
    print(f"     * Enable Domain:   OFF")
    print(f"     * Server Address:  {local_ip}")
    print(f"     * Server Port:     {PORT}")
    print(f"     * HTTPS:           OFF")
    print("=" * 70)
    print(" [*] Waiting for fingerprint terminal connection...\n")

    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, ZKTecoADMSHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] تم إيقاف السيرفر.")
        sys.exit(0)

if __name__ == "__main__":
    run_server()
