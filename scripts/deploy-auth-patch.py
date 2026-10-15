import subprocess

with open("auth_patch.tar.gz", "rb") as f:
    tar_data = f.read()

print(f"Streaming {len(tar_data)} bytes of auth_patch.tar.gz via ssh stdin...")

cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "root@50.6.200.135", "tar -xzvf - -C /var/www/intrihub"]

proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
stdout, stderr = proc.communicate(input=tar_data)

print("Return code:", proc.returncode)
print("STDOUT:\n", stdout.decode("utf-8", errors="replace"))
if stderr:
    print("STDERR:\n", stderr.decode("utf-8", errors="replace"))
