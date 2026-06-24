import { useState } from "react";
import Sidebar from "../../shared/components/Sidebar";
import Navbar from "../../shared/components/Navbar";
import "../../shared/components/Layout.css";
import { HomeIcon, UsersIcon, ActivityIcon, SettingsIcon, HeartIcon, StethoscopeIcon, FileTextIcon } from "../../shared/components/Icons";

function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <HomeIcon /> },
    { name: "Manage Users", path: "/admin/users", icon: <UsersIcon /> },
    { name: "Doctors", path: "/admin/doctors", icon: <StethoscopeIcon /> },
    { name: "Caregivers", path: "/admin/caregivers", icon: <HeartIcon /> },
    { name: "Medical Reports", path: "/admin/reports", icon: <FileTextIcon /> },
    { name: "Analytics", path: "/admin/analytics", icon: <ActivityIcon /> },
    { name: "Settings", path: "/admin/settings", icon: <SettingsIcon /> },
  ];

  return (


    <div className="dashboard-wrapper">

      <Sidebar
        isOpen={isOpen}
        toggleSidebar={() => setIsOpen(!isOpen)}
        menuItems={menuItems}
        title="Admin Panel"
      />

      <div className="main-area">
        <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />
        <div className="content-area">{children}</div>
      </div>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}

    </div>

  );
}

export default AdminLayout;
