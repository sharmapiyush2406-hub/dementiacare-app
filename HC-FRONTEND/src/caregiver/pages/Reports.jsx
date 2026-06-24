import { useEffect, useState } from "react";
import CaregiverLayout from "../layouts/CaregiverLayout";
import Table from "../../shared/components/Table";
import "../../shared/styles/Dashboard.css";
import api from "../../services/api";

const typeColors = {
    Assessment: { bg: "#eff6ff", color: "#3b82f6" },
    Medication: { bg: "#f5f3ff", color: "#8b5cf6" },
    Progress: { bg: "#ecfdf5", color: "#10b981" },
    Incident: { bg: "#fee2e2", color: "#ef4444" },
    Diagnostic: { bg: "#fef3c7", color: "#d97706" },
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Reports() {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [error, setError] = useState("");

    const backendRoot = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';

    useEffect(() => {
        setLoading(true);
        api.get("/caregiver/my-patients")
            .then((res) => {
                setPatients(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedPatientId(res.data[0]._id);
                }
            })
            .catch(() => setError("Failed to load assigned patients."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedPatientId) return;

        setLoadingReports(true);
        api.get(`/caregiver/reports/${selectedPatientId}`)
            .then((res) => setReports(res.data || []))
            .catch(() => setError("Failed to load reports for this patient."))
            .finally(() => setLoadingReports(false));
    }, [selectedPatientId]);

    const handleViewReport = (report) => {
        if (!report.filePath) {
            alert("No file path attached to this report record.");
            return;
        }
        const fullUrl = `${backendRoot}${report.filePath}`;
        window.open(fullUrl, "_blank");
    };

    const columns = [
        {
            header: "Report Name",
            accessor: "title",
            render: (row) => (
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.title}</span>
            ),
        },
        {
            header: "Date",
            accessor: "date",
            render: (row) => <span>{formatDate(row.date)}</span>,
        },
        {
            header: "Report Type",
            accessor: "type",
            render: (row) => {
                const s = typeColors[row.type] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {row.type}
                    </span>
                );
            },
        },
        {
            header: "Action",
            accessor: "actions",
            render: (row) => (
                <button
                    className="action-btn edit"
                    onClick={() => handleViewReport(row)}
                    style={{ padding: "6px 14px", fontWeight: 600, fontSize: "0.8rem" }}
                >
                    View Report PDF
                </button>
            ),
        },
    ];

    return (
        <CaregiverLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ margin: 0 }}>Patient Medical Reports</h2>
                
                {!loading && patients.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>Select Patient:</span>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", fontWeight: 500 }}
                        >
                            {patients.map(p => (
                                <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading assigned patients…
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div style={{ padding: "12px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", marginBottom: "20px" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Reports List */}
            {!loading && !error && selectedPatientId && (
                <div className="table-container-wrapper">
                    {loadingReports ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                            Loading medical reports…
                        </div>
                    ) : reports.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                            <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No medical reports uploaded</p>
                            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                                The primary doctor has not uploaded any diagnostic reports for this patient yet.
                            </p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={reports}
                            title={`Medical Files History (${reports.length})`}
                            keyField="_id"
                        />
                    )}
                </div>
            )}

            {!loading && patients.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
                    <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No assigned patients</p>
                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                        You must be assigned to patients by the administrator to view their medical files.
                    </p>
                </div>
            )}
        </CaregiverLayout>
    );
}

export default Reports;
