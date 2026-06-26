# Dementia Care App - Backend Service

This is the backend service for the Dementia Care application, built using Node.js, Express, MongoDB, and Socket.IO.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local installation or MongoDB Atlas cluster)

### 2. Installation
Navigate to the `BACKEND` directory and install the required dependencies:
```bash
cd BACKEND
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `BACKEND` directory (you can copy your local values here). Ensure the following environment variables are configured:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/backenddb  # Or your MongoDB Atlas connection string
JWT_SECRET=your_super_secret_jwt_key            # Secret used for signing JWT tokens
```

*Note: The backend loads this `.env` file using robust absolute paths, allowing you to run start and seed commands from anywhere in the repository directory structure without path resolution issues.*

### 4. Running the Server
To run the server in development mode with automatic hot-reloading:
```bash
npm run dev
```
The server will start on port `5000` (or the port specified in your `.env` file) and connect to MongoDB.

---

## 🌱 Database Seeding

The backend includes a comprehensive seeding script to populate your database with initial mockup data (doctors, patients, caregivers, medicines, tasks, appointments, reports, chats, etc.).

### Run Seeding (Local Only)
To seed the database, run the following command from the `BACKEND` directory:
```bash
npm run seed
```

### 🔒 Production Safety Safeguards
To prevent accidental database overrides or data loss, the seeding script includes the following safeguards:
1. **Production/Render Bypass**: If the script detects that it is running in a production environment (`NODE_ENV=production`) or on Render (`RENDER=true`), it will immediately abort execution, print a safe warning, and exit cleanly with code `0`.
2. **Graceful Build/Deploy Integration**: By exiting with code `0` when skipped, the script does not break automated pipelines, build steps, or Render deployments even if invoked.
3. **Local Validation**: If the script is run locally but the `MONGO_URI` environment variable is missing, it will log a clear error message explaining how to fix it, rather than throwing an unhandled exception.

---

## 🚀 Render Deployment Guide

Follow these steps to configure your backend for high-availability production deployment on **Render**:

### 1. Render Web Service Configuration
When creating a new **Web Service** on Render, configure the following settings:
- **Repository**: Connect your GitHub repository.
- **Root Directory**: `BACKEND` (This is critical since the backend is nested in a subfolder).
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (Runs `node server.js` to boot up the production server).

### 2. Production Environment Variables
Navigate to the **Environment** tab in your Render Web Service dashboard and add the following keys:
- `MONGO_URI`: Your production MongoDB Atlas connection string.
- `JWT_SECRET`: A secure, random string used to sign JWT authentication tokens.
- `NODE_ENV`: Set to `production` (enables production optimizations and disables database seeding).

### 3. Continuous Deployment (Auto-Deploy)
- Keep **Auto-Deploy** set to **Yes** in the Render service settings.
- Whenever you push changes to your GitHub repository's main branch, Render will automatically detect the push, run the build command (`npm install`), and deploy the updated server seamlessly without manual intervention.
- The startup validation checks in `server.js` will verify the environment variables are correctly loaded before starting the HTTP and Socket.IO server, guaranteeing a stable boot.
