import re

for file_path in ["frontend/src/pages/AllocationReportPage.jsx", "frontend/src/pages/DispatchPage.jsx"]:
    with open(file_path, "r") as f:
        content = f.read()

    # Find where CollapsibleRow starts and where export default function starts
    start_str = "function CollapsibleRow("
    end_str = "export default function "
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        content = content[:start_idx] + "import AllocationDrillDown from '../components/AllocationDrillDown';\n\n" + content[end_idx:]
        
    with open(file_path, "w") as f:
        f.write(content)

print("Fixed both files!")
