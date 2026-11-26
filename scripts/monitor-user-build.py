import subprocess
import json
import time
import os

BUILD_ID = "1ba6ce19-f527-482d-8d5a-72244527891c"
RELEASE_DIR = r"d:\Intrihub\release"

def check_build():
    cmd = ["npx.cmd", "eas-cli", "build:view", BUILD_ID, "--json"]
    p = subprocess.run(cmd, cwd=r"d:\Intrihub\intrihub-mobile", capture_output=True, text=True)
    out = p.stdout
    idx = out.find('{')
    if idx != -1:
        data = json.loads(out[idx:])
        return data
    return None

print(f"Monitoring User App build: {BUILD_ID}")
while True:
    data = check_build()
    if data:
        status = data.get("status")
        print(f"[{time.strftime('%H:%M:%S')}] User App Build: {status}")
        if status == "FINISHED":
            url = data.get("artifacts", {}).get("applicationArchiveUrl")
            print(f"Build FINISHED! Downloading from {url}...")
            target = os.path.join(RELEASE_DIR, "intrihub-mobile-v1.2.20-code14.aab")
            subprocess.run(["curl.exe", "-L", "-o", target, url])
            print("User App AAB downloaded successfully!")
            break
        elif status in ["ERRORED", "CANCELED"]:
            print(f"Build ended with status: {status}")
            print(json.dumps(data.get("error", {}), indent=2))
            break
    time.sleep(30)
