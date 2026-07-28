# OptiFlow - Retail Planogram & Assortment Allocation Engine 🚀

**OptiFlow** is an enterprise-grade retail inventory optimization, planogram management, and automated stock allocation platform built for retail networks (e.g., Centre For Sight / Dekode Global). It bridges physical store capacity constraints, demand-based reference SKU matching, and multi-tier store categorization with real-time stock allocation and automated dispatch order generation.

---

## 🛠️ Architecture & Tech Stack Overview

OptiFlow is engineered using a decoupled **Microservices-ready SPA + REST API** architecture designed for low latency, high throughput mathematical optimization, and persistent cloud state management.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│           React 19 + Vite + Glassmorphic Design System (CSS)           │
│                         Deployed on Vercel Edge                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST JSON API
┌──────────────────────────────────▼─────────────────────────────────────┐
│                           APPLICATION SERVER                           │
│              FastAPI (Python 3.11) + Uvicorn + Pydantic v2             │
│                 Deployed on GCP Cloud Run (asia-south1)                │
└──────────────┬───────────────────┬───────────────────┬─────────────────┘
               │                   │                   │
┌──────────────▼──────┐   ┌────────▼─────────┐   ┌─────▼─────────────────┐
│ ALLOCATION ENGINE   │   │ PERSISTENCE      │   │ VERSIONING & BACKUP   │
│ Pandas + NumPy      │   │ GCP Cloud Storage│   │ Automated Snapshot    │
│ Optimization Models │   │ Bucket & Cache   │   │ Point-in-time Restore │
└─────────────────────┘   └──────────────────┘   └───────────────────────┘
```

---

### 1. 🖥️ Frontend (Client Application)
- **Core Framework**: [React 19](https://react.dev/) (`react`, `react-dom` v19.2.7)
- **Build Tool & Dev Server**: [Vite](https://vitejs.dev/) v8.1.1 (Lightning-fast HMR & optimized production bundling)
- **Routing**: [React Router DOM](https://reactrouter.com/) v7.18.1 with SPA fallback routing configuration (`vercel.json` client-side rewrite handling)
- **Design System & Styling**: Custom **Vanilla CSS Design System** incorporating modern visual aesthetics:
  - Responsive glassmorphism (`backdrop-filter`, vibrant HSL color tokens)
  - Dark/Light card elevation, smooth micro-animations, custom flex/grid layouts
- **Data Visualization & Network Graphs**:
  - [Recharts](https://recharts.org/) v3.9.2 (Interactive sales vs stock distribution, bar charts, line graphs)
  - [React Force Graph 2D](https://github.com/vasturiano/react-force-graph) v1.29.1 (Store-to-Brand network topology diagrams)
- **Data Tables**: [React Data Grid](https://adazzle.github.io/react-data-grid/) v7.0.0-beta.61 + Custom Hierarchical Cards/Table Drill-Down Editor
- **State Management**: React Context API (`DataContext.jsx`) providing global filter synchronization, authentication session state, and persistent workspace settings.

---

### 2. ⚡ Backend (API & Computing Service)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11 runtime)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) with multi-worker asynchronous event loop handling
- **Data Schemas & Validation**: [Pydantic v2](https://docs.pydantic.dev/) (`data_models.py` defining strict type validation for store configs, planogram entries, allocation parameters, and dispatch orders)
- **Deployment Platform**: **GCP Cloud Run** (`asia-south1` region), fully containerized via `Dockerfile` with zero-downtime revision routing.

---

### 3. 🧠 Mathematical Allocation & Optimization Engine
> 📖 **Interactive Business Logic & Process Flow Diagram**: Open [`docs/allocation_logic_flow.html`](file:///Users/vanosski/Main/Projects/Dekode/centerforsight/docs/allocation_logic_flow.html) in any browser for the interactive step-by-step flowchart, similarity calculator, and column mapping matrix.

- **Engine Core**: [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/) (`allocation_engine.py`)
- **Key Algorithms**:
  - **Dynamic Capacity Calculation**: Computes `Target Capacity = Facing (Display) + Depth (Reserve)` across store hierarchies (`Zone > Region > Grade > Store > Brand > Commodity`).
  - **Reference SKU Matching**: Analyzes historic Sales Data CSVs over flexible lookback periods (7 Days, 30 Days, 90 Days, All Time) to identify high-performing reference SKUs per store category and grade.
  - **Facing & Stock Allocation**: Distributes available warehouse stock (`Stock Data.csv`) against target planogram capacities, factoring in store classification (Grade A/B/C, SIS/Retail).
  - **Dispatch Order Generation**: Calculates net allocation gaps and formats SKU-level dispatch requirements ready for warehouse fulfillment.

---

### 4. 🗄️ Database & Cloud Persistence Layer
- **Primary Data Store**: **Google Cloud Storage (GCS)** Bucket (`kopal-500607`)
  - Object-based persistence for master JSON datasets (`planogram_edited.json`, `strategy_settings.json`, `allocation_results.json`).
- **Version Control & Point-In-Time Backup**:
  - **Automatic GCP Snapshots**: Every edit in the Planogram Editor or Store Grade adjustment automatically creates a timestamped JSON backup (`backups/planogram_v_YYYY-MM-DD_HH-MM-SS.json`).
  - **Version Indexing**: `planogram_versions.json` maintains metadata tracking timestamps, row counts, and change descriptions for up to 50 versions.
  - **One-Click Reversion**: Frontend **History & Backups** modal allows users to restore any snapshot with a single click.
- **Local Fallback Cache**: `local_data/` directory caching on the backend file system for instant fallback during offline local development.

---

## 📂 Project Structure

```
centerforsight/
├── data/                            # Active Data Files (Planogram, Stock, Sales Data)
│   ├── Planogram_.csv
│   ├── Sale 6 Months.csv
│   ├── Stock_240726.csv
│   └── planogram.json
│
├── docs/                            # Documentation & HTML Tools
│   ├── data_viewer.html
│   └── notes1.html
│
├── optiflow_poc/                    # Primary Production Application Codebase
│   ├── backend/
│   │   ├── main.py                  # FastAPI Application & REST API Endpoints
│   │   ├── allocation_engine.py     # Core Allocation Algorithms & Mathematical Engine
│   │   ├── data_models.py           # Pydantic Schemas & Data Structures
│   │   ├── regions.py               # Geographic & Organizational Hierarchy Mapping
│   │   ├── Dockerfile               # Production Docker Container Specification
│   │   ├── requirements.txt         # Python Package Dependencies
│   │   └── local_data/              # Local Storage Cache Directory
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/          # Reusable Components (PlanogramDrillDown, MultiSelect, Navbar)
│   │   │   ├── pages/               # Application Pages (Planogram, Allocation, Dispatch, Analytics)
│   │   │   ├── api.js               # Centralized HTTP API Client Service
│   │   │   ├── DataContext.jsx      # Global React Context & Filter State Provider
│   │   │   ├── index.css            # Core Glassmorphic Design System & CSS Variables
│   │   │   └── main.jsx             # React Application Entrypoint
│   │   ├── package.json             # Frontend Dependencies & Build Scripts
│   │   └── vite.config.js           # Vite Bundler & Server Configuration
│   │
│   ├── scripts/                     # Utility & Store Audit Scripts
│   │   ├── find_unmapped.py
│   │   └── find_unmapped_api.py
│   │
│   └── README.md                    # Module Documentation
│
├── vercel.json                      # Vercel SPA Rewrites Configuration
└── README.md                        # Primary Project Documentation
```

---

## 🔐 Default Authentication Credentials

The application includes role-based login access:

| Role | Username / Selection | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Admin** | System Admin | `dekode1234` | Full Read/Write, Planogram Editing, Store Grade Strategy, Allocation Wizard |
| **Standard User** | Standard User | `dekode5678` | Read-only Reports, Allocation Analytics, Dispatch Summaries |

---

## ⚙️ Running Locally

### 1. Backend Setup (FastAPI)
```bash
cd optiflow_poc/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*API interactive documentation will be available at `http://localhost:8000/docs`.*

### 2. Frontend Setup (Vite / React)
```bash
cd optiflow_poc/frontend
npm install
npm run dev
```
*The web interface will start locally at `http://localhost:5173`.*

---

## 🚀 Deployment

- **Frontend**: Deployed automatically on push to `main` via **Vercel**.
- **Backend**: Containerized and deployed to **GCP Cloud Run** (`asia-south1`) via Google Cloud SDK:
  ```bash
  gcloud run deploy optiflow-backend --source . --region asia-south1 --allow-unauthenticated
  ```
