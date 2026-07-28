import os, glob

# 1. Update AllocationReportPage.jsx
report_file = "frontend/src/pages/AllocationReportPage.jsx"
with open(report_file, 'r') as f:
    content = f.read()
if "import { DataContext } from '../DataContext';" not in content:
    content = content.replace(
        "import React, { useState, useEffect, useMemo } from 'react';",
        "import React, { useState, useEffect, useMemo, useContext } from 'react';\nimport { DataContext } from '../DataContext';"
    )
    # Replace states
    content = content.replace(
        "const [masterData, setMasterData] = useState([]);\n  const [total, setTotal] = useState(0);\n  const [loading, setLoading] = useState(true);\n  const [lastRun, setLastRun] = useState(null);",
        "const { allocationData: masterData, lastRun, isLoadingData: loading, refreshData } = useContext(DataContext);\n  const [total, setTotal] = useState(0);"
    )
    # Remove fetchData
    import re
    content = re.sub(r'const fetchData = async \(\) => \{.*?useEffect\(\(\) => \{\n    fetchData\(\);\n  \}, \[\]\);', '', content, flags=re.DOTALL)
    
    # Replace onClick={fetchData} with onClick={refreshData}
    content = content.replace("onClick={fetchData}", "onClick={refreshData}")

    with open(report_file, 'w') as f:
        f.write(content)
    print("Updated AllocationReportPage")

# 2. Update OverallDashboard.jsx
dash_file = "frontend/src/pages/OverallDashboard.jsx"
with open(dash_file, 'r') as f:
    content = f.read()

if "import { DataContext } from '../DataContext';" not in content:
    content = content.replace(
        "import React, { useState, useEffect, useMemo } from 'react';",
        "import React, { useState, useEffect, useMemo, useContext } from 'react';\nimport { DataContext } from '../DataContext';"
    )
    # Replace states and fetchData
    content = content.replace(
        "const [data, setData] = useState([]);\n  const [totalWhStock, setTotalWhStock] = useState(0);\n  const [summary, setSummary] = useState(null);\n  const [loading, setLoading] = useState(true);",
        "const { dashboardData, allocationSummary: summary, isLoadingData: loading, refreshData } = useContext(DataContext);\n  const data = dashboardData?.allocations || [];\n  const totalWhStock = dashboardData?.warehouse_stock_total || 0;"
    )
    content = re.sub(r'const fetchData = async \(\) => \{.*?useEffect\(\(\) => \{\n    fetchData\(\);\n  \}, \[\]\);', '', content, flags=re.DOTALL)
    
    with open(dash_file, 'w') as f:
        f.write(content)
    print("Updated OverallDashboard")

# 3. Update WizardStrategyStep.jsx
wiz_file = "frontend/src/components/wizard/WizardStrategyStep.jsx"
with open(wiz_file, 'r') as f:
    content = f.read()
if "import { DataContext } from '../../DataContext';" not in content:
    content = content.replace(
        "import React, { useState, useEffect } from 'react';",
        "import React, { useState, useEffect, useContext } from 'react';\nimport { DataContext } from '../../DataContext';"
    )
    content = content.replace(
        "export default function WizardStrategyStep({ onComplete }) {",
        "export default function WizardStrategyStep({ onComplete }) {\n  const { refreshData } = useContext(DataContext);"
    )
    content = content.replace(
        "await runAllocation();\n      onComplete();",
        "await runAllocation();\n      refreshData();\n      onComplete();"
    )
    with open(wiz_file, 'w') as f:
        f.write(content)
    print("Updated WizardStrategyStep")

