import re

file_path = "frontend/src/pages/DispatchPage.jsx"
with open(file_path, "r") as f:
    content = f.read()

# 4. Replace rendering logic
start_marker = "{/* DISPATCH LIST TABLE */}"
start_idx = content.find(start_marker)
if start_idx != -1:
    new_content = content[:start_idx] + """          {/* DRILL DOWN UI */}
          <div style={{ marginTop: 24 }}>
            <AllocationDrillDown 
              filteredData={filteredData} 
              filters={filters} 
              setFilters={setFilters} 
              isDispatch={true} 
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
print("Fixed DispatchPage.jsx")
