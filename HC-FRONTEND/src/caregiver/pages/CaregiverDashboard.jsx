import CaregiverLayout from "../layouts/CaregiverLayout";
import "../../shared/styles/Dashboard.css";
import Table from "../../shared/components/Table";
import StatsCard from "../../shared/components/StatsCard";
import { UsersIcon, ActivityIcon, AlertIcon, FileTextIcon } from "../../shared/components/Icons";
import AdherenceChart from "../components/AdherenceChart";
import EmergencyModal from "../components/EmergencyModal";
import { useEffect, useState } from "react";
import socket from "../../services/socket";

function CaregiverDashboard() {
  const [activeSOS, setActiveSOS] = useState(null);
  useEffect(() => {
    let myUserId = null;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      myUserId = user._id || null;
    } catch (e) {}

    const handleSosAlert = (data) => {
      if (!data.caregiverUserId || data.caregiverUserId === myUserId) {
        setActiveSOS(data);
      }
    };

    socket.on('sos-alert', handleSosAlert);
    return () => {
      socket.off('sos-alert', handleSosAlert);
    };
  }, []);

  return (
    <CaregiverLayout>
      <EmergencyModal alertData={activeSOS} onClose={() => setActiveSOS(null)} />
      
      <h2>Caregiver Dashboard</h2>

      <div className="stats-grid">
        <StatsCard
          title="Assigned Patients"
          value="12"
          icon={<UsersIcon />}
          color="blue"
        />
        <StatsCard
          title="Pending Tasks"
          value="5"
          icon={<ActivityIcon />}
          color="orange"
        />
        <StatsCard
          title="Critical Alerts"
          value="1"
          icon={<AlertIcon />}
          color="red"
        />
        <StatsCard
          title="Reports Review"
          value="3"
          icon={<FileTextIcon />}
          color="purple"
        />
      </div>

      <AdherenceChart />

      <div className="table-container-wrapper">
        <Table
          title="Today's Schedule"
          columns={[
            { header: "Time", accessor: "time" },
            { header: "Patient", accessor: "patient" },
            { header: "Task", accessor: "task" },
            { header: "Status", accessor: "status", render: (row) => <span className={`status-badge ${row.statusClass}`}>{row.status}</span> }
          ]}
          data={[
            { id: 1, time: "09:00 AM", patient: "John Doe", task: "Morning Checkup", status: "Done", statusClass: "active" },
            { id: 2, time: "11:30 AM", patient: "Jane Smith", task: "Medication", status: "Pending", statusClass: "pending" }
          ]}
        />
      </div>

    </CaregiverLayout>
  );
}

export default CaregiverDashboard;
