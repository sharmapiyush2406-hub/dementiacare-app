import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import Table from "../../shared/components/Table";
import "../styles/DoctorDashboard.css";
import api from "../../services/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

function appointmentStatus(dateStr) {
    if (!dateStr) return { label: "Active", cls: "active" };
    const d = new Date(dateStr);
    if (isNaN(d)) return { label: "Active", cls: "active" };
    const now = new Date();
    if (d < now && !isToday(dateStr)) return { label: "Follow-up Due", cls: "pending" };
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return { label: "Upcoming", cls: "active" };
    return { label: "Scheduled", cls: "active" };
}

function toRow(appt, i) {
    const patient = appt.patient || {};
    const patientUser = patient.user || {};
    return {
        id: appt._id || i,
        date: appt.date,
        time: appt.time,
        patientName: `${patient.firstName || patientUser.firstName || ""} ${patient.lastName || patientUser.lastName || ""}`.trim() || patientUser.email || "—",
        age: patient.age || "—",
        condition: patient.conditions || "—",
        type: appt.type || "Routine Checkup",
        status: appt.status,
        statusClass: appt.status === 'Upcoming' ? 'active' : (appt.status === 'Cancelled' ? 'cancelled' : 'completed'),
    };
}

// ── component ─────────────────────────────────────────────────────────────────

function DoctorSchedule() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get("/doctor/appointments")
            .then((res) => setAppointments(res.data || []))
            .catch((err) => {
                console.error("Schedule fetch error:", err);
                setError("Failed to load schedule. Make sure the backend is running and you are logged in.");
            })
            .finally(() => setLoading(false));
    }, []);

    // Split appointments by their date
    const todayAppointments = appointments.filter((a) => isToday(a.date)).map(toRow);
    const upcomingAppointments = appointments
        .filter((a) => {
            if (!a.date) return false;
            const d = new Date(a.date);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return d > now && !isToday(a.date) && a.status === 'Upcoming';
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(toRow);
    const pastAppointments = appointments
        .filter((a) => {
            if (!a.date) return false;
            const d = new Date(a.date);
            return !isNaN(d) && d < new Date() && !isToday(a.date) && a.status === 'Upcoming';
        })
        .map(toRow);

    const columns = [
        {
            header: "Appt. Date",
            accessor: "date",
            render: (row) => (
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{row.date}</span>
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
        { header: "Condition", accessor: "condition", render: (row) => <span style={{ color: "#475569", fontSize: "0.85rem" }}>{row.condition}</span> },
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
            header: "Time",
            accessor: "time",
            render: (row) => <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{row.time}</span>
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`status-badge ${row.statusClass}`} style={{ textTransform: 'capitalize' }}>
                    {row.status}
                </span>
            ),
        },
    ];

    if (loading) {
        return (
            <DoctorLayout>
                <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading schedule…</div>
            </DoctorLayout>
        );
    }

    if (error) {
        return (
            <DoctorLayout>
                <h2>My Schedule</h2>
                <div style={{ padding: "20px 24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", color: "#ef4444", margin: "20px 0" }}>
                    ⚠️ {error}
                </div>
            </DoctorLayout>
        );
    }

    return (
        <DoctorLayout>
            <h2>My Schedule</h2>

            {/* Summary badges */}
            <div className="doctor-schedule-summary">
                <div className="doctor-schedule-badge today">
                    📅 Today: {todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""}
                </div>
                <div className="doctor-schedule-badge upcoming">
                    🗓 Upcoming: {upcomingAppointments.length} appointment{upcomingAppointments.length !== 1 ? "s" : ""}
                </div>
                {pastAppointments.length > 0 && (
                    <div className="doctor-schedule-badge" style={{ background: "#fef3c7", color: "#b45309" }}>
                        ⏰ Follow-ups due: {pastAppointments.length}
                    </div>
                )}
            </div>

            {/* Today */}
            <div className="table-container-wrapper" style={{ marginBottom: "28px" }}>
                {todayAppointments.length > 0 ? (
                    <Table
                        columns={columns}
                        data={todayAppointments}
                        title={`Today's Appointments (${todayAppointments.length})`}
                        keyField="id"
                    />
                ) : (
                    <div style={{ textAlign: "center", padding: "36px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                        <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>📋</div>
                        <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No appointments scheduled for today</p>
                        <p style={{ color: "#64748b", fontSize: "0.84rem", marginTop: "4px" }}>
                            Patients can book appointments from their panel.
                        </p>
                    </div>
                )}
            </div>

            {/* Upcoming */}
            {upcomingAppointments.length > 0 && (
                <div className="table-container-wrapper" style={{ marginBottom: "28px" }}>
                    <Table
                        columns={columns}
                        data={upcomingAppointments}
                        title={`Upcoming Appointments (${upcomingAppointments.length})`}
                        keyField="id"
                    />
                </div>
            )}

            {/* Follow-ups due */}
            {pastAppointments.length > 0 && (
                <div className="table-container-wrapper" style={{ marginBottom: "28px" }}>
                    <Table
                        columns={columns}
                        data={pastAppointments}
                        title={`Follow-ups Due (${pastAppointments.length})`}
                        keyField="id"
                    />
                </div>
            )}
        </DoctorLayout>
    );
}

export default DoctorSchedule;
