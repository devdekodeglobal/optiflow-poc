import re

def process_file(filepath, is_dispatch=False):
    with open(filepath, "r") as f:
        content = f.read()

    # Increase font sizes across the board
    content = content.replace("fontSize: 11", "fontSize: 13")
    content = content.replace("fontSize: 12", "fontSize: 14")
    content = content.replace("fontSize: 13", "fontSize: 15")
    
    if is_dispatch:
        # Remove the warning-row logic only in DispatchPage
        content = content.replace("className={row.color_limit_warning ? 'warning-row' : ''}", "")

    with open(filepath, "w") as f:
        f.write(content)

process_file("src/pages/DashboardPage.jsx", False)
process_file("src/pages/DispatchPage.jsx", True)

