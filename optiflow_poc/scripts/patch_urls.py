import os
import glob

# Find all frontend files
files = glob.glob('frontend/src/**/*.js', recursive=True) + glob.glob('frontend/src/**/*.jsx', recursive=True)

old_url = "'https://optiflow-backend-977593391877.asia-south1.run.app'"
new_url = "'http://127.0.0.1:8000'"

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    if old_url in content:
        content = content.replace(old_url, new_url)
        with open(file, 'w') as f:
            f.write(content)
        print(f"Patched {file}")

