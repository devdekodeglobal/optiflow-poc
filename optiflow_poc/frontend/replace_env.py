import os, glob
URL = "https://optiflow-backend-977593391877.us-central1.run.app"
ENV_VAR = "${import.meta.env.VITE_API_BASE_URL}"
files = glob.glob("src/**/*.js", recursive=True) + glob.glob("src/**/*.jsx", recursive=True)
count = 0
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    if URL in content:
        if "api.js" in f:
            content = content.replace(f"'{URL}'", "import.meta.env.VITE_API_BASE_URL")
        else:
            content = content.replace(URL, ENV_VAR)
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
        count += 1
print(f"Done, updated {count} files.")
