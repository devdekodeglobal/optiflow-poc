# OptiFlow Production Architecture & On-Premise Strategy

This document outlines the recommended production-grade technology stack for OptiFlow, specifically designed for seamless switching between Cloud and On-Premise deployments on Linux OS.

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

### On-Premise Linux Server Environment (Ubuntu / RHEL / Rocky Linux)

For on-premise deployment, OptiFlow is designed to run directly on standard enterprise Linux operating systems (e.g., **Ubuntu Server 22.04 LTS**, **Debian 12**, **RHEL 9**, or **Rocky Linux 9**).

#### 1. Linux Server Prerequisites
* **Docker Engine & Docker Compose**: The server only requires Docker installed (`docker-ce` and `docker-compose-plugin`). No manual Python, Node.js, or PostgreSQL installations are needed on the host OS.
* **Network & Firewall**: Open inbound port `80` (HTTP) and port `443` (HTTPS) on the Linux firewall (`ufw allow 80,443/tcp` or `firewall-cmd --add-port={80,443}/tcp`).

#### 2. Quick Linux Deployment Commands
```bash
# 1. Clone repository or extract release bundle
git clone https://github.com/devdekodeglobal/optiflow-poc.git /opt/optiflow
cd /opt/optiflow

# 2. Configure Environment variables
cp .env.example .env

# 3. Build and launch all services in detached background mode
docker compose up -d --build
```

#### 3. Automatic System Boot & Auto-Restart (`systemd`)
To ensure OptiFlow automatically starts whenever the physical Linux server reboots or recovers from a power outage, create a simple `systemd` service:

`/etc/systemd/system/optiflow.service`:
```ini
[Unit]
Description=OptiFlow On-Premise Application Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/optiflow
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
```
Enable the service on Linux: `sudo systemctl enable --now optiflow`

#### 4. Data Persistence & Linux Nightly Backups
* **Database Volume**: PostgreSQL stores data securely on the Linux host filesystem at `/var/lib/docker/volumes/optiflow_postgres_data/_data`.
* **Automated Nightly Backup**: Add a simple Linux `cron` job (`/etc/cron.daily/optiflow-backup`) to perform nightly database dumps:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/optiflow"
mkdir -p $BACKUP_DIR
docker exec optiflow-postgres-1 pg_dump -U optiflow_user optiflow_db | gzip > "$BACKUP_DIR/optiflow_$(date +%Y%m%d).sql.gz"
find $BACKUP_DIR -type f -mtime +30 -delete
```

---

### Cloud vs. On-Premise Deployment Comparison

| Metric | Cloud Deployment (AWS / GCP) | On-Premise Deployment (Linux Server) |
| :--- | :--- | :--- |
| **Operating System** | Managed Linux VM (Ubuntu/Amazon Linux) | Enterprise Linux Server (Ubuntu / RHEL) |
| **Network Endpoint** | Public HTTPS Domain (`optiflow.company.com`) | Internal LAN IP (`http://192.168.1.50`) |
| **Database Host** | Cloud Managed DB (AWS RDS PostgreSQL) | Dockerized PostgreSQL on Linux Disk |
| **Hardware Control** | Virtual Cloud vCPU & RAM | Physical Server Hardware in Warehouse |
| **Portability** | Identical Docker Compose Configuration | Identical Docker Compose Configuration |

---

### Key Architectural Benefits

1. **Zero Software License Fees**: Runs 100% on free, open-source Linux software stack.
2. **Resilient On-Premise Recovery**: Linux `systemd` auto-restarts services automatically after server power cycles.
3. **Isolated Host Environment**: Docker isolates all app dependencies from the main Linux host OS.
4. **Data Integrity & Automated Backups**: PostgreSQL ACID compliance paired with native Linux automated cron backups.
