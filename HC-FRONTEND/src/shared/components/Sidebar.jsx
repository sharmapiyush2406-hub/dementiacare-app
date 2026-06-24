import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ isOpen, toggleSidebar, menuItems, title }) {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        {isOpen && <h2>{title}</h2>}
        <button onClick={toggleSidebar} className="toggle-btn">
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} className={location.pathname === item.path ? "active" : ""}>
            <Link to={item.path} title={item.name}>
              <span className="icon">{item.icon}</span>
              {isOpen && <span className="label">{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>


    </div >
  );
}

export default Sidebar;
