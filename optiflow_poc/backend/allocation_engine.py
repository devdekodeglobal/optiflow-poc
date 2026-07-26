"""
OptiFlow Allocation Engine (Attribute-Similarity Cascade)
---------------------------------------------------------
Calculates deficits using live stock from Stock CSV (reconciled by mapping alias).
Parses the Item Name structure into attributes and applies a similarity matrix
when matching deficits with Corporate Office warehouse inventory.

Optimized to run O(N) operations via lookup tables.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from data_models import AllocationItem, AllocationSummary, MatchType, ItemAttributes

WAREHOUSE_FACILITY = "Corporate Office"

# Reconcile planogram store names to stock facility names
STORE_NAME_MAP = {
    "Ajmer": "Ajmer Ramganj",
    "Laxmi nagar": "Delhi Laxmi Nagar",
    "PO-AGRA (ASHOKA PLAZA)": "Agra Ashoka Plaza",
    "PO-AHMEDABAD 2": "Ahemdabad CG Road",
    "PO-AJMER": "Ajmer Ramganj",
    "PO-ASHOK VIHAR": "Delhi Ashok Vihar Phase II",
    "PO-BHUBANESWAR": "Bhubneshwar Nayapalli",
    "PO-DWARKA(Eye Institute)": "Delhi Dwarka Sec 09",
    "PO-DWARKA12": "Delhi Dwarka Vegas Mall Sec 14",
    "PO-FARIDABAD": "Faridabad Sec 16A",
    "PO-FARIDABAD7": "Faridabad Sec 16A",
    "PO-GHAZIABAD": "Ghaziabad RDC",
    "PO-GHAZIABAD (RDC)": "Ghaziabad RDC",
    "PO-GTB NAGAR": "Delhi Laxmi Nagar",
    "PO-GURGAON(MPM)": "Gurgaon Sec 29",
    "PO-GURGAON1": "Gurgaon Dhanak Basti New Railway Road",
    "PO-GURGAON14": "Gurgaon Sector 51 M2K",
    "PO-GUWAHATI": "Guwahati Rukminigaon TRC",
    "PO-HYDERABAD": "Hyderabad Neo Retina (Abids)",
    "PO-HYDERABAD(KUKATPALLY)": "Hyderabad Kukatpally Nizampet X Roads",
    "PO-INDIRAPURAM": "Indirapuram Shakti Khand Eros Market",
    "PO-INDORE": "Indore Vijay Nagar",
    "PO-INDORE 2": "Indore Sapna Sangeeta Road",
    "PO-JAIPUR": "Jaipur Vaishali Nagar",
    "PO-JAIPUR 2": "Jaipur Malviya Nagar",
    "PO-JODHPUR": "Jodhpur Sardarpura",
    "PO-KALKA JI": "Delhi Safdarjung Enclave",
    "PO-KANPUR": "Kanpur Mall Road",
    "PO-KAROL BAGH": "Delhi Pusa Road",
    "PO-KOLKATA(AJC BOSE ROAD)": "Kolkata AJC Bose Road",
    "PO-KOLKATA(Madhyamgram)": "Kolkata Madhyamgram",
    "PO-MALVIYA NAGAR": "Jaipur Malviya Nagar",
    "PO-MORADABAD": "Moradabad Kanth Road",
    "PO-NEORETINA": "Hyderabad Neo Retina (Abids)",
    "PO-NOIDA": "Noida Spectrum Mall",
    "PO-NOIDA(GCM)": "Noida GaurCity",
    "PO-NOIDA(MOI)": "Noida MOI",
    "PO-PASCHIM VIHAR": "Delhi Vikaspuri Najafgarh Road",
    "PO-PATNA": "Patna RPS Mod",
    "PO-PREET VIHAR2": "Delhi Preet Vihar Vikas Marg",
    "PO-RAJOURI GARDEN": "Delhi Rajouri Garden",
    "PO-REWARI": "Rewari Sector 5",
    "PO-ROHINI": "Delhi Rohini Ring Road Mall",
    "PO-ROHINI7": "Delhi Rohini Ring Road Mall",
    "PO-SAFDARJUNG ENCLAVE": "Delhi Safdarjung Enclave",
    "PO-SARITA VIHAR": "Delhi Safdarjung Enclave",
    "PO-SURAT (CITY LIGHT)": "Surat City Light Road",
    "PO-SURAT (RANDER ROAD)": "Surat Rander Road",
    "PO-VADODARA": "Vadodara Genda Circle",
    "PO-VARANASI": "Varanasi Mahmoorganj",
    "PO-VIJAYAWADA": "Vijayawada Mogalrajpuram",
    "PO-VIKASPURI": "Delhi Vikaspuri Najafgarh Road"
}


def parse_item_name(item_name: str) -> ItemAttributes:
    """
    Parse item name string into detailed attributes.
    Format: Model - Brand - Gender - Color - Size - FrameType - Shape - Material
    """
    parts = [p.strip() for p in str(item_name).split(" - ")]
    attrs = ItemAttributes()
    if not parts or parts[0] == "":
        return attrs

    attrs.model = parts[0]
    if len(parts) > 1:
        attrs.brand = parts[1]
    if len(parts) > 2:
        attrs.gender = parts[2]
    if len(parts) > 3:
        attrs.color = parts[3]
    if len(parts) > 4:
        attrs.size = parts[4]
    if len(parts) > 5:
        attrs.frametype = parts[5]
    if len(parts) > 6:
        attrs.shape = parts[6]
    if len(parts) > 7:
        attrs.material = parts[7]

    return attrs


def calculate_similarity(target: ItemAttributes, candidate: ItemAttributes) -> float:
    """
    Calculate similarity score (0 to 100) based on target weights.
    Weights: Shape (30), Material (25), Frame Type (20), Color (15), Gender (10).
    """
    score = 0.0
    if target.shape and candidate.shape and target.shape.lower() == candidate.shape.lower():
        score += 30
    if target.material and candidate.material and target.material.lower() == candidate.material.lower():
        score += 25
    if target.frametype and candidate.frametype and target.frametype.lower() == candidate.frametype.lower():
        score += 20
    if target.color and candidate.color and target.color.lower() == candidate.color.lower():
        score += 15
    if target.gender and candidate.gender and target.gender.lower() == candidate.gender.lower():
        score += 10
    return score


def _get_commodity_type(category: str, name: str) -> str:
    cat = str(category).lower()
    if "goggles" in cat or "sunglass" in cat or "sunglass" in str(name).lower():
        return "Sunglass"
    return "Frame"


def parse_planogram(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize column names for flexible matching
    df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
    
    # Map new column names to internal engine keys
    col_mapping = {
        "store_name": "store_name",
        "brand_name": "brand_name",
        "store_type": "store_type",
        "store_category": "store_category",
        "dispatch_plan": "store_category", # Extracts 'A' from 'A-Weekly'
        "brand_code": "brand_code",
        "product_type": "commodity",
        "commodity": "commodity",  # Fallback for old
        "soh": "soh"
    }
    
    # Extract targets manually
    if "store_display" in df.columns:
        df["facing"] = pd.to_numeric(df["store_display"], errors='coerce').fillna(0)
    elif "facing" in df.columns:
        df["facing"] = pd.to_numeric(df["facing"], errors='coerce').fillna(0)
    else:
        df["facing"] = 0

    total_target = pd.Series(0, index=df.index)
    if "facing+depth" in df.columns:
        total_target = pd.to_numeric(df["facing+depth"], errors='coerce').fillna(0)
    elif "facing_depth" in df.columns:
        total_target = pd.to_numeric(df["facing_depth"], errors='coerce').fillna(0)

    df["back_stock"] = total_target - df["facing"]
    df["back_stock"] = df["back_stock"].apply(lambda x: max(0, x))
    
    # Rename columns that exist in the dataframe, preventing duplicate targets
    rename_dict = {}
    used_targets = set()
    for actual_col in df.columns:
        target = None
        if actual_col in col_mapping:
            target = col_mapping[actual_col]
            
        if target and target not in used_targets:
            rename_dict[actual_col] = target
            used_targets.add(target)
            
    df = df.rename(columns=rename_dict)
    
    # Ensure necessary columns exist
    for required in ["store_name", "brand_name", "commodity", "store_category", "store_type", "facing", "soh", "back_stock"]:
        if required not in df.columns:
            df[required] = "" if required not in ["facing", "soh", "back_stock"] else 0
            
    df["store_name"] = df["store_name"].fillna("")
    df["brand_name"] = df["brand_name"].fillna("")
    df["commodity"] = df["commodity"].fillna("Frame")
    df["commodity"] = df.apply(lambda row: _get_commodity_type(row["commodity"], row.get("store_brand_product_type", "")), axis=1)
    
    # Clean store_category (e.g. A-Weekly -> A)
    df["store_category"] = df["store_category"].replace("", "B").fillna("B")
    df["store_category"] = df["store_category"].astype(str).apply(lambda x: x.split("-")[0].strip() if "-" in x else x.strip())
    
    df["store_type"] = df["store_type"].fillna("")
    
    for col in ["facing", "back_stock", "soh"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
            
    return df


def parse_stock(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    # Normalize column names for flexible matching
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    
    # Map new column names to internal engine keys
    col_mapping = {
        "barcode": "barcode",
        "batch": "batch",
        "item_type": "item_type",
        "item_code": "item_code",
        "item_name": "item_name",
        "brand_name": "brand_name",
        "product_type": "item_category", # maps to item_category for engine
        "item_category": "item_category", # fallback old
        "brand_category": "brand_category",
        "facility": "facility",
        "batch_stock": "batch_stock",
        "store": "store",
        "mrp": "mrp",
        "unit_mrp": "mrp", # Fallback if unit mrp is used
        "stock_age_in_days": "stock_age_in_days"
    }
    
    rename_dict = {}
    used_targets = set()
    for actual_col in df.columns:
        if actual_col in col_mapping:
            target = col_mapping[actual_col]
            if target not in used_targets:
                rename_dict[actual_col] = target
                used_targets.add(target)
                
    df = df.rename(columns=rename_dict)
    
    # Ensure required columns
    for required in ["barcode", "item_code", "item_name", "facility", "batch_stock", "item_category", "mrp", "stock_age_in_days"]:
        if required not in df.columns:
            df[required] = "" if required not in ["batch_stock", "mrp", "stock_age_in_days"] else 0
            
    df["batch_stock"] = pd.to_numeric(df["batch_stock"], errors="coerce").fillna(0)
    df["mrp"] = pd.to_numeric(df["mrp"], errors="coerce").fillna(0)
    df["stock_age_in_days"] = pd.to_numeric(df["stock_age_in_days"], errors="coerce").fillna(0)
    df["item_category"] = df.apply(lambda row: _get_commodity_type(row.get("item_category", ""), row.get("item_name", "")), axis=1)
    
    wh_stock = df[df["facility"] == WAREHOUSE_FACILITY].copy()
    store_stock = df[df["facility"] != WAREHOUSE_FACILITY].copy()
    
    return wh_stock, store_stock


def run_allocation(
    planogram_df: pd.DataFrame,
    wh_stock_df: pd.DataFrame,
    store_stock_df: pd.DataFrame,
    strategy_store_lists: Dict[str, List[str]],
    active_categories: List[str],
    sales_df: pd.DataFrame = None,
    sales_lookback_days: Optional[int] = None
) -> Tuple[List[AllocationItem], AllocationSummary]:
    
    from regions import get_store_region, get_store_zone
    
    # 1. Group warehouse stock by item_code
    wh_agg = wh_stock_df.groupby("item_code").agg(
        total_stock=("batch_stock", "sum"),
        item_name=("item_name", "first"),
        item_category=("item_category", "first"),
        mrp=("mrp", "first")
    ).reset_index()
    
    # Build FIFO inventory queues per SKU
    wh_inventory_queues = {}
    for item_code, group in wh_stock_df.groupby("item_code"):
        group_sorted = group.sort_values(by="stock_age_in_days", ascending=False)
        queue = []
        for _, row in group_sorted.iterrows():
            qty = int(row["batch_stock"])
            if qty > 0:
                queue.append({
                    "barcode": str(row["barcode"]),
                    "qty": qty,
                    "age": row["stock_age_in_days"]
                })
        wh_inventory_queues[str(item_code)] = queue
    
    # Pre-parse attributes and create catalog dictionaries
    wh_pool: List[dict] = []
    wh_catalog_by_item: Dict[str, dict] = {}
    
    for _, row in wh_agg.iterrows():
        item_code = str(row["item_code"])
        name = str(row["item_name"])
        attrs = parse_item_name(name)
        item_data = {
            "item_code": item_code,
            "item_name": name,
            "mrp": float(row["mrp"]),
            "stock": int(row["total_stock"]),
            "brand": attrs.brand or (name.split(" - ")[1] if len(name.split(" - ")) > 1 else ""),
            "commodity": _get_commodity_type(row["item_category"], name),
            "attrs": attrs
        }
        wh_pool.append(item_data)
        wh_catalog_by_item[item_code] = item_data
        
    # Track remaining warehouse stock
    wh_remaining = {item["item_code"]: item["stock"] for item in wh_pool}

    # Group store stock by facility + item_code
    store_stock_grouped = store_stock_df.groupby(["facility", "item_code"])["batch_stock"].sum().to_dict()

    # Pre-aggregate store live stock by facility + brand + commodity to avoid N^3 lookup
    # store_live_stock[(facility, brand_lower, commodity)] = list of (item_code, qty)
    store_live_stock: Dict[Tuple[str, str, str], List[Tuple[str, float]]] = {}
    for (facility, item_code), qty in store_stock_grouped.items():
        if qty <= 0:
            continue
        
        # Resolve item details from warehouse catalog
        cat_item = wh_catalog_by_item.get(item_code)
        if cat_item:
            brand_key = cat_item["brand"].lower()
            commodity_key = cat_item["commodity"]
            key = (facility, brand_key, commodity_key)
            if key not in store_live_stock:
                store_live_stock[key] = []
            store_live_stock[key].append((item_code, qty))

    # Pre-aggregate top selling SKUs by facility + brand + commodity
    store_top_sales: Dict[Tuple[str, str, str], List[str]] = {}
    if sales_df is not None and not sales_df.empty:
        # Expected sales columns: Facility Name, Item Code, Quantity, Order Date
        if "Quantity" in sales_df.columns:
            sales_df_temp = sales_df.copy()
            sales_df_temp["qty"] = pd.to_numeric(sales_df_temp["Quantity"], errors="coerce").fillna(0)
            
            # Apply Sales Lookback Filter
            if sales_lookback_days is not None and sales_lookback_days > 0 and "Order Date" in sales_df_temp.columns:
                sales_df_temp["Order Date"] = pd.to_datetime(sales_df_temp["Order Date"], format="%Y-%m-%d", errors="coerce")
                valid_dates = sales_df_temp["Order Date"].dropna()
                if not valid_dates.empty:
                    max_date = valid_dates.max()
                    cutoff_date = max_date - pd.Timedelta(days=sales_lookback_days)
                    sales_df_temp = sales_df_temp[sales_df_temp["Order Date"] >= cutoff_date]
            
            # Group by store (Branch Name) and Item Code
            # Sales CSV uses "Branch Name" as store column and "Product Code" as item code
            store_col = "Branch Name" if "Branch Name" in sales_df_temp.columns else "Facility Name"
            item_col = "Product Code" if "Product Code" in sales_df_temp.columns else "Item Code"
            qty_col = "Quantity"
            
            if store_col in sales_df_temp.columns and item_col in sales_df_temp.columns:
                sales_grouped = sales_df_temp.groupby([store_col, item_col])["qty"].sum().reset_index()
                sales_grouped = sales_grouped.rename(columns={store_col: "Facility Name", item_col: "Item Code"})
                
                # Sort to ensure highest quantities are first
                sales_grouped = sales_grouped.sort_values(by=["Facility Name", "qty"], ascending=[True, False])
                
                # Fast build of store_top_sales using vectorized catalog lookup
                # Only consider items that exist in the warehouse catalog
                catalog_items = set(wh_catalog_by_item.keys())
                sales_grouped = sales_grouped[sales_grouped["Item Code"].isin(catalog_items)]
                
                if not sales_grouped.empty:
                    sales_grouped["brand_key"] = sales_grouped["Item Code"].map(
                        lambda ic: wh_catalog_by_item[ic]["brand"].lower() if ic in wh_catalog_by_item else None
                    )
                    sales_grouped["commodity_key"] = sales_grouped["Item Code"].map(
                        lambda ic: wh_catalog_by_item[ic]["commodity"] if ic in wh_catalog_by_item else None
                    )
                    sales_grouped = sales_grouped.dropna(subset=["brand_key", "commodity_key"])
                    
                    for _, row in sales_grouped.iterrows():
                        key = (str(row["Facility Name"]), row["brand_key"], row["commodity_key"])
                        if key not in store_top_sales:
                            store_top_sales[key] = []
                        store_top_sales[key].append(str(row["Item Code"]))

    # Category Filtering & Strict Sorting
    # Build a master ordered list from the active categories and their store lists
    master_order = []
    for cat in active_categories:
        master_order.extend(strategy_store_lists.get(cat, []))
        
    # Filter the planogram down to only stores that exist in the active master list
    planogram_df = planogram_df[planogram_df["store_name"].isin(master_order)].copy()
    
    # Assign a strict rank to each row based on the master_order
    # Lower rank number = higher priority
    store_rank_map = {store_name: idx for idx, store_name in enumerate(master_order)}
    planogram_df["_rank"] = planogram_df["store_name"].map(store_rank_map)
    prow_sorted = planogram_df.sort_values("_rank")

    allocations: List[AllocationItem] = []
    stores_with_deficits = set()
    total_target_deficit = 0
    
    tier_fulfillment = {cat: {"target": 0, "filled": 0, "pct": 0.0} for cat in ["A++", "A+", "A", "B+", "B", "C"]}
    
    # store -> model -> list of colors allocated
    store_model_colors: Dict[str, Dict[str, List[str]]] = {}

    store_total_deficit = {}
    for idx, prow in prow_sorted.iterrows():
        pl_store = str(prow["store_name"])
        brand_name = str(prow["brand_name"])
        commodity = str(prow["commodity"])
        mapped_facility = STORE_NAME_MAP.get(pl_store, pl_store)
        
        live_soh = 0.0
        stock_items = store_live_stock.get((mapped_facility, brand_name.lower(), commodity), [])
        for ic, qty in stock_items:
            live_soh += qty
        
        facing = float(prow["facing"])
        back_stock = float(prow["back_stock"])
        deficit = (facing + back_stock) - live_soh
        
        if deficit > 0:
            store_total_deficit[pl_store] = store_total_deficit.get(pl_store, 0) + int(np.ceil(deficit))
            
    store_brand_allocated_qty_total = {}
    store_brand_allocated_skus = {}
    store_sku_counts = {s: {} for s in store_total_deficit.keys()}

    for idx, prow in prow_sorted.iterrows():
        pl_store = str(prow["store_name"])
        brand_name = str(prow["brand_name"])
        commodity = str(prow["commodity"])
        
        # Get reconciled store name
        mapped_facility = STORE_NAME_MAP.get(pl_store, pl_store)
        
        # Find live SOH from pre-aggregated dictionary
        live_soh = 0.0
        stock_items = store_live_stock.get((mapped_facility, brand_name.lower(), commodity), [])
        for ic, qty in stock_items:
            live_soh += qty

        facing = float(prow["facing"])
        back_stock = float(prow["back_stock"])
        deficit = (facing + back_stock) - live_soh

        if deficit <= 0:
            store_region = get_store_region(pl_store)
            store_zone = get_store_zone(store_region)
            allocations.append(AllocationItem(
                gap_id=idx,
                store_name=pl_store,
                store_category=prow["store_category"],
                store_type=prow["store_type"],
                region=store_region,
                zone=store_zone,
                brand_code=prow["brand_code"],
                brand_name=brand_name,
                commodity=commodity,
                facing=facing,
                back_stock=back_stock,
                current_soh=live_soh,
                deficit=0,
                requested_item_code="N/A",
                allocated_item_code="N/A",
                allocated_item_name="Target met by SOH",
                allocated_qty=0,
                match_type=MatchType.EXACT,
                mrp=0.0,
                match_reason="Target met by existing SOH",
                color_limit_warning=False,
                initial_wh_stock=0,
                remaining_wh_stock=0,
                initial_gap=0,
                remaining_gap=0
            ))
            continue

        stores_with_deficits.add(pl_store)
        deficit_qty = int(np.ceil(deficit))
        total_target_deficit += deficit_qty
        
        tier = prow["store_category"]
        if tier in tier_fulfillment:
            tier_fulfillment[tier]["target"] += deficit_qty

        # Filter warehouse candidates
        candidates = [
            x for x in wh_pool
            if x["brand"].lower() == brand_name.lower() and x["commodity"] == commodity
        ]

        # 1. Primary rule: use top selling SKU from historical sales
        top_sales_items = store_top_sales.get((mapped_facility, brand_name.lower(), commodity), [])
        
        # Look up item details for items the store already has as a fallback
        store_items = []
        for ic, qty in stock_items:
            cat_item = wh_catalog_by_item.get(ic)
            if cat_item:
                store_items.append(cat_item)

        # Resolve target attributes
        if top_sales_items:
            # Get the #1 top selling SKU
            top_ic = top_sales_items[0]
            top_cat_item = wh_catalog_by_item.get(top_ic)
            if top_cat_item:
                target_attrs = top_cat_item["attrs"]
                target_mrp = top_cat_item["mrp"]
                requested_ic = top_ic
        elif store_items:
            # Fallback to current inventory
            target_attrs = store_items[0]["attrs"]
            target_mrp = store_items[0]["mrp"]
            requested_ic = store_items[0]["item_code"]
        else:
            # Fallback to blank
            target_attrs = ItemAttributes()
            target_mrp = 0.0

        allocated_qty = 0
        while allocated_qty < deficit_qty:
            best_cand = None
            best_score = -1.0
            match_type = MatchType.UNRESOLVED
            reason = "No stock available in Corporate Office"

            for cand in candidates:
                cand_code = cand["item_code"]
                rem_stock = wh_remaining.get(cand_code, 0)
                if rem_stock <= 0:
                    continue
                    
                cand_model = cand["attrs"].model
                cand_color = cand["attrs"].color
                
                # HARD LIMIT: Max 3 unique colors per model per store
                if pl_store in store_model_colors and cand_model in store_model_colors[pl_store]:
                    existing_colors = store_model_colors[pl_store][cand_model]
                    if cand_color not in existing_colors and len(existing_colors) >= 3:
                        continue
                
                # HARD LIMIT: Max 2 units of the same exact SKU per store
                MAX_UNITS_PER_SKU = 2
                sku_alloc_count = store_sku_counts.get(pl_store, {}).get(cand_code, 0)
                if sku_alloc_count >= MAX_UNITS_PER_SKU:
                    continue
                
                # 85% UNIQUENESS RULE: Reject candidate if adding it drops uniqueness below 85% for this brand
                store_brand = (pl_store, brand_name)
                is_new_sku = cand_code not in store_brand_allocated_skus.get(store_brand, set())
                
                if not is_new_sku:
                    current_unique = len(store_brand_allocated_skus.get(store_brand, set()))
                    current_total = store_brand_allocated_qty_total.get(store_brand, 0)
                    # If we add this duplicate, unique count stays the same, total increases by 1
                    if current_unique / (current_total + 1) < 0.85:
                        continue
                
                is_exact = any(si["item_code"] == cand_code for si in store_items)
                sim_score = calculate_similarity(target_attrs, cand["attrs"])
                
                price_match = True
                if target_mrp > 0:
                    price_diff = abs(cand["mrp"] - target_mrp) / target_mrp
                    if price_diff > 0.20:
                        price_match = False
                        sim_score -= 50

                if is_exact:
                    sim_score += 100
                
                if sim_score > best_score:
                    best_score = sim_score
                    best_cand = cand
                    if is_exact:
                        match_type = MatchType.EXACT
                        reason = "Exact SKU matching store historical stock"
                    elif price_match:
                        match_type = MatchType.SIMILAR
                        reason = f"Similar item: Same Brand ({brand_name}), shape ({cand['attrs'].shape}), material ({cand['attrs'].material})"
                    else:
                        match_type = MatchType.SUBSTITUTE
                        reason = f"Substitute: same brand fallback (price band exceeded)"

            if not best_cand:
                unfulfilled = deficit_qty - allocated_qty
                
                # Unresolved item tracks gap remaining
                initial_gap = deficit_qty - allocated_qty
                
                store_region = get_store_region(pl_store)
                store_zone = get_store_zone(store_region)
                
                allocations.append(AllocationItem(
                    gap_id=idx,
                    store_name=pl_store,
                    store_category=prow["store_category"],
                    store_type=prow["store_type"],
                    region=store_region,
                    zone=store_zone,
                    brand_code=prow["brand_code"],
                    brand_name=brand_name,
                    commodity=commodity,
                    facing=facing,
                    back_stock=back_stock,
                    current_soh=live_soh,
                    deficit=deficit,
                    requested_item_code=requested_ic,
                    allocated_qty=0,
                    match_type=MatchType.UNRESOLVED,
                    match_reason=reason,
                    initial_gap=initial_gap,
                    remaining_gap=initial_gap, # no alloc happened
                    initial_wh_stock=0,
                    remaining_wh_stock=0
                ))
                break

            initial_wh = wh_remaining[best_cand["item_code"]]
            max_can_alloc = 2 - store_sku_counts.get(pl_store, {}).get(best_cand["item_code"], 0)
            qty_to_alloc = min(initial_wh, deficit_qty - allocated_qty, max_can_alloc)
            
            # Enforce 85% uniqueness capping dynamically when allocating > 1 unit
            cand_code = best_cand["item_code"]
            store_brand = (pl_store, brand_name)
            is_new_sku = cand_code not in store_brand_allocated_skus.get(store_brand, set())
            
            current_unique = len(store_brand_allocated_skus.get(store_brand, set()))
            current_total = store_brand_allocated_qty_total.get(store_brand, 0)
            
            while qty_to_alloc > 0:
                proj_unique = current_unique + (1 if is_new_sku else 0)
                proj_total = current_total + qty_to_alloc
                if proj_total == 0 or (proj_unique / proj_total) >= 0.85:
                    break
                qty_to_alloc -= 1
                
            initial_gap = deficit_qty - allocated_qty
            
            units_needed = qty_to_alloc

            queue = wh_inventory_queues.get(best_cand["item_code"], [])
            
            allocated_barcodes_with_qty = []
            while units_needed > 0 and queue:
                head = queue[0]
                take = min(units_needed, head["qty"])
                head["qty"] -= take
                units_needed -= take
                allocated_barcodes_with_qty.append((head["barcode"], take))
                if head["qty"] == 0:
                    queue.pop(0)
            
            actual_alloc_qty = qty_to_alloc - units_needed
            
            if actual_alloc_qty <= 0:
                # Safety break to prevent infinite loops if logic prevents allocation
                break
                
            # Update tracking sets now that we know actual_alloc_qty
            if store_brand not in store_brand_allocated_skus:
                store_brand_allocated_skus[store_brand] = set()
            store_brand_allocated_skus[store_brand].add(cand_code)
            
            store_brand_allocated_qty_total[store_brand] = store_brand_allocated_qty_total.get(store_brand, 0) + actual_alloc_qty
            
            if pl_store not in store_sku_counts:
                store_sku_counts[pl_store] = {}
            store_sku_counts[pl_store][cand_code] = store_sku_counts[pl_store].get(cand_code, 0) + actual_alloc_qty
            
            wh_remaining[best_cand["item_code"]] -= actual_alloc_qty
            allocated_qty += actual_alloc_qty
            
            remaining_wh = wh_remaining[best_cand["item_code"]]
            remaining_gap = deficit_qty - allocated_qty

            model = best_cand["attrs"].model
            color = best_cand["attrs"].color
            warning = False
            
            if pl_store not in store_model_colors:
                store_model_colors[pl_store] = {}
            if model not in store_model_colors[pl_store]:
                store_model_colors[pl_store][model] = []
            
            if color not in store_model_colors[pl_store][model]:
                store_model_colors[pl_store][model].append(color)
                
            if len(store_model_colors[pl_store][model]) > 2:
                warning = True

            actual_requested = requested_ic
            if match_type == MatchType.EXACT and best_cand:
                actual_requested = best_cand["item_code"]
                
            store_region = get_store_region(pl_store)
            store_zone = get_store_zone(store_region)

            for bc, b_qty in allocated_barcodes_with_qty:
                allocations.append(AllocationItem(
                    gap_id=idx,
                    store_name=pl_store,
                    store_category=prow["store_category"],
                    store_type=prow["store_type"],
                    region=store_region,
                    zone=store_zone,
                    brand_code=prow["brand_code"],
                    brand_name=brand_name,
                    commodity=commodity,
                    facing=facing,
                    back_stock=back_stock,
                    current_soh=live_soh,
                    deficit=deficit,
                    requested_item_code=actual_requested,
                    allocated_item_code=best_cand["item_code"],
                    allocated_item_name=best_cand["item_name"],
                    allocated_barcode=bc,
                    allocated_qty=b_qty,
                    match_type=match_type,
                    mrp=best_cand["mrp"],
                    requested_attributes=target_attrs,
                    allocated_attributes=best_cand["attrs"],
                    match_reason=reason,
                    color_limit_warning=warning,
                    initial_wh_stock=initial_wh,
                    remaining_wh_stock=remaining_wh,
                    initial_gap=initial_gap,
                    remaining_gap=remaining_gap
                ))

    exact_c = sum(1 for a in allocations if a.match_type == MatchType.EXACT)
    similar_c = sum(1 for a in allocations if a.match_type == MatchType.SIMILAR)
    sub_c = sum(1 for a in allocations if a.match_type == MatchType.SUBSTITUTE)
    unres_c = sum(1 for a in allocations if a.match_type == MatchType.UNRESOLVED)
    total_allocated = sum(a.allocated_qty for a in allocations)
    total_retail_value = sum(a.allocated_qty * a.mrp for a in allocations)
    
    brand_comm_deficits = {}
    brand_comm_soh = {}
    for a in allocations:
        key = a.gap_id
        brand_comm_deficits[key] = max(0, a.deficit)
        brand_comm_soh[key] = max(0, a.current_soh)
        
    total_soh = int(sum(brand_comm_soh.values()))
    
    brand_stats = {}
    for a in allocations:
        if a.brand_name not in brand_stats:
            brand_stats[a.brand_name] = {
                "brand_name": a.brand_name,
                "deficit": 0,
                "filled": 0,
                "out_of_stock": 0,
                "exact_lines": 0,
                "similar_lines": 0,
                "fallback_lines": 0,
                "retail_value": 0.0
            }
        
        brand_stats[a.brand_name]["filled"] += a.allocated_qty
        brand_stats[a.brand_name]["retail_value"] += a.allocated_qty * a.mrp
        if a.match_type == MatchType.EXACT:
            brand_stats[a.brand_name]["exact_lines"] += 1
        elif a.match_type == MatchType.SIMILAR:
            brand_stats[a.brand_name]["similar_lines"] += 1
        elif a.match_type == MatchType.SUBSTITUTE:
            brand_stats[a.brand_name]["fallback_lines"] += 1
            
    gap_map = {a.gap_id: a for a in allocations}
    for b_name in brand_stats:
        b_def = sum(v for k, v in brand_comm_deficits.items() if gap_map[k].brand_name == b_name)
        brand_stats[b_name]["deficit"] = int(b_def)
        brand_stats[b_name]["out_of_stock"] = int(max(0, brand_stats[b_name]["deficit"] - brand_stats[b_name]["filled"]))
        brand_stats[b_name]["fulfillment_pct"] = round((brand_stats[b_name]["filled"] / brand_stats[b_name]["deficit"] * 100), 1) if brand_stats[b_name]["deficit"] > 0 else 100
    
    for a in allocations:
        if a.store_category in tier_fulfillment:
            tier_fulfillment[a.store_category]["filled"] += a.allocated_qty
            
    for cat, stats in tier_fulfillment.items():
        if stats["target"] > 0:
            stats["pct"] = round((stats["filled"] / stats["target"]) * 100, 1)
    
    summary = AllocationSummary(
        total_stores=planogram_df["store_name"].nunique(),
        total_deficit_lines=len(allocations),
        exact_matches=exact_c,
        similar_matches=similar_c,
        brand_fallbacks=sub_c,
        unresolved=unres_c,
        total_items_allocated=total_allocated,
        stores_with_deficits=len(stores_with_deficits),
        brands_processed=planogram_df["brand_name"].nunique(),
        total_target_deficit=total_target_deficit,
        total_soh=total_soh,
        total_retail_value=total_retail_value,
        tier_fulfillment=tier_fulfillment,
        brands=list(brand_stats.values())
    )

    return allocations, summary
