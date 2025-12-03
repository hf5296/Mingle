# ☁️ Mingle - Cloud SaaS Application

![Node.js](https://img.shields.io/badge/Node.js-v20-green)
![Express](https://img.shields.io/badge/Express-v5-white)
![MongoDB](https://img.shields.io/badge/MongoDB-v7-green)
![Docker](https://img.shields.io/badge/Docker-Container-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-GKE-326ce5)
![License](https://img.shields.io/badge/License-ISC-yellow)

**Mingle** is a RESTful Software-as-a-Service (SaaS) application designed to demonstrate modern Cloud Computing principles. It serves as a Twitter-like social platform where users can post messages, browse topics, and interact via likes, dislikes, and comments.

This project goes beyond standard web development by implementing a fully **Cloud-Native architecture** on Google Kubernetes Engine (GKE), featuring **TLS/SSL termination**, **Ingress routing**, and **OAuth 2.0 authentication**.

---

## 🚀 Key Features

### 🔐 Security & Authentication
*   **Dual Authentication:** Supports both Local (Email/Password with Bcrypt) and **Google OAuth 2.0**.
*   **Stateless Design:** Uses **JWT (JSON Web Tokens)** for session management, allowing the API to scale horizontally without sticky sessions.
*   **Secure Deployment:** Fully encrypted traffic via **HTTPS** using Let's Encrypt and Cert-Manager.

### 💬 Social Interactions
*   **Posts:** Create time-sensitive posts (with auto-expiration) categorized by topics (Tech, Health, Sport, Politics).
*   **Interactions:** Users can Like, Dislike, and Comment on live posts.
*   **Filtering:** Advanced query capabilities to browse "Live" vs. "Expired" posts.
*   **Analytics:** Aggregation pipelines to find the "Most Active" posts per topic.

### 🏗️ Infrastructure
*   **Containerization:** Fully Dockerized application for consistent environments.
*   **Orchestration:** Deployed on **GKE (Google Kubernetes Engine)** using declarative YAML manifests.
*   **Service Discovery:** Internal Kubernetes DNS resolution between API and Database.
*   **Self-Healing:** Automated pod restarts and replica management.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js & Express | RESTful API logic |
| **Database** | MongoDB | NoSQL data persistence |
| **Container** | Docker | Application packaging (Alpine Linux base) |
| **Orchestration** | Kubernetes (K8s) | GKE Cluster management |
| **Ingress** | NGINX Controller | Layer 7 Load Balancing & Routing |
| **Security** | Cert-Manager | Automated TLS Certificate issuance |
| **Auth** | Passport.js | OAuth 2.0 strategies |

---

## 📂 Project Structure

```text
MINGLE/
├── config/             # Passport & DB configuration
├── k8s/                # Kubernetes Manifests (Infrastructure as Code)
│   ├── api.yaml        # Deployment, Service, and Ingress
│   ├── mongo.yaml      # StatefulSet & Headless Service
│   ├── issuer.yaml     # Let's Encrypt ClusterIssuer
│   └── secrets.yaml    # Encrypted credentials
├── middleware/         # Auth & Validation middleware
├── models/             # Mongoose Schemas (User, Post)
├── routes/             # API Route definitions
├── test/               # Automated test scripts
├── Dockerfile          # Multi-stage Docker build
├── docker-compose.yml  # Local development environment
└── app.js              # Entry point
