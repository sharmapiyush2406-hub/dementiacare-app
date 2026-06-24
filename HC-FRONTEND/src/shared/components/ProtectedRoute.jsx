import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // Redirect to their own dashboard if they try to access the wrong one
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
        if (role === 'caregiver') return <Navigate to="/caregiver/dashboard" replace />;
        if (role === 'patient') return <Navigate to="/patient/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
