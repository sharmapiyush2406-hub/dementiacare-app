import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import StatsCard from "../../shared/components/StatsCard";
import Table from "../../shared/components/Table";
import DoctorChart from "../components/DoctorChart";
import {
    UsersIcon,
    CalendarIcon,
    FileTextIcon,
    AlertIcon,
} from "../../shared/components/Icons";
import "../styles/DoctorDashboard.css";
import api from "../../services/api";

// ── helpers ──────────────────────────────────────────────────────────────────

// Format a date string (or null) into a readable label
function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // already a plain string like "2026-03-15"
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Returns true if a date string is today (local time)
function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
    );
}

// Returns true if a date string is in the future (after today)
function isUpcoming(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
}

// Derive a UI status tag from the nextAppointment date
function appointmentStatus(dateStr) {
    if (!dateStr) return { label: "Active", cls: "active" };
    const d = new Date(dateStr);
    const now = new Date();
    if (isNaN(d)) return { label: "Active", cls: "active" };
    if (d < now) return { label: "Follow-up Due", cls: "pending" };
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return { label: "Upcoming", cls: "active" };
    return { label: "Scheduled", cls: "active" };
}

// ── component ─────────────────────────────────────────────────────────────────

function DoctorDashboard() {
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [doctorName, setDoctorName] = useState("Doctor");
    const [loading, setLoading] = useState(true);
    const [noProfile, setNoProfile] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.firstName) setDoctorName(`Dr. ${parsed.firstName} ${parsed.lastName || ""}`.trim());
                else if (parsed.email) setDoctorName(parsed.email.split("@")[0]);
            } catch (_) { }
        }

        const fetchDashboardData = async () => {
            try {
                const [patientsRes, apptsRes] = await Promise.all([
                    api.get("/doctor/my-patients"),
                    api.get("/doctor/appointments")
                ]);
                setPatients(patientsRes.data || []);
                setAppointments(apptsRes.data || []);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                if (err.response?.status === 404) setNoProfile(true);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // ── Derived data ─────────────────────────────────────────────────────────

    // What to show in the dashboard table
    // Use real appointments for today and upcoming
    const todayTableRows = appointments
        .filter(a => isToday(a.date))
        .map((a, i) => {
            const patient = a.patient || {};
            const patientUser = patient.user || {};
            return {
                id: a._id || i,
                date: a.date,
                patientName: `${patient.firstName || patientUser.firstName || ""} ${patient.lastName || patientUser.lastName || ""}`.trim() || patientUser.email || "—",
                age: patient.age || "—",
                condition: patient.conditions || "—",
                type: a.type || "Routine Checkup",
                status: a.status,
                statusClass: a.status === 'Upcoming' ? 'active' : (a.status === 'Cancelled' ? 'cancelled' : 'completed'),
            };
        });

    const upcomingTableRows = appointments
        .filter(a => isUpcoming(a.date) && !isToday(a.date) && a.status === 'Upcoming')
        .slice(0, 5)
        .map((a, i) => {
            const patient = a.patient || {};
            const patientUser = patient.user || {};
            return {
                id: `up-${a._id || i}`,
                date: a.date,
                patientName: `${patient.firstName || patientUser.firstName || ""} ${patient.lastName || patientUser.lastName || ""}`.trim() || patientUser.email || "—",
                age: patient.age || "—",
                condition: patient.conditions || "—",
                type: a.type || "Routine Checkup",
                status: a.status,
                statusClass: 'active',
            };
        });
    // All patients without a specific appointment today (fallback)
    const allRows = patients.map((p, i) => ({
        id: p.id || i,
        date: p.nextAppointment ? formatDate(p.nextAppointment) : (p.lastVisit ? `Last: ${formatDate(p.lastVisit)}` : "—"),
        patientName: `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email || "—",
        age: p.age || "—",
        condition: p.conditions || "—",
        type: "Routine Checkup",
        status: p.status || "Active",
        statusClass: 'active',
    }));

    const tableRows = todayTableRows.length > 0 ? todayTableRows : allRows;
    const tableTitle = todayTableRows.length > 0
        ? `Today's Appointments (${todayTableRows.length})`
        : `All Assigned Patients (${patients.length}) — No appointments today`;

    const appointmentsTodayCount = loading ? "…" : todayTableRows.length;

    const columns = [
        {
            header: "Appt. Date",
            accessor: "date",
            render: (row) => (
                <span style={{ fontWeight: 500, color: "#1e293b", fontSize: "0.85rem" }}>{row.date}</span>
            ),
        },
        {
            header: "Patient",
            accessor: "patientName",
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{row.patientName}</div>
                    {row.age !== "—" && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{row.age} yrs</div>
                    )}
                </div>
            ),
        },
        { header: "Condition", accessor: "condition" },
        {
            header: "Type",
            accessor: "type",
            render: (row) => (
                <span style={{ background: "#eff6ff", color: "#3b82f6", padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {row.type}
                </span>
            ),
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`status-badge ${row.statusClass}`}>{row.status}</span>
            ),
        },
    ];

    return (
        <DoctorLayout>
            <div className="doctor-dashboard-header">
                <h2>Doctor Dashboard</h2>
                <p className="doctor-dashboard-subtitle">
                    Welcome back, {doctorName} — here's your overview for today.
                </p>
            </div>

            <div className="stats-grid">
                <StatsCard
                    title="Assigned Patients"
                    value={loading ? "…" : patients.length}
                    icon={<UsersIcon />}
                    color="blue"
                    trend={noProfile ? "⚠ Ask admin to assign patients" : patients.length === 0 ? "No patients assigned yet" : ""}
                    trendValue=""
                />
                <StatsCard
                    title="Appointments Today"
                    value={appointmentsTodayCount}
                    icon={<CalendarIcon />}
                    color="green"
                    trend={upcomingTableRows.length > 0 ? `+${upcomingTableRows.length} upcoming` : ""}
                    trendValue=""
                />
                <StatsCard
                    title="Follow-ups Due"
                    value={loading ? "…" : appointments.filter(a => a.date && new Date(a.date) < new Date() && a.status === 'Upcoming').length}
                    icon={<FileTextIcon />}
                    color="orange"
                    trend=""
                    trendValue=""
                />
                <StatsCard
                    title="Critical Alerts"
                    value={loading ? "…" : patients.filter(p => p.conditions && p.conditions.toLowerCase().includes("critical")).length}
                    icon={<AlertIcon />}
                    color="red"
                    trend=""
                    trendValue=""
                />
            </div>

            <DoctorChart />

            <div className="table-container-wrapper">
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading appointments…</div>
                ) : patients.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                        <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>No patients assigned yet</p>
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Ask your admin to assign patients to your profile.</p>
                    </div>
                ) : (
                    <Table
                        title={tableTitle}
                        columns={columns}
                        data={tableRows}
                        keyField="id"
                    />
                )}
            </div>

            {upcomingTableRows.length > 0 && (
                <div className="table-container-wrapper" style={{ marginTop: "20px" }}>
                    <Table
                        title={`Upcoming Appointments (next 7 days — ${upcomingTableRows.length})`}
                        columns={columns}
                        data={upcomingTableRows}
                        keyField="id"
                    />
                </div>
            )}
        </DoctorLayout>
    );
}

export default DoctorDashboard;
