# OptiFlow Production Architecture & On-Premise Strategy

This document outlines the recommended production-grade technology stack for OptiFlow, specifically designed for seamless switching between Cloud and On-Premise deployments.

---

### Recommended Full-Stack Architecture

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React (Vite) + TailwindCSS** | High-performance dashboard, fast rendering for large tables, responsive UI. |
| **Web Server / Proxy** | **NGINX** | Serves static frontend build, routes API traffic, handles HTTPS/SSL certificates. |
| **Backend Framework** | **Python (FastAPI)** | Async Python API layer; high performance, automatic OpenAPI documentation, strict Pydantic validation. |
| **Database** | **PostgreSQL** | Primary store for SOH, historical sales, store planograms, dispatch logs, and SKU catalog. |
| **ORM & Migrations** | **SQLAlchemy + Alembic** | Python object mapping and database schema version control. |
| **Async Task Queue** | **Celery + Redis** | Background queue for processing heavy allocation algorithms without freezing the UI. |
| **Packaging & Deploy** | **Docker + Docker Compose** | Wraps the entire stack into isolated containers for 1-click cloud or on-prem deployment. |

---

### Cloud vs. On-Premise Deployment Strategy

Because the entire application is containerized with Docker, the deployment architecture is identical in both environments.

#### 1. Cloud Deployment (AWS / GCP / Azure)
* **Hosting**: The Docker containers run on a virtual cloud server (e.g., AWS EC2 or GCP Compute Engine).
* **Database**: Managed database service (e.g., AWS RDS PostgreSQL).
* **Access**: Accessible over the public web via secure HTTPS (`https://optiflow.yourdomain.com`).

#### 2. On-Premise Deployment (Local Warehouse / Data Center)
* **Hosting**: The exact same Docker containers run on the client's internal physical server or local Virtual Machine (VMware / Proxmox).
* **Database**: PostgreSQL runs inside a Docker container with local volume storage or connects to the client's internal PostgreSQL cluster.
* **Access**: Accessible strictly over the company's internal network/Intranet (`http://192.168.1.50` or `http://optiflow.local`).

---

### Key Architectural Benefits

1. **Zero Licensing Costs**: The entire stack utilizes 100% open-source technologies with no recurring vendor software fees.
2. **Non-Blocking User Experience**: Heavy allocation algorithms run asynchronously in background Celery workers, keeping the manager dashboard fast and responsive.
3. **Data Integrity & Scale**: PostgreSQL provides ACID compliance for inventory movements and scales to handle millions of historical sales records.
4. **Instant On-Premise Portability**: Moving from Cloud to On-Premise requires zero code modifications—only environment configurations.
