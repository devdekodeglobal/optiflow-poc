import re

main_file = "backend/main.py"
with open(main_file, "r") as f:
    content = f.read()

# 1. Remove clearing of allocations/summary/dashboard from upload_planogram
# The block looks like:
#         store.allocations = []
#         store.summary = None
#         store.dashboard_all_stores_cache = None
#         delete_from_gcs("dashboard_cache.json")
p_planogram = r'(\s+store\.planogram = parse_planogram\(df\.copy\(\)\))\s+store\.allocations = \[\]\s+store\.summary = None\s+store\.dashboard_all_stores_cache = None\s+delete_from_gcs\("dashboard_cache\.json"\)'
content = re.sub(p_planogram, r'\1', content)

# 2. Same for upload_stock
p_stock = r'(\s+store\.store_stock = st_stock)\s+store\.allocations = \[\]\s+store\.summary = None\s+store\.dashboard_all_stores_cache = None\s+delete_from_gcs\("dashboard_cache\.json"\)'
content = re.sub(p_stock, r'\1', content)

# 3. Same for upload_sales
p_sales = r'(\s+store\.sales_raw = df)\s+store\.allocations = \[\]\s+store\.summary = None\s+store\.dashboard_all_stores_cache = None\s+delete_from_gcs\("dashboard_cache\.json"\)'
content = re.sub(p_sales, r'\1', content)

# 4. Modify reset_data
# Current:
#     store.warehouse_stock = None
#     store.store_stock = None
#     store.allocations = []
#     store.summary = None
#     store.last_run_time = None
#     store.last_run_at = None
#     store.dashboard_all_stores_cache = None
#     store.strategy_store_lists = {}
#     store.strategy_active_categories = ["A++", "A+", "A", "B+", "B", "C"]
#     
#     empty_alloc = {"last_run_at": None, "results": [], "summary": None}
#     upload_to_gcs("allocation_results.json", json.dumps(empty_alloc).encode("utf-8"))
p_reset = r'(\s+store\.store_stock = None)\s+store\.allocations = \[\]\s+store\.summary = None\s+store\.last_run_time = None\s+store\.last_run_at = None\s+store\.dashboard_all_stores_cache = None\s+store\.strategy_store_lists = \{\}\s+store\.strategy_active_categories = \["A\+\+", "A\+", "A", "B\+", "B", "C"\]\s+empty_alloc = \{"last_run_at": None, "results": \[\], "summary": None\}\s+upload_to_gcs\("allocation_results\.json", json\.dumps\(empty_alloc\)\.encode\("utf-8"\)\)'

new_reset = r'\1\n    store.strategy_store_lists = {}\n    store.strategy_active_categories = ["A++", "A+", "A", "B+", "B", "C"]'
content = re.sub(p_reset, new_reset, content)

# 5. In /api/run-allocation, we need to clear dashboard_cache.json
# It currently returns: return store.summary.model_dump()
p_run = r'(\s+upload_to_gcs\("allocation_results\.json", json\.dumps\(alloc_data\)\.encode\("utf-8"\)\)\s+)(return store\.summary\.model_dump\(\))'
content = re.sub(p_run, r'\1store.dashboard_all_stores_cache = None\n    delete_from_gcs("dashboard_cache.json")\n    \2', content)

with open(main_file, "w") as f:
    f.write(content)

print("Backend patched")
