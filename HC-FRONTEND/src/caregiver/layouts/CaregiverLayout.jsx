import { useState } from "react";
import Sidebar from "../../shared/components/Sidebar";
import Navbar from "../../shared/components/Navbar";
import "../../shared/components/Layout.css";
import { HomeIcon, UsersIcon, ClipboardIcon, FileTextIcon, AlertIcon } from "../../shared/components/Icons";

function CaregiverLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/caregiver/dashboard", icon: <HomeIcon /> },
    { name: "Patients", path: "/caregiver/patients", icon: <UsersIcon /> },
    { name: "Assign Tasks", path: "/caregiver/tasks", icon: <ClipboardIcon /> },
    { name: "Reports", path: "/caregiver/reports", icon: <FileTextIcon /> },
    { name: "Alerts", path: "/caregiver/alerts", icon: <AlertIcon /> },
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        isOpen={isOpen}
        toggleSidebar={() => setIsOpen(!isOpen)}
        menuItems={menuItems}
        title="Caregiver Panel"
      />

      <div className="main-area">
        <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default CaregiverLayout;
