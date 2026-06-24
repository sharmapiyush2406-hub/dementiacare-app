import { useState } from "react";
import Sidebar from "../../shared/components/Sidebar";
import Navbar from "../../shared/components/Navbar";
import "../../shared/components/Layout.css";
import {
    HomeIcon,
    UsersIcon,
    CalendarIcon,
    FileTextIcon,
    UserIcon,
    SettingsIcon,
    PillIcon,
    MedicalCrossIcon,
} from "../../shared/components/Icons";

function DoctorLayout({ children }) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: "Dashboard", path: "/doctor/dashboard", icon: <HomeIcon /> },
        { name: "My Patients", path: "/doctor/patients", icon: <UsersIcon /> },
        { name: "Schedule", path: "/doctor/schedule", icon: <CalendarIcon /> },
        { name: "Reports", path: "/doctor/reports", icon: <FileTextIcon /> },
        { name: "Hospital Staff", path: "/doctor/staff", icon: <MedicalCrossIcon /> },
        { name: "Medicines", path: "/doctor/medicines", icon: <PillIcon /> },
        { name: "Profile", path: "/doctor/profile", icon: <UserIcon /> },
        { name: "Settings", path: "/doctor/settings", icon: <SettingsIcon /> },
    ];

    return (
        <div className="dashboard-wrapper">
            <Sidebar
                isOpen={isOpen}
                toggleSidebar={() => setIsOpen(!isOpen)}
                menuItems={menuItems}
                title="Doctor Panel"
            />
            <div className="main-area">
                <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />
                <div className="content-area">{children}</div>
            </div>
            {isOpen && (
                <div className="overlay" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    );
}

export default DoctorLayout;
