import subprocess
import sys

if len(sys.argv) > 1 and sys.argv[1] == "-otp":
    query = 'SELECT id, email, otp, "expiresAt", used, "createdAt" FROM "EmailOtpToken" ORDER BY "createdAt" DESC LIMIT 5;'
elif len(sys.argv) > 1 and sys.argv[1] == "-users":
    query = 'SELECT id, email, phone, role FROM "User" LIMIT 5;'
elif len(sys.argv) > 1:
    query = sys.argv[1]
else:
    query = 'SELECT count(*) FROM "User";'

cmd = [
    'ssh', '-o', 'StrictHostKeyChecking=no', 'root@50.6.200.135',
    'sudo', '-u', 'postgres', 'psql', '-d', 'intrihub_db'
]

res = subprocess.run(cmd, input=query, capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
