import subprocess
import json
import time
import os
import urllib.request
import brotli

builds = {
    "user": {
        "id": "56307948-62ee-4f36-8a90-f13962cf454b",
        "cwd": "intrihub-mobile",
        "out": "release/intrihub-mobile-v1.2.20-code11.aab",
        "status": "IN_QUEUE",
        "finished": False
    },
    "business": {
        "id": "20adcd79-b5ac-42b4-8688-9aa69620562e",
        "cwd": "intrihub-business",
        "out": "release/intrihub-business-v1.0.35-code31.aab",
        "status": "IN_QUEUE",
        "finished": False
    }
}

os.makedirs("release", exist_ok=True)
print("Starting live monitor for both User and Business App builds on EAS...")

while not all(b["finished"] for b in builds.values()):
    time.sleep(20)
    timestamp = time.strftime("%H:%M:%S")

    for name, info in builds.items():
        if info["finished"]:
            continue

        cmd = f'npx eas-cli build:view {info["id"]} --json'
        try:
            out = subprocess.check_output(cmd, shell=True, cwd=info["cwd"], text=True)
            idx = out.find('{')
            if idx != -1:
                data = json.loads(out[idx:])
                status = data.get("status")
                info["status"] = status
                print(f'[{timestamp}] {name.upper()}: {status}', flush=True)

                if status == "FINISHED":
                    info["finished"] = True
                    aab_url = data["artifacts"]["applicationArchiveUrl"]
                    print(f'[{timestamp}] {name.upper()} FINISHED! Downloading {info["out"]}...', flush=True)
                    urllib.request.urlretrieve(aab_url, info["out"])
                    size_mb = os.path.getsize(info["out"]) / (1024 * 1024)
                    print(f'[{timestamp}] {name.upper()} DOWNLOADED: {info["out"]} ({size_mb:.2f} MB)', flush=True)

                elif status == "ERRORED":
                    info["finished"] = True
                    print(f'[{timestamp}] {name.upper()} ERRORED!', flush=True)
                    if data.get("logFiles"):
                        log_url = data["logFiles"][0]
                        raw = urllib.request.urlopen(urllib.request.Request(log_url)).read()
                        try:
                            content = brotli.decompress(raw).decode("utf-8", errors="ignore")
                        except Exception:
                            content = raw.decode("utf-8", errors="ignore")
                        for line in content.splitlines():
                            if any(k in line.lower() for k in ["error", "failed", "exception"]):
                                print(f'[{name.upper()} ERROR] {line[:180]}', flush=True)
        except Exception as e:
            print(f'Error polling {name}: {e}', flush=True)

print("\nAll builds completed monitoring cycle.")
