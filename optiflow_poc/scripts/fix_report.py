import re

file_path = "frontend/src/pages/AllocationReportPage.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Remove CollapsibleRow definition
p1 = r'function CollapsibleRow\(\{ node.*?\}\n\nexport default function AllocationReportPage\(\) \{'
content = re.sub(p1, "export default function AllocationReportPage() {", content, flags=re.DOTALL)

# 2. Remove treeData logic
p2 = r'  const treeData = useMemo\(\(\) => \{.*?\n  \}, \[filteredData\]\);\n'
content = re.sub(p2, "", content, flags=re.DOTALL)

# 3. Remove forceExpandAll state and button
p3 = r'  const \[forceExpandAll, setForceExpandAll\] = useState\(false\);\n'
content = re.sub(p3, "", content)

p_expand_btn = r'\s*<button className="btn btn-outline" style={{ display: \'flex\', alignItems: \'center\', gap: 8 }} onClick=\{.*?Expand All\'\}\s*</button>'
content = re.sub(p_expand_btn, "", content, flags=re.DOTALL)

# 4. Replace rendering logic
start_marker = "{/* HIERARCHICAL TREE GRID */}"
start_idx = content.find(start_marker)
if start_idx != -1:
    new_content = content[:start_idx] + """          {/* DRILL DOWN UI */}
          <div style={{ marginTop: 24 }}>
            <AllocationDrillDown 
              filteredData={filteredData} 
              filters={filters} 
              setFilters={setFilters} 
              isDispatch={false} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
"""
    content = new_content

with open(file_path, "w") as f:
    f.write(content)
print("Fixed AllocationReportPage.jsx")
