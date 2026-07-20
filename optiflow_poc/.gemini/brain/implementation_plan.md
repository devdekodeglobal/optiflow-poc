# Persistence + "Start New Allocation" Plan

## Problem Summary
1. **Allocation results** are lost on server restart — the report/dispatch pages show empty until "Run Allocation" is clicked again
2. **Strategy settings** (priority ladder) reset to defaults on restart
3. The wizard's Collapse button at Step 3 needs to become "Start New Allocation" with confirmation dialog + smart default-to-report behaviour

---

## What Already Persists ✅
- Planogram CSV → GCS
- Stock CSV → GCS  
- Sales CSV → GCS
- `last_run_at` timestamp → GCS (`last_run_metadata.json`)
- Startup already **re-runs** the allocation engine with whatever strategy was in memory (but memory is fresh → so it falls back to all-stores-active default, losing any custom priority settings)

---

## Part 1 — Backend: Persist Strategy + Allocation Results to GCS

### 1A. Save strategy settings on every change → `strategy_settings.json`
**File:** `backend/main.py`

After every `POST /api/settings/strategy` call, save:
```json
{
  "active_categories": ["A++", "A+", "A", "B+", "B", "C"],
  "store_lists": { "A++": [...], "A+": [...], ... }
}
```

On startup, load this file **before** re-running the allocation engine so the correct priority is restored.

### 1B. Save allocation results after each run → `allocation_results.json`
**File:** `backend/main.py`

After every `POST /api/run-allocation` (and after startup auto-run), save:
```json
{
  "last_run_at": "...",
  "results": [ ...AllocationItem.model_dump()... ]
}
```

On startup, **load this JSON** into `store.allocations` instead of re-running the engine from scratch. This means:
- Server restart → last results are instantly available, no re-computation
- The allocation report and dispatch pick list show the correct last run immediately

> **Note:** The startup auto-run is then only needed as a fallback if `allocation_results.json` doesn't exist in GCS.

---

## Part 2 — Frontend: "Start New Allocation" Button + Smart Default Step

### 2A. Replace Collapse button at Step 3 with "Start New Allocation"
**File:** `frontend/src/pages/AllocationWizardPage.jsx`

At Step 3, in the wizard header (where the Collapse button currently is), change it to:

```
[ Start New Allocation ]
```

On click → show a **confirmation dialog**:
> "Are you sure you want to start a new allocation? You'll need to re-upload your data. Your last allocation report will remain viewable until you complete a new run."

If confirmed:
- Clear `sessionStorage` (`wizard_step`, `wizard_data_uploaded`)
- Call a new backend endpoint `POST /api/allocation/reset` that clears `strategy_store_lists` from memory (so the new run starts fresh)
- Navigate to Step 1 (Upload Data)

### 2B. Smart default: if a previous run exists → default to Step 3
**File:** `frontend/src/pages/AllocationWizardPage.jsx`

On mount, the `useEffect` already calls `/api/upload/status`. Extend it to also check `/api/allocation/status`:
```json
{ "has_results": true, "last_run_at": "2024-01-01T..." }
```

Logic:
- If `sessionStorage` has a step → honour it (user was mid-session)
- Else if `has_results === true` → default to Step 3 (show last run report)
- Else if `planogram_uploaded && stock_uploaded` → default to Step 2
- Else → Step 1

### 2C. New backend endpoint: `GET /api/allocation/status`
Returns whether there are current allocation results in memory:
```json
{ "has_results": true, "total_allocations": 1248, "last_run_at": "..." }
```

### 2D. New backend endpoint: `POST /api/allocation/reset`
Clears `store.strategy_store_lists` and `store.allocations` from memory, and deletes `allocation_results.json` from GCS. Does NOT touch the uploaded CSVs.

---

## Proposed Changes

### Backend (`backend/main.py`)

#### [MODIFY] startup_event
- Load `strategy_settings.json` from GCS before running allocation
- Load `allocation_results.json` from GCS into `store.allocations` (skip re-running engine if file exists)

#### [MODIFY] execute_allocation (`POST /api/run-allocation`)  
- After storing results in memory, serialize and upload `allocation_results.json` to GCS
- Upload `strategy_settings.json` to GCS

#### [MODIFY] save_strategy (`POST /api/settings/strategy`)
- After updating in-memory strategy, always upload `strategy_settings.json` to GCS

#### [NEW] `GET /api/allocation/status`
- Returns `{ has_results, total_allocations, last_run_at }`

#### [NEW] `POST /api/allocation/reset`
- Clears `store.allocations`, `store.strategy_store_lists`
- Deletes `allocation_results.json` from GCS

### Frontend

#### [MODIFY] AllocationWizardPage.jsx
- Extend mount `useEffect` to call `/api/allocation/status` and pick smart default step
- Replace Collapse button with "Start New Allocation" when at Step 3
- Add confirmation dialog component (inline, no library needed)
- On confirm: call `/api/allocation/reset`, clear sessionStorage, go to Step 1

---

## Verification Plan

### Automated
- None (no test suite currently)

### Manual
1. Upload CSVs → Run allocation → Confirm report shows
2. Kill/restart the backend process → Navigate to Allocation → Confirm report still shows (loaded from GCS)
3. Verify strategy settings survive restart (excluded tier stays excluded)
4. Click "Start New Allocation" → confirm dialog shows
5. Cancel dialog → confirm nothing changes, still on Step 3
6. Confirm dialog → confirm goes to Step 1, report cleared
7. Navigate to Allocation fresh (no sessionStorage) → if last run exists → confirm lands on Step 3
