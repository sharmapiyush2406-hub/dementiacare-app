import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/pages/Login";
import AdminDashboard from "./admin/pages/AdminDashboard";
import CaregiverDashboard from "./caregiver/pages/CaregiverDashboard";
import PatientDashboard from "./patient/pages/PatientDashboard";
import ManageUsers from "./admin/pages/ManageUsers";
import Caregivers from "./admin/pages/Caregivers";
import Doctors from "./admin/pages/Doctors";
import Analytics from "./admin/pages/Analytics";
import Settings from "./admin/pages/Settings";
import ManageReports from "./admin/pages/ManageReports";

// Patient Pages
import DailyReminders from "./patient/pages/DailyReminders";
import Medication from "./patient/pages/Medication";
import PatientReports from "./patient/pages/Reports";
import Profile from "./patient/pages/Profile";
import CaregiverProfile from "./patient/pages/CaregiverProfile";
import Appointments from "./patient/pages/Appointments";
import MemoryAssistant from "./patient/pages/MemoryAssistant";

// Caregiver Pages
import Patients from "./caregiver/pages/Patients";
import CaregiverTasks from "./caregiver/pages/Tasks";
import CaregiverReports from "./caregiver/pages/Reports";
import Alerts from "./caregiver/pages/Alerts";

// Doctor Pages
import DoctorDashboard from "./doctor/pages/DoctorDashboard";
import DoctorPatients from "./doctor/pages/DoctorPatients";
import DoctorSchedule from "./doctor/pages/DoctorSchedule";
import DoctorReports from "./doctor/pages/DoctorReports";
import DoctorProfile from "./doctor/pages/DoctorProfile";
import DoctorSettings from "./doctor/pages/DoctorSettings";
import DoctorStaff from "./doctor/pages/DoctorStaff";
import DoctorMedicines from "./doctor/pages/DoctorMedicines";

import ProtectedRoute from "./shared/components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/caregivers" element={<ProtectedRoute allowedRole="admin"><Caregivers /></ProtectedRoute>} />
        <Route path="/admin/doctors" element={<ProtectedRoute allowedRole="admin"><Doctors /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><Analytics /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><Settings /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><ManageReports /></ProtectedRoute>} />

        {/* Patient Routes */}
        <Route path="/patient" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/dashboard" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/tasks" element={<Navigate to="/patient/reminders" replace />} />
        <Route path="/patient/reminders" element={<ProtectedRoute allowedRole="patient"><DailyReminders /></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute allowedRole="patient"><Appointments /></ProtectedRoute>} />
        <Route path="/patient/medication" element={<ProtectedRoute allowedRole="patient"><Medication /></ProtectedRoute>} />
        <Route path="/patient/reports" element={<ProtectedRoute allowedRole="patient"><PatientReports /></ProtectedRoute>} />
        <Route path="/patient/caregiver" element={<ProtectedRoute allowedRole="patient"><CaregiverProfile /></ProtectedRoute>} />
        <Route path="/patient/profile" element={<ProtectedRoute allowedRole="patient"><Profile /></ProtectedRoute>} />
        <Route path="/patient/memory-assistant" element={<ProtectedRoute allowedRole="patient"><MemoryAssistant /></ProtectedRoute>} />

        {/* Caregiver Routes */}
        <Route path="/caregiver" element={<ProtectedRoute allowedRole="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/caregiver/dashboard" element={<ProtectedRoute allowedRole="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/caregiver/patients" element={<ProtectedRoute allowedRole="caregiver"><Patients /></ProtectedRoute>} />
        <Route path="/caregiver/tasks" element={<ProtectedRoute allowedRole="caregiver"><CaregiverTasks /></ProtectedRoute>} />
        <Route path="/caregiver/reports" element={<ProtectedRoute allowedRole="caregiver"><CaregiverReports /></ProtectedRoute>} />
        <Route path="/caregiver/alerts" element={<ProtectedRoute allowedRole="caregiver"><Alerts /></ProtectedRoute>} />

        {/* Doctor Routes */}
        <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute allowedRole="doctor"><DoctorPatients /></ProtectedRoute>} />
        <Route path="/doctor/schedule" element={<ProtectedRoute allowedRole="doctor"><DoctorSchedule /></ProtectedRoute>} />
        <Route path="/doctor/reports" element={<ProtectedRoute allowedRole="doctor"><DoctorReports /></ProtectedRoute>} />
        <Route path="/doctor/staff" element={<ProtectedRoute allowedRole="doctor"><DoctorStaff /></ProtectedRoute>} />
        <Route path="/doctor/medicines" element={<ProtectedRoute allowedRole="doctor"><DoctorMedicines /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute allowedRole="doctor"><DoctorProfile /></ProtectedRoute>} />
        <Route path="/doctor/settings" element={<ProtectedRoute allowedRole="doctor"><DoctorSettings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
