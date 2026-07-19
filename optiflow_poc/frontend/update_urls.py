import os, glob

URL = "https://optiflow-backend-977593391877.us-central1.run.app"
files = glob.glob("src/**/*.js", recursive=True) + glob.glob("src/**/*.jsx", recursive=True)
count = 0
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    if "http://localhost:8000" in content:
        content = content.replace("http://localhost:8000", URL)
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
        count += 1
print(f"Done, updated {count} files.")
