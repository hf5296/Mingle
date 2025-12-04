# ☁️ Mingle - Cloud SaaS Application

> **University Coursework:** Cloud Computing (BUCI028H6)  

Mingle is a RESTful Software-as-a-Service (SaaS) application designed to mimic social media functionality similar to Twitter. It allows users to post messages, browse topics, and interact via likes, dislikes, and comments.

The project demonstrates advanced cloud-native development practices, traversing the full spectrum from **Local Development** to **Virtual Machine Deployment (Docker)** and finally **Orchestration (Kubernetes/GKE)**.

---

## 🛠 Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **Authentication:** Passport.js (Google OAuth 2.0), JWT (JSON Web Tokens), BCrypt
*   **Containerization:** Docker, Docker Compose
*   **Orchestration:** Google Kubernetes Engine (GKE)
*   **Security & Networking:** NGINX Ingress Controller, Cert-Manager (Let's Encrypt), sslip.io

---

## 📂 Project Structure

```text
MINGLE/
├── config/             # Passport.js & OAuth configuration
├── k8s/                # Kubernetes Manifests (Deployment, Service, Ingress, Secrets)
├── middleware/         # Auth & Validation Middleware
├── models/             # Mongoose Schemas (User, Post)
├── routes/             # API Route Definitions
├── test/               # Automated Test Scripts
├── app.js              # Application Entry Point
├── Dockerfile          # Docker Image Build Instructions
└── docker-compose.yml  # Local & VM Orchestration
```

---

## ✨ Key Features

### 🔐 Authentication & Security
*   **Dual Authentication:** Supports both Local Email/Password and **Google OAuth 2.0**.
*   **Stateless Sessions:** Uses JWT Bearer tokens for scalable, stateless API access.
*   **Production Security:** Full **HTTPS/TLS termination** using Let's Encrypt and NGINX Ingress.

### 📱 Core Functionality
*   **Posting:** Users can create posts with specific topics (Tech, Health, Sport, Politics) and expiration times.
*   **Browsing:** Filter posts by topic and status (Live vs. Expired).
*   **Interactions:** Like, Dislike, and Comment on posts.
*   **Validation:** Strict input validation using `express-validator`.

### 📊 Analytics
*   **Activity Tracking:** Query for the "Most Active" post per topic based on engagement scores.
*   **History:** Browse archived/expired posts.

---

## 🚀 Getting Started (Local Development)

To run the application locally using Docker Compose:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hf5296/Mingle.git
    cd mingle
    ```

2.  **Configure Environment:**
    Create a `.env` file in the root directory (see `.env.example`).

3.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *   API will be available at: `http://localhost:3000`
    *   MongoDB will be available at: `localhost:27017`

---

## ☁️ Cloud Deployment (Docker VM)

For Phase E, the application was deployed to a standard Linux Virtual Machine (Google Compute Engine) using Docker Compose. This demonstrates the ability to deploy containerized applications without full orchestration overhead.

1.  **Provision VM:** Create a standard Ubuntu VM on Google Cloud and open port `3000` in the Firewall.
2.  **Environment Setup:** SSH into the VM and install Docker Engine & Compose.
3.  **Deploy:**
    ```bash
    git clone https://github.com/hf5296/Mingle.git
    cd mingle
    # Create production .env file
    nano .env 
    # Launch in detached mode
    docker-compose up -d
    ```
    *   API Access: `http://<VM-PUBLIC-IP>:3000`

---

## ☸️ Cloud Orchestration (Kubernetes / GKE)

For the final phase, the project was migrated to a production-grade architecture on **Google Kubernetes Engine (GKE)**, utilizing **Ingress** for Layer 7 routing and **Cert-Manager** for automatic SSL.

### 1. Prerequisite Infrastructure
Install the NGINX Ingress Controller and Cert-Manager on the cluster:
```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.14.0/deploy/static/provider/cloud/deploy.yaml

# Install Cert-Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.19.1/cert-manager.yaml
```

### 2. Deployment
Apply the Kubernetes manifests located in the `k8s/` directory.

```bash
# 1. Configure SSL Issuer
kubectl apply -f k8s/issuer.yaml

# 2. Apply Secrets (Contains Base64 encoded Google Credentials & DB URI)
kubectl apply -f k8s/secrets.yaml

# 3. Deploy Database (StatefulSet for data persistence)
kubectl apply -f k8s/mongo.yaml

# 4. Deploy API & Ingress Rules
kubectl apply -f k8s/api.yaml
```

### 3. DNS & Security Configuration
The deployment uses `sslip.io` to map the Ingress External IP to a secure domain for Google OAuth compatibility.
*   **URL:** `https://mingle.<EXTERNAL-IP>.sslip.io`
*   **Status:** Secured with Let's Encrypt R3 Certificate.

---

## 🧪 Testing

### Automated Testing
The project includes a custom test suite (`test/mingle_tests.js`) that automates the user registration and authentication flow (TC1-TC3).

```bash
# Run the test suite
npm test
```

### Postman Integration
The test suite automatically exports valid JWT tokens to `test/postman_data.json`. These can be imported into Postman to manually test advanced features (Posting, Liking, Browsing) without manually copying tokens.

---

## 📝 License
This project was developed for academic purposes.
```
