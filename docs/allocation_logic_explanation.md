# OptiFlow Allocation Engine Logic

This document provides a step-by-step description of the execution pipeline of the automated OptiFlow Allocation Engine.

---

### Step 1: Initialization
1. **Store Sorting**: Sorts scheduled stores (A, B, or C) and sub-sorts them by the custom priority list provided by the Center for Sight team.
2. **Deficit Calculation**: Calculates target displays (facings × depth) minus Current Stock on Hand (SOH).
   * **If Deficit = 0**: Stops execution for this store.
   * **If Deficit > 0**: Enters Tier 1 search loop.

---

### Step 2: Tier 1 Execution (Recent Sales Match)
1. **Fetch Candidates**: Gathers exact SKUs sold in this store within the last X days.
2. **Apply Constraints**: Checks the candidate SKU against display rules:
   * *Max 3 Colors/Model*: Rejects SKU if store displays already contain 3 different colors of the same frame model.
   * *Max 2 Units/SKU*: Rejects SKU if dispatch allocation for this SKU is already at 2 units.
   * *Min 85% Brand Uniqueness*: Rejects SKU if it causes brand diversity to fall below 85% of active display displays.
   * **How**: If any check fails (NO), the SKU is discarded and the engine loops back to fetch the next Tier 1 candidate. If all checks pass (YES), it checks warehouse stock.
3. **Verify Warehouse Stock**:
   * **How**: If out of stock (NO), Tier 1 is exited, and the engine falls forward to Tier 2. If in stock (YES), units are allocated to the deficit.
4. **Check Deficit Filled**:
   * **How**: If the deficit is fully resolved (YES), execution moves to FIFO Batching. If not (NO), the engine loops back to fetch the next Tier 1 candidate.

---

### Step 3: Tier 2 Execution (Historical Sales Match)
*Activates only if Tier 1 did not fully resolve the deficit.*
1. **Fetch Candidates**: Gathers exact matching SKUs sold in this store in the last 6 months.
2. **Apply Constraints**: Checks the same rules (3 colors/model, 2 units/SKU, 85% brand uniqueness).
   * **How**: If failed (NO), discards SKU and loops back to fetch the next Tier 2 candidate. If passed (YES), checks warehouse stock.
3. **Verify Warehouse Stock**:
   * **How**: If out of stock (NO), Tier 2 is exited, and the engine falls forward to Tier 3. If in stock (YES), units are allocated.
4. **Check Deficit Filled**:
   * **How**: If deficit is fully resolved (YES), execution moves to FIFO Batching. If not (NO), the engine loops back to fetch the next Tier 2 candidate.

---

### Step 4: Tier 3 Execution (Substitute Cascade)
*Activates only if Tier 1 and Tier 2 did not fully resolve the deficit.*
1. **Fetch Candidates**: Finds warehouse frames priced within ±20% of the original SKU, progressively relaxing matching filters in this order: Color ➔ Material ➔ Shape.
2. **Apply Constraints**: Checks the same rules (3 colors/model, 2 units/SKU, 85% brand uniqueness).
   * **How**: If failed (NO), discards substitute and loops back to fetch the next Tier 3 candidate. If passed (YES), checks warehouse stock.
3. **Verify Warehouse Stock**:
   * **How**: If out of stock (NO), allocation for this deficit fails (left unfilled). Execution moves to FIFO Batching. If in stock (YES), substitute units are allocated.
4. **Check Deficit Filled**:
   * **How**: If deficit is resolved (YES), execution moves to FIFO Batching. If not (NO), the engine loops back to find the next Tier 3 substitute candidate.

---

### Step 5: Final Batching & Dispatch
1. **FIFO Batching**: If an allocated SKU has multiple batches in the warehouse, the engine selects the inventory batch with the oldest arrival timestamp first.
2. **Dispatch**: Generates the final pick-list order and exports it to the HITL dashboard.
