# Healthcare Management System (HCMS)

An enterprise-grade Healthcare Management System designed to streamline patient care, real-time monitoring, and administrative workflows. This application provides tailored dashboards and specific functionalities for Patients, Doctors, Caregivers, and Administrative Staff.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Tailored dashboards and access levels for Patients, Caregivers, Doctors, and Admin/Staff.
- **Real-Time Patient Monitoring:** Live dashboard for caregivers featuring static mapped locations and dynamic emergency/SOS alerts via Socket.IO.
- **Task Management:** Caregivers can view and manage their daily tasks (e.g., medical checkups, medication administration) assigned to specific patients.
- **Comprehensive Patient Profiles:** Detailed medical history, conditions, allergies, and emergency contacts.
- **Authentication & Security:** JWT-based authentication and secure password hashing using bcrypt.
- **Interactive UI:** A highly responsive frontend built with Vite, React, Recharts for data visualization, and React Leaflet for mapping.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** CSS/Tailwind CSS
- **Routing:** React Router DOM
- **Maps:** Leaflet & React-Leaflet
- **Data Visualization:** Recharts
- **Real-Time Communication:** Socket.IO-client

### Backend
- **Environment:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Real-Time:** Socket.IO (or custom event emitters)

## 📁 Project Structure

This repository is primarily the frontend module, but the project works in tandem with a distinct backend service.

```text
HC-FRONTEND/
├── src/
│   ├── admin/       # Admin Dashboard & User Management
│   ├── auth/        # Login/Registration features
│   ├── caregiver/   # Live tracking, Tasks, Alerts, & Patients
│   ├── doctor/      # Doctor Dashboard, Prescriptions, Consultations
│   ├── patient/     # Patient Portal, Medical Records
│   ├── services/    # API calls, Socket configurations
│   ├── shared/      # Common Components (Tables, Icons, Layouts)
│   └── index.css    # Global stylesheets
```

## ⚙️ Prerequisites

- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)
- **npm** (v9+ recommended)

## 💻 Local Installation & Setup

### 1. Clone the repository
```bash
git clone <repository_url>
```

### 2. Backend Setup
1. Navigate to the backend directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the backend folder:
   ```env
  PORT=5000
MONGO_URI=mongodb://localhost:27017/backenddb
JWT_SECRET=supersecretkey123

   ```
4. Start the backend development server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory (`HC-FRONTEND`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

## 🔒 Authentication Flow
The system supports multiple user models (`User`, `Caregiver`, `Doctor`, `Patient`, `Staff`). During login, the server evaluates the role identifier and routes the user to their designated dashboard via React Router.

## 🤝 Contributing
1. Fork the repository
2. Create a Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
