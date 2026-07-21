import re

file_path = "frontend/src/pages/AllocationReportPage.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace everything from {/* Table header */} to the end of the file with the new component
start_marker = "{/* Table header */}"
start_idx = content.find(start_marker)

if start_idx != -1:
    new_content = content[:start_idx] + """
      <AllocationDrillDown
        filteredData={filteredData}
        filters={filters}
        setFilters={setFilters}
        isDispatch={false}
      />
    </div>
  );
}
"""
    with open(file_path, "w") as f:
        f.write(new_content)
    print("Patched AllocationReportPage.jsx")
else:
    print("Could not find start marker")
