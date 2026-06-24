import subprocess
import time
import os

html_path = "file:///C:/Users/abano/OneDrive/Desktop/مدرسة/index.html"
log_path = "edge_debug.log"

if os.path.exists(log_path):
    os.remove(log_path)

env = os.environ.copy()
env["CHROME_LOG_FILE"] = log_path

proc = subprocess.Popen([
    "msedge.exe",
    "--headless=new",
    "--enable-logging",
    "--v=1",
    html_path
], env=env)

time.sleep(3)
proc.terminate()

if os.path.exists(log_path):
    with open(log_path, "r", encoding="utf-8") as f:
        print(f.read())
else:
    print("No log file created.")
