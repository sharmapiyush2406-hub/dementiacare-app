import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../styles/Login.css";

function Login() {
  const [role, setRole] = useState("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for toggling password
  const [error, setError] = useState(""); // State for error messages
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // Basic Validation
    if (!role) {
      setError("Please select a role.");
      return;
    }
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // Send POST request to /auth/login
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, _id, email: userEmail, role: userRole, firstName, lastName } = response.data;

      if (token) {
        // Enforce strong typing/role matching between user selection and backend role
        if (role !== userRole) {
          setError(`Invalid role selection. This account belongs to a ${userRole}.`);
          return;
        }

        // Save token and user info to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("role", userRole); // Use role from backend
        localStorage.setItem("user", JSON.stringify({ _id, email: userEmail, role: userRole, firstName: firstName || "", lastName: lastName || "" }));

        // Redirect based on role
        if (userRole === 'admin') navigate('/admin/dashboard');
        else if (userRole === 'doctor') navigate('/doctor/dashboard');
        else if (userRole === 'caregiver') navigate('/caregiver/dashboard');
        else if (userRole === 'patient') navigate('/patient/dashboard');
        else navigate('/dashboard'); // Fallback if needed
      } else {
        setError("Login failed: No token received.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Handle error response from backend
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <span className="welcome-text">WELCOME BACK</span>
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Access your healthcare portal securely</p>
        </div>

        {/* Error Message Display */}
        {error && <div className="error-message">{error}</div>}

        {/* Role Selection Tabs */}
        <div className="role-tabs">
          <div
            className={`role-tab ${role === 'doctor' ? 'active' : ''}`}
            onClick={() => setRole('doctor')}
          >
            <div className="role-icon">👨‍⚕️</div>
            <span>Doctor</span>
          </div>
          <div
            className={`role-tab ${role === 'patient' ? 'active' : ''}`}
            onClick={() => setRole('patient')}
          >
            <div className="role-icon">♿</div>
            <span>Patient</span>
          </div>
          <div
            className={`role-tab ${role === 'admin' ? 'active' : ''}`} // Assuming Staff relates to Admin or caregiver based on options from previous dropdown. Let's stick with the options user had: admin, doctor, caregiver, patient. Let's adapt Staff to Admin, and maybe add a 4th or keep it 3.
            onClick={() => setRole('admin')}
          >
            <div className="role-icon">🏥</div>
            <span>Admin</span>
          </div>
          <div
            className={`role-tab ${role === 'caregiver' ? 'active' : ''}`}
            onClick={() => setRole('caregiver')}
          >
            <div className="role-icon">🧑‍⚕️</div>
            <span>Caregiver</span>
          </div>
        </div>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="example@hc.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="input-icon right"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🕵️" : "👁️"}
              </span>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <span className="forgot-text">Forgot password?</span>
          </div>

          <button type="submit" className="login-btn">
            Sign In to Dashboard
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
