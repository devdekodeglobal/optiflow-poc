# AI Generation Prompt: Build OptiFlow POC Codebase

Use this document as an instruction prompt to generate the boilerplate skeleton structure for the `optiflow_poc` application using the **Strict N-Tier Closed Layered Architecture**. 

**CRITICAL REQUIREMENT:** The generating AI should **not** write the fully implemented production code. Instead, it must generate the complete folder structure and write boilerplate/skeleton files filled with descriptive docstrings and comments. These files must clearly explain their architectural role, the required imports, and basic mock function signatures, making it extremely easy for any developer to step in and immediately understand where everything lives and how the layers communicate.

The application structure flows strictly linearly: **React.js (Presentation) ➔ FastAPI (Service API) ➔ Pandas/Python Engine (Business Logic) ➔ SQLAlchemy ORM (Data Access/DAL) ➔ PostgreSQL (Persistence)**.

---

## Architectural Rules
1. **Strict Layers (Closed Layer Pattern):** 
   - The Presentation layer (React) *only* calls the Service API (FastAPI).
   - The Service API (FastAPI) *only* calls the Business Logic Layer (Allocation Engine). It does **not** call the DAL or Database directly.
   - The Business Logic Layer (Allocation Engine) *only* calls the Data Access Layer (DAL) to fetch and save data.
   - The Data Access Layer (DAL) *only* talks to PostgreSQL.
2. **Technological Stack:**
    - **Frontend:** React.js, TailwindCSS (for styling), Axios, **TanStack React Query** (for data fetching and cache management), and **TanStack Router** (for type-safe routing).
    - **Backend API:** FastAPI (Python 3.10+) with Pydantic schemas for request validation.
    - **Engine:** Python Pandas/NumPy executing the mathematical allocation rules.
    - **Data Access:** SQLAlchemy 2.0 ORM with PostgreSQL database driver (`psycopg2-binary`).
    - **Database:** PostgreSQL (with transactional rollbacks via SQLAlchemy).

---

## Target Directory & File Structure

Generate the following structure inside the `/optiflow_poc` directory:

```text
optiflow_poc/
├── README.md                           # Overview of the project, stack, and run instructions
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI server initialization & API routers (Service API)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── allocation.py           # Pydantic schemas for Request/Response validation
│   │   │   └── forecasting.py          # Pydantic schemas for forecasting request/response validation
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── allocation_engine.py    # Allocation math, business constraints (Pandas/NumPy)
│   │   │   └── forecasting_engine.py   # Sales forecasting model boilerplate (Pandas/NumPy)
│   │   ├── dal/
│   │   │   ├── __init__.py
│   │   │   ├── database.py             # SQLAlchemy session manager & connection pool
│   │   │   ├── models.py               # SQLAlchemy database declarations (PostgreSQL tables)
│   │   │   └── repositories.py         # Repository classes for DB queries (Fetch & Save logic)
│   ├── requirements.txt                # Python backend dependencies
│   ├── .env.example                    # Template for database connection credentials
│   └── tests/
│       ├── __init__.py
│       ├── test_allocation.py          # Unit tests for the Allocation Engine math & rules
│       ├── test_forecasting.py         # Unit tests for the Forecasting Engine predictions
│       └── test_dal_transactions.py    # Transactional rollback & audit log writing verification
└── frontend/
    ├── package.json                    # Node dependencies (Vite, React, Tailwind, Axios, @tanstack/react-query, @tanstack/react-router)
    ├── vite.config.js                  # Vite configuration
    ├── index.html                      # Entrypoint HTML
    ├── src/
    │   ├── main.jsx                    # Vite React app bootstrap (registers TanStack Router & QueryClient)
    │   ├── App.jsx                     # Root router provider and React Query DevTools setup
    │   ├── index.css                   # Tailwind CSS imports & base styles
    │   ├── components/
    │   │   └── AllocationForm.jsx      # Form to trigger allocations (via TanStack Mutation)
    │   ├── pages/
    │   │   ├── LoginPage.jsx           # Simple login screen for mock auth
    │   │   └── AllocationSummaryPage.jsx # Screen showing deficits & final allocations (uses TanStack Query)
    │   └── services/
    │       └── api.js                  # Axios client to talk to the FastAPI backend (used by TanStack Queries)
```

