import { useNavigate } from "react-router-dom";
import { LogoutIcon } from "./Icons";

function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="navbar">
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '20px' }}>
        <h3 style={{ textTransform: 'capitalize' }}>{role} Panel</h3>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#fee2e2',
            color: '#ef4444',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <LogoutIcon /> Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
