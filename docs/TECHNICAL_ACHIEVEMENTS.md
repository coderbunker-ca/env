# coderbunker-ca: Technical Achievements & Problems Solved

This document summarizes the key technical milestones and architectural problems solved during the development of the coderbunker-ca project.

## 🏗️ Infrastructure & DevOps

### 1. Core Cluster Strategy

- **Achievement**: Implemented a "Core Cluster" architecture that decouples shared platform tools from application workloads.
- **Benefit**: Tearing down or updating staging/dev environments no longer impacts production ingress, monitoring, or CI/CD runners.
- **Components**: Ingress NGINX, Cert-Manager, Monitoring Stack (Loki, Grafana, Prometheus), Shared GitHub Runners, and Docling API.

### 2. GitOps & Manifest Validation

- **Achievement**: Established a robust GitOps workflow using **FluxCD** and **SOPS**.
- **Problem Solved**: "Cluster-Equivalent" validation in pre-commit.
- **Solution**: Implemented a three-tier validation system:
  1. **Schema Validation**: `kubeconform`
  2. **Best Practices**: `kube-linter`
  3. **Admission Simulation**: `kubectl apply --dry-run=server` (simulates actual cluster admission webhooks).

### 3. Centralized Secret Management

- **Achievement**: Unified secret management using **Mozilla SOPS** (for encrypted storage in Git) and **OpenTofu** (for automated credential rotation).
- **Problem Solved**: Manual rotation of S3 keys and database credentials across multiple environments.
- **Solution**: A centralized `rotate-secrets.sh` script that bridges OpenTofu outputs with SOPS-encrypted manifests.

### 4. Consolidated Observability (Loki)

- **Achievement**: Migrated from fragmented logging (Graylog) to a consolidated **Loki SingleBinary** deployment with S3 storage.
- **Problem Solved**: High resource overhead and complexity of managing multiple log shippers.
- **Benefit**: Backend applications now use simple stdout logging; Promtail automatically handles collection and labeling.

## 🔐 Security & Identity

### 5. Global SSO Gateway

- **Achievement**: Implemented a cluster-wide SSO gateway using `oauth2-proxy` and Google SSO.
- **Problem Solved**: Protecting internal tools (Grafana, Admin Portal) without individual auth logic in every service.
- **Key Fixes**:
  - **Shared Sessions**: Configured `.coderbunker.ca` cookie domain to allow single sign-on across all subdomains.
  - **CORS/AJAX Protection**: Solved the "OIDC loop" for API calls by configuring `oauth2-proxy` to skip auth for `OPTIONS` preflight requests.

## 💾 Storage & Data

### 6. S3 Least-Privilege Model

- **Achievement**: Migrated legacy OCI storage to a structured, least-privilege S3 architecture on OVHcloud.
- **Problem Solved**: Over-privileged legacy users and inconsistent bucket naming.
- **Solution**: Dedicated runtime users (`prod_user`, `staging_user`) with granular JSON policies generated via OpenTofu.

### 7. Automated Backups & Restoration

- **Achievement**: Implemented automated, encrypted S3 and PostgreSQL backups via Kubernetes CronJobs.
- **Feature**: Developed `restore-s3-backup.sh` to provide a one-command "latest" recovery path for any environment.

## 🚀 Application & Features

### 8. Background Processing Architecture

- **Achievement**: Designed a resilient background job system using **Graphile Worker** and PostgreSQL.
- **Mechanism**: Use of `LISTEN/NOTIFY` for real-time state transitions, allowing the API server and workers to scale independently.

### 9. Unified Static Asset Delivery (OCI-as-Data)

- **Achievement**: Implemented the "OCI-as-Data" pattern for frontend deployments.
- **Problem Solved**: Slow and complex frontend builds in CI.
- **Solution**: Bundling static assets into OCI images that are served via a unified delivery mechanism, simplifying the promotion from staging to production.

### 10. AI-Powered Extraction (Docling & MCP)

- **Achievement**: Integrated **Docling API** for high-fidelity PDF-to-Markdown conversion.
- **Feature**: Implementation of the **Model Context Protocol (MCP)** to allow AI tools to interact directly with the coderbunker-ca backend.

---
*This summary was compiled from existing project documentation and changelogs.*
