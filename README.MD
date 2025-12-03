# ☁️ Mingle - Cloud SaaS Application

> **University Coursework:** Cloud Computing (BUCI028H6)  
> **Grade Target:** Distinction 🏆

Mingle is a RESTful Software-as-a-Service (SaaS) application designed to mimic social media functionality similar to Twitter. It allows users to post messages, browse topics, and interact via likes, dislikes, and comments.

The project demonstrates advanced cloud-native development practices, including **Microservices architecture**, **Containerization (Docker)**, **Orchestration (Kubernetes/GKE)**, and **Secure Identity Management (OAuth 2.0)**.

---

## 🛠 Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose (StatefulSet)
*   **Authentication:** Passport.js (Google OAuth 2.0), JWT (JSON Web Tokens), BCrypt
*   **Containerization:** Docker, Docker Compose
*   **Orchestration:** Google Kubernetes Engine (GKE)
*   **Security & Networking:** NGINX Ingress Controller, Cert-Manager (Let's Encrypt), sslip.io

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
    git clone https://github.com/yourusername/mingle.git
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

## ☁️ Cloud Deployment (Google Kubernetes Engine)

This project uses a production-grade deployment strategy on GKE, utilizing **Ingress** for Layer 7 routing and **Cert-Manager** for automatic SSL.

### 1. Prerequisite Infrastructure
Install the NGINX Ingress Controller and Cert-Manager on the cluster:
```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install Cert-Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

### 2. Deployment
Apply the Kubernetes manifests located in the `k8s/` directory.

```bash
# 1. Configure SSL Issuer
kubectl apply -f k8s/issuer.yaml

# 2. Apply Secrets (Contains Base64 encoded Google Credentials & DB URI)
kubectl apply -f k8s/secrets.yaml

# 3. Deploy Database (StatefulSet)
kubectl apply -f k8s/mongo.yaml

# 4. Deploy API & Ingress Rules
kubectl apply -f k8s/api.yaml
```

### 3. DNS Configuration
The deployment uses `sslip.io` to map the Ingress External IP to a secure domain for Google OAuth compatibility.
*   **URL:** `https://mingle.<EXTERNAL-IP>.sslip.io`

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

## 📂 Project Structure

```text
mingle/
├── .env                  # Environment variables (DB URI, JWT Secrets, OAuth Keys)
├── Dockerfile            # Container image configuration (Phase E)
├── README.MD             # Coursework specification
├── app.js                # Entry point: App initialization, Middleware, DB connection
├── docker-compose.yml    # Local orchestration for App and MongoDB (Phase A/E)
├── package.json          # Project dependencies and scripts
├── config/
│   └── passport.js       # Passport.js strategies for Google OAuth v2 & Account Linking
├── k8s/                  # Kubernetes Manifests (Phase H)
│   ├── api.yaml          # Deployment, Service, and Ingress (HTTPS) configuration
│   ├── issuer.yaml       # Cert-Manager configuration for Let's Encrypt SSL
│   ├── mongo.yaml        # StatefulSet & Headless Service for MongoDB
│   └── secrets.yaml      # Base64 encoded secrets (Excluded from Git in real scenarios)
├── middleware/
│   └── auth.js           # JWT Bearer Token extraction and verification
├── models/
│   ├── Post.js           # Mongoose schema with TTL indexes and compound sorting
│   └── User.js           # Mongoose schema supporting hybrid Auth/Local users
├── routes/
│   ├── auth.js           # Endpoints: Registration, Login, OAuth callbacks
│   └── posts.js          # Endpoints: CRUD, Aggregation Pipelines, Pagination
└── test/
    ├── mingle_tests.js   # Automated testing script using Axios
    └── postman_data.json # Exported test data for manual verification
```

---

## 📝 License
This project was developed for academic purposes.
```