---

## Technical Specifications by Tier

### 1. Persistence Layer (PostgreSQL)
Implement a clean PostgreSQL relational schema matching the following structure:
- **`stores`**: 
  - `store_code` (VARCHAR(50), PK)
  - `store_name` (VARCHAR(255))
  - `csv_aliases` (JSONB) - Maps messy CSV identifiers to master store code
  - `store_type` (VARCHAR(50))
  - `store_grade` (VARCHAR(10)) - Tier ranking (e.g. A, B, C)
  - `dispatch_slab` (VARCHAR(50)) - Frequency slab (e.g. A-Weekly)
  - `region` (VARCHAR(50))
  - `zone` (VARCHAR(50))
  - `team_rank` (INTEGER) - Priority ranking for allocation
- **`brands`**: 
  - `brand_name` (VARCHAR(100), PK)
  - `brand_code` (VARCHAR(50))
  - `brand_type` (VARCHAR(100))
  - `brand_category` (VARCHAR(100))
  - `supplier_name` (VARCHAR(255))
- **`products`** (SKU Catalog): 
  - `item_code` (VARCHAR(100), PK)
  - `brand_name` (VARCHAR(100), FK linking `brands.brand_name`)
  - `product_type` (VARCHAR(50))
  - `mrp` (NUMERIC(10,2))
  - `model_id` (VARCHAR(100))
  - `color` (VARCHAR(50))
  - `gender` (VARCHAR(20))
  - `size` (VARCHAR(20))
  - `shape` (VARCHAR(50))
  - `frame_type` (VARCHAR(50))
  - `raw_description` (TEXT)
  - `csv_aliases` (JSONB) - Maps barcodes and legacy SKUs
- **`planograms`** (Display Targets): 
  - `store_code` (VARCHAR(50), PK/FK linking `stores.store_code`)
  - `brand_name` (VARCHAR(100), PK/FK linking `brands.brand_name`)
  - `product_type` (VARCHAR(50), PK)
  - `facing` (INTEGER) - Target display shelf capacity
  - `start_month` (VARCHAR(50))
  - `depth` (INTEGER) - Target backing stock depth
- **`stock`**: 
  - `store_code` (VARCHAR(50), FK linking `stores.store_code`)
  - `item_code` (VARCHAR(100), FK linking `products.item_code`)
  - `barcode` (VARCHAR(100))
  - `quantity` (INTEGER)
  - `batch_no` (VARCHAR(100))
  - `grn_timestamp` (TIMESTAMP)
- **`sales`**: 
  - `store_code` (VARCHAR(50), FK linking `stores.store_code`)
  - `item_code` (VARCHAR(100), FK linking `products.item_code`)
  - `barcode` (VARCHAR(100))
  - `quantity` (INTEGER)
  - `net_amount` (NUMERIC(10,2))
  - `order_date` (DATE)
  - `status` (VARCHAR(50))
- **`allocations`** (Dispatch Report): 
  - `run_id` (UUID, PK)
  - `store_code` (VARCHAR(50), FK linking `stores.store_code`)
  - `item_code` (VARCHAR(100), FK linking `products.item_code`)
  - `match_tier` (VARCHAR(50)) - Tier matched (e.g. T1_EXACT)
  - `generated_at` (TIMESTAMP)
- **`audit_logs`** (Mirror Table): 
  - `audit_id` (UUID, PK)
  - `action_type` (VARCHAR(50)) - e.g. INSERT, UPDATE, DELETE
  - `changed_by` (VARCHAR(255))
  - `changed_at` (TIMESTAMP)
  - Copy parameters mapping changes to master store details, planogram facings, and override values.

