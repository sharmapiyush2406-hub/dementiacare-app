import PatientLayout from "../layouts/PatientLayout";
import StatsCard from "../../shared/components/StatsCard";
import "../../shared/styles/Dashboard.css";
import Table from "../../shared/components/Table";

// Icons (Inline SVGs for simplicity and consistency if Icons file isn't fully exposed, 
// or I can try to import them if I know where they are. 
// Based on AdminDashboard, they are in "../../shared/components/Icons"
import { UsersIcon, HeartIcon, ActivityIcon, FileTextIcon } from "../../shared/components/Icons";

function CaregiverProfile() {
    // Mock Data for Schedule
    const schedule = [
        { id: 1, date: "Feb 16, 2026", time: "09:00 AM - 11:00 AM", type: "Routine Check-up", status: "Confirmed" },
        { id: 2, date: "Feb 18, 2026", time: "02:00 PM - 03:00 PM", type: "Therapy Session", status: "Upcoming" },
        { id: 3, date: "Feb 20, 2026", time: "10:00 AM - 12:00 PM", type: "Medication Review", status: "Pending" },
    ];

    // Functions to handle quick actions
    const handleCall = () => window.location.href = 'tel:1234567890';
    const handleMessage = () => alert('Opening messaging interface...');

    return (
        <PatientLayout>
            <div className="daily-reminders-container">
                <h2 className="mb-6 text-2xl font-bold text-slate-800">My Caregiver</h2>

                {/* Top Section - Standard Stats Cards Grid */}
                {/* Top Section - Standard Stats Cards Grid */}
                <div className="stats-grid mb-8">
                    {/* Card 1: Identity */}
                    <StatsCard
                        title="Caregiver"
                        value="Sarah Wilson"
                        icon={<span style={{ fontSize: '1.5rem' }}>👩‍⚕️</span>}
                        color="blue"
                        trend="Active Now"
                        trendValue="●"
                    />

                    {/* Card 2: Professional Stats */}
                    <StatsCard
                        title="Professional Rating"
                        value="4.9 / 5.0"
                        icon={<span style={{ fontSize: '1.5rem' }}>⭐</span>}
                        color="purple"
                        trend="8 Years Exp."
                        trendValue="💼"
                    />

                    {/* Card 3: Specializations */}
                    <StatsCard
                        title="Focus Area"
                        value="Dementia Care"
                        icon={<span style={{ fontSize: '1.5rem' }}>🧠</span>}
                        color="orange"
                        trend="+ Meds Mgmt"
                        trendValue="💊"
                    />
                </div>

                {/* Quick Contact Table */}
                <div className="table-container mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Quick Contact Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Contact Method</th>
                                <th>Detail</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="font-medium text-slate-700 max-w-[50px]"><span className="text-xl">📞</span> Phone</td>
                                <td className="text-slate-600 font-medium">+1 (555) 123-4567</td>
                                <td>
                                    <button
                                        className="action-btn edit"
                                        style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onClick={handleCall}
                                    >
                                        Call
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td className="font-medium text-slate-700"><span className="text-xl">💬</span> Email</td>
                                <td className="text-slate-600 font-medium">sarah.wilson@care.com</td>
                                <td>
                                    <button
                                        className="action-btn edit"
                                        style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onClick={handleMessage}
                                    >
                                        Message
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Schedule Table */}
                <div className="table-container-wrapper">
                    <Table
                        title="Upcoming Visits"
                        data={schedule}
                        columns={[
                            { header: "Date", accessor: "date", render: (row) => <span className="font-medium text-slate-700">{row.date}</span> },
                            { header: "Time", accessor: "time" },
                            { header: "Visit Type", accessor: "type" },
                            {
                                header: "Status",
                                accessor: "status",
                                render: (row) => (
                                    <span className={`status-badge ${row.status.toLowerCase() === 'confirmed' ? 'active' : 'pending'}`}>
                                        {row.status}
                                    </span>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        </PatientLayout>
    );
}

export default CaregiverProfile;
