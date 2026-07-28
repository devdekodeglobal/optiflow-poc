import re

main_file = "backend/main.py"
with open(main_file, "r") as f:
    content = f.read()

# We need to rewrite startup_event
new_startup = """
import concurrent.futures

@app.on_event("startup")
async def startup_event():
    print("Downloading data from GCS in parallel...")
    files_to_download = [
        "last_run_metadata.json",
        "Planogram.csv",
        "Stock data.csv",
        "Sales Data.csv",
        "strategy_settings.json",
        "allocation_results.json",
        "dashboard_cache.json"
    ]
    
    downloaded_data = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as executor:
        future_to_file = {executor.submit(download_from_gcs, f): f for f in files_to_download}
        for future in concurrent.futures.as_completed(future_to_file):
            filename = future_to_file[future]
            try:
                downloaded_data[filename] = future.result()
                print(f"Downloaded {filename}")
            except Exception as e:
                print(f"Failed to download {filename}: {e}")

    # Process metadata
    if downloaded_data.get("last_run_metadata.json"):
        try:
            metadata = json.loads(downloaded_data["last_run_metadata.json"].decode("utf-8"))
            store.last_run_at = metadata.get("last_run_at")
        except Exception as e:
            print(f"Failed to load metadata: {e}")

    # Process planogram
    if downloaded_data.get("Planogram.csv"):
        try:
            df = pd.read_csv(io.BytesIO(downloaded_data["Planogram.csv"]), encoding="utf-8", on_bad_lines="skip")
            if "Unnamed: 0" in df.columns or "Unnamed: 1" in df.columns:
                df = pd.read_csv(io.BytesIO(downloaded_data["Planogram.csv"]), encoding="utf-8", header=1, on_bad_lines="skip")
            store.planogram = parse_planogram(df.copy())
        except Exception as e:
            print(f"Failed to load Planogram: {e}")
            
    # Process stock
    if downloaded_data.get("Stock data.csv"):
        try:
            df = pd.read_csv(io.BytesIO(downloaded_data["Stock data.csv"]), encoding="utf-8", on_bad_lines="skip")
            store.stock_raw = df
            wh_stock, st_stock = parse_stock(df.copy())
            store.warehouse_stock = wh_stock
            store.store_stock = st_stock
        except Exception as e:
            print(f"Failed to load Stock: {e}")
            
    # Process sales
    if downloaded_data.get("Sales Data.csv"):
        try:
            df = pd.read_csv(io.BytesIO(downloaded_data["Sales Data.csv"]), encoding="utf-8", on_bad_lines="skip")
            store.sales_raw = df
        except Exception as e:
            print(f"Failed to load Sales: {e}")
            
    # Process strategy
    if downloaded_data.get("strategy_settings.json"):
        try:
            strategy_data = json.loads(downloaded_data["strategy_settings.json"].decode("utf-8"))
            store.strategy_active_categories = strategy_data.get("active_categories", [])
            store.strategy_store_lists = strategy_data.get("store_lists", {})
        except Exception as e:
            print(f"Failed to load strategy: {e}")

    # Process allocations
    has_saved_results = False
    if downloaded_data.get("allocation_results.json"):
        try:
            alloc_data = json.loads(downloaded_data["allocation_results.json"].decode("utf-8"))
            store.last_run_at = alloc_data.get("last_run_at")
            store.allocations = [AllocationItem(**item) for item in alloc_data.get("results", [])]
            if "summary" in alloc_data and alloc_data["summary"]:
                from data_models import AllocationSummary
                store.summary = AllocationSummary(**alloc_data["summary"])
            has_saved_results = True
        except Exception as e:
            print(f"Failed to load allocation results: {e}")

    # Process cache
    if downloaded_data.get("dashboard_cache.json"):
        try:
            store.dashboard_all_stores_cache = json.loads(downloaded_data["dashboard_cache.json"].decode("utf-8"))
        except Exception as e:
            print(f"Failed to load dashboard cache: {e}")

    if store.planogram is not None and store.warehouse_stock is not None and not has_saved_results:
"""

# Replace the old startup_event
start_str = '@app.on_event("startup")\nasync def startup_event():'
end_str = '        try:\n            print("Running initial allocation engine...")'
start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_startup + content[end_idx:]
    with open(main_file, "w") as f:
        f.write(new_content)
    print("Patched main.py successfully")
else:
    print("Could not find start or end bounds for replacement")