### 2. Data Access Layer (SQLAlchemy DAL)
- Use SQLAlchemy 2.0 declarative models (`models.py`) mapping to the tables above.
- Implement a transaction session helper (`database.py`) supporting automatic rollbacks on failure.
- Implement repository patterns (`repositories.py`):
  - `StoreRepository.get_all_data()`: Joins planograms, inventories, and stores to fetch comprehensive records.
  - `AllocationRepository.save_allocations()`: Bulk inserts calculation records and writes the final audit log inside a single database transaction.

### 3. Business Logic Layer (Allocation & Forecasting Engines)
- Generate the following two engines inside the `/engine` folder:
  1. **Allocation Engine (`allocation_engine.py`):**
     - Takes raw store and inventory records retrieved from the DAL.
     - Convert records into Pandas DataFrames.
     - Execute calculations: $\text{Deficit} = \text{Target Facings} - \text{Current Stock}$.
     - Enforce business logic constraints (e.g. priority 'A' stores first, color mix constraints).
     - Returns the final allocations as a structured list of dictionaries.
  2. **Sales Forecasting Engine (`forecasting_engine.py`):**
     - Takes historical sales data from the DAL.
     - Execute basic forecasting calculations (e.g. moving averages, seasonality multipliers using Pandas/NumPy).
     - Returns target stock predictions for future periods.

### 4. Service API Layer (FastAPI)
- `main.py` exposes REST endpoints.
- `/api/v1/allocation/run`:
  - Receives a POST request with parameters (validated by `allocation.py` schema).
  - Calls `allocation_engine.run_workflow(params)`.
  - Returns success/failure response.
- `/api/v1/forecasting/run`:
  - Receives a POST request with parameters (validated by `forecasting.py` schema).
  - Calls `forecasting_engine.run_forecast(params)`.
  - Returns predicted stock metrics.
- `/api/v1/planograms/history/{store_code}/{brand_name}`:
  - Fetches previous facing targets from the `audit_logs` mirror table.
  - Returns a chronological version history of planogram changes.
- `/api/v1/planograms/restore`:
  - Receives a specific `audit_id`.
  - Restores the planogram target facings to that historical version, logging a new audit event.

### 5. Presentation Layer (React.js with TanStack)
- Build a responsive interface with Tailwind CSS.
- Use **TanStack Router** to manage type-safe client routes (Login and Allocation pages).
- Use **TanStack Query** (`useQuery` / `useMutation`) for all backend API interactions:
  - Cache allocation results and background job updates.
  - Automatically refetch database changes upon mutation success.
- **Login Page:** Standard mock login credentials. Stores auth token using state or local storage.
- **Allocation Screen:**
  - Dropdown parameters selector.
  - "Run Allocation" button that triggers the FastAPI endpoint via a TanStack Mutation.
  - Interactive grid displaying the before/after stock levels and the calculated target deficits (backed by React Query cache).
- **Planogram Management Screen:**
  - Grid to view and edit current planogram facing targets.
  - "View History" button that opens a modal showing historical versions of the planogram.
  - "Restore" button on historical records that triggers the restore mutation and invalidates the TanStack query cache to refresh the UI.

---

## Testing & Verification Specifications
The generating AI must create robust unit/integration test structures inside the `backend/tests/` folder to verify:
1. **Engine Correctness:** Test that the Allocation Engine correctly prioritizes 'A' stores, flags shortages, and enforces color mix constraints without modifying database tables directly.
2. **Transaction Integrity:** Test that if any allocation entry fails to write, the entire transaction is rolled back, leaving the database state clean.
3. **Audit Log Validation:** Verify that a successfully completed allocation run writes a corresponding timestamped entry containing accurate calculation metrics (total deficit, total allocated, elapsed run time) to the `audit_logs` table.
