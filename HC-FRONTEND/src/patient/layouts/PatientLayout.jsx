import { useState } from "react";
import Sidebar from "../../shared/components/Sidebar";
import Navbar from "../../shared/components/Navbar";
import "../../shared/components/Layout.css";
import { HomeIcon, ClipboardIcon, PillIcon, FileTextIcon, UserIcon, CalendarIcon } from "../../shared/components/Icons";

function PatientLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/patient/dashboard", icon: <HomeIcon /> },
    { name: "Daily Reminders", path: "/patient/reminders", icon: <ClipboardIcon /> },
    { name: "Appointments", path: "/patient/appointments", icon: <CalendarIcon /> },
    { name: "Medication", path: "/patient/medication", icon: <PillIcon /> },
    { name: "Memory Assistant", path: "/patient/memory-assistant", icon: "🧠" },
    { name: "Caregiver", path: "/patient/caregiver", icon: "👩‍⚕️" },
    { name: "Reports", path: "/patient/reports", icon: <FileTextIcon /> },
    { name: "Profile", path: "/patient/profile", icon: <UserIcon /> },
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        isOpen={isOpen}
        toggleSidebar={() => setIsOpen(!isOpen)}
        menuItems={menuItems}
        title="Patient Panel"
      />

      <div className="main-area">
        <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}

export default PatientLayout;
