import subprocess

py_script = """
env_path = '/var/www/intrihub/.env'
with open(env_path, 'r') as f:
    lines = f.readlines()

env_dict = {}
for line in lines:
    line_s = line.strip()
    if line_s and not line_s.startswith('#') and '=' in line_s:
        k, v = line_s.split('=', 1)
        env_dict[k.strip()] = v.strip()

env_dict['EMAIL_SERVER_HOST'] = '"smtp.titan.email"'
env_dict['EMAIL_SERVER_PORT'] = '"465"'
env_dict['EMAIL_SERVER_USER'] = '"info@intrihub.com"'
if 'EMAIL_SERVER_PASSWORD' not in env_dict:
    env_dict['EMAIL_SERVER_PASSWORD'] = '"your-titan-email-password"'
env_dict['EMAIL_FROM'] = '"Intrihub <info@intrihub.com>"'

new_lines = []
for k, v in env_dict.items():
    new_lines.append(f"{k}={v}\\n")

with open(env_path, 'w') as f:
    f.writelines(new_lines)

print('SUCCESS: Updated /var/www/intrihub/.env')
"""

cmd = ['ssh', '-o', 'StrictHostKeyChecking=no', 'root@50.6.200.135', 'python3']
res = subprocess.run(cmd, input=py_script, text=True, capture_output=True)
print(res.stdout)
if res.stderr:
    print('STDERR:', res.stderr)
