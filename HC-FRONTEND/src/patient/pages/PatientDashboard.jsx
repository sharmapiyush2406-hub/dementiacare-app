import { useNavigate } from "react-router-dom";
import PatientLayout from "../layouts/PatientLayout";
import "../../shared/styles/Dashboard.css";
import Table from "../../shared/components/Table";
import StatsCard from "../../shared/components/StatsCard";
import { CalendarIcon, FileTextIcon, ActivityIcon, HeartIcon } from "../../shared/components/Icons";
import HealthOverviewChart from "../components/HealthOverviewChart";
import EmergencyButton from "../components/EmergencyButton";

const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" opacity="0.65" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.65" />
  </svg>
);

function PatientDashboard() {
  const navigate = useNavigate();

  return (
    <PatientLayout>
      <h2>Patient Dashboard</h2>
      <EmergencyButton />

      <div className="stats-grid">
        <StatsCard
          title="Upcoming Appointments"
          value="2"
          icon={<CalendarIcon />}
          color="blue"
        />
        <StatsCard
          title="Prescriptions"
          value="5 Active"
          icon={<FileTextIcon />}
          color="green"
        />
        <StatsCard
          title="Lab Reports"
          value="1 New"
          icon={<ActivityIcon />}
          color="purple"
        />
        <StatsCard
          title="Next Check-up"
          value="Feb 20"
          icon={<HeartIcon />}
          color="orange"
        />
      </div>

      <div className="dashboard-grid-layout">
        <HealthOverviewChart />

        {/* AI Memory Assistant Card */}
        <div className="memory-assistant-card">
          <div>
            <div className="ai-badge-top" title="AI Assistant Active">
              <SparklesIcon />
            </div>
            <h3 className="card-title">🧠 Memory Assistant</h3>
            <p className="card-desc">
              Ask questions about your health history, medications, appointments, reports, mood changes, and daily activities.
            </p>
            <ul className="card-features-list">
              <li><span className="feature-bullet">✓</span> Recall past conversations</li>
              <li><span className="feature-bullet">✓</span> Understand medical reports</li>
              <li><span className="feature-bullet">✓</span> Track memory changes</li>
              <li><span className="feature-bullet">✓</span> Get personalized health insights</li>
            </ul>
          </div>
          <button className="start-ai-btn" onClick={() => navigate("/patient/memory-assistant")}>
            Start AI Assistant
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="table-container-wrapper">
        <Table
          title="Recent Activity"
          columns={[
            { header: "Date", accessor: "date" },
            { header: "Activity", accessor: "activity" },
            { header: "Status", accessor: "status", render: (row) => <span className={`status-badge ${row.statusClass}`}>{row.status}</span> }
          ]}
          data={[
            { id: 1, date: "2024-02-14", activity: "Dr. Smith Appointment", status: "Completed", statusClass: "active" },
            { id: 2, date: "2024-02-10", activity: "Blood Test", status: "Results Ready", statusClass: "active" }
          ]}
        />
      </div>

    </PatientLayout>
  );
}

export default PatientDashboard;

