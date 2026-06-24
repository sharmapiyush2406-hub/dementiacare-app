import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import "../styles/DoctorDashboard.css";
import { UsersIcon, UserIcon, StethoscopeIcon, MedicalCrossIcon } from "../../shared/components/Icons";
import api from "../../services/api";

const ROLE_FILTERS = ["All", "Doctor", "Nurse", "Psychologist", "Psychiatric Social Worker"];

const ROLE_COLORS = {
    Doctor: "doctor",
    Nurse: "nurse",
    Psychologist: "psychologist",
    "Psychiatric Social Worker": "social-worker",
};

const ROLE_ICONS = {
    Doctor: <StethoscopeIcon />,
    Nurse: <MedicalCrossIcon />,
    Psychologist: <UserIcon />,
    "Psychiatric Social Worker": <UsersIcon />,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DoctorStaff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        api.get("/doctor/staff")
            .then((res) => setStaff(res.data || []))
            .catch((err) => {
                console.error("Failed to load staff:", err);
                setError("Failed to load staff. Make sure the backend is running and you are logged in.");
            })
            .finally(() => setLoading(false));
    }, []);

    // Derived counts from live data
    const counts = {
        Doctor: staff.filter((s) => s.role === "Doctor").length,
        Nurse: staff.filter((s) => s.role === "Nurse").length,
        Psychologist: staff.filter((s) => s.role === "Psychologist").length,
        "Psychiatric Social Worker": staff.filter((s) => s.role === "Psychiatric Social Worker").length,
    };

    const filtered = staff.filter((s) => {
        const matchRole = activeFilter === "All" || s.role === activeFilter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.designation.toLowerCase().includes(q) ||
            s.department.toLowerCase().includes(q) ||
            s.license.toLowerCase().includes(q);
        return matchRole && matchSearch;
    });

    return (
        <DoctorLayout>
            {/* Header */}
            <div className="doctor-dashboard-header">
                <h2>🏥 Hospital Staff</h2>
                <p className="doctor-dashboard-subtitle">
                    All psychiatric hospital staff — doctors, nurses, psychologists &amp; social workers.
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="staff-empty">
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
                    <p style={{ fontWeight: 600, color: "#1e293b" }}>Loading staff…</p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div style={{
                    padding: "16px 20px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    color: "#dc2626",
                    marginBottom: "20px",
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Main Content — only shown after successful load */}
            {!loading && !error && (
                <>
                    {/* Stats */}
                    <div className="staff-stats-row">
                        <div className="staff-stat-pill blue">
                            <span className="staff-stat-icon"><StethoscopeIcon /></span>
                            <span className="staff-stat-num">{counts.Doctor}</span>
                            <span className="staff-stat-lbl">Doctors</span>
                        </div>
                        <div className="staff-stat-pill green">
                            <span className="staff-stat-icon"><MedicalCrossIcon /></span>
                            <span className="staff-stat-num">{counts.Nurse}</span>
                            <span className="staff-stat-lbl">Nurses</span>
                        </div>
                        <div className="staff-stat-pill purple">
                            <span className="staff-stat-icon"><UserIcon /></span>
                            <span className="staff-stat-num">{counts.Psychologist}</span>
                            <span className="staff-stat-lbl">Psychologists</span>
                        </div>
                        <div className="staff-stat-pill orange">
                            <span className="staff-stat-icon"><UsersIcon /></span>
                            <span className="staff-stat-num">{counts["Psychiatric Social Worker"]}</span>
                            <span className="staff-stat-lbl">Social Workers</span>
                        </div>
                        <div className="staff-stat-pill grey">
                            <span className="staff-stat-num">{staff.length}</span>
                            <span className="staff-stat-lbl">Total Staff</span>
                        </div>
                    </div>

                    {/* Filter Tabs + Search */}
                    <div className="staff-controls">
                        <div className="staff-filter-tabs">
                            {ROLE_FILTERS.map((r) => (
                                <button
                                    key={r}
                                    className={`staff-tab-btn ${activeFilter === r ? "active" : ""}`}
                                    onClick={() => setActiveFilter(r)}
                                >
                                    {r === "Psychiatric Social Worker" ? "Social Workers" : r}
                                    <span className="staff-tab-count">
                                        {r === "All" ? staff.length : counts[r] ?? 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <input
                            className="staff-search-input"
                            type="text"
                            placeholder="🔍  Search by name, department, license…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Staff Cards */}
                    {filtered.length === 0 ? (
                        <div className="staff-empty">
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
                            <p style={{ fontWeight: 600, color: "#1e293b" }}>No staff found</p>
                            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Try adjusting your search or filter.</p>
                        </div>
                    ) : (
                        <div className="staff-grid">
                            {filtered.map((member) => (
                                <div key={member._id} className="staff-card">
                                    <div className="staff-card-top">
                                        <div className="staff-avatar">{member.avatar}</div>
                                        <div className="staff-card-info">
                                            <h4 className="staff-name">{member.name}</h4>
                                            <p className="staff-designation">{member.designation}</p>
                                            <div className="staff-badges-row">
                                                <span className={`staff-role-badge ${ROLE_COLORS[member.role]}`}>
                                                    {ROLE_ICONS[member.role]}
                                                    {member.role === "Psychiatric Social Worker" ? "PSW" : member.role}
                                                </span>
                                                <span className={`staff-status-badge ${member.status === "Active" ? "active" : "on-leave"}`}>
                                                    {member.status === "Active" ? "● Active" : "◐ On Leave"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="staff-card-divider" />
                                    <div className="staff-card-details">
                                        <div className="staff-detail-row">
                                            <span className="staff-detail-label">🏢 Department</span>
                                            <span className="staff-detail-value">{member.department}</span>
                                        </div>
                                        <div className="staff-detail-row">
                                            <span className="staff-detail-label">🪪 License</span>
                                            <span className="staff-detail-value license">{member.license}</span>
                                        </div>
                                        <div className="staff-detail-row">
                                            <span className="staff-detail-label">📞 Phone</span>
                                            <span className="staff-detail-value">{member.phone}</span>
                                        </div>
                                        <div className="staff-detail-row">
                                            <span className="staff-detail-label">📧 Email</span>
                                            <span className="staff-detail-value">{member.email}</span>
                                        </div>
                                        <div className="staff-detail-row">
                                            <span className="staff-detail-label">🕐 Experience</span>
                                            <span className="staff-detail-value">{member.experience}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </DoctorLayout>
    );
}
