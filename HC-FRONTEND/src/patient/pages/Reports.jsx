import { useEffect, useState } from "react";
import PatientLayout from "../layouts/PatientLayout";
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
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const backendRoot = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';

    useEffect(() => {
        api.get("/patient/reports")
            .then((res) => setReports(res.data || []))
            .catch(() => setError("Failed to load reports. Make sure the backend is running."))
            .finally(() => setLoading(false));
    }, []);

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
                >
                    View Report PDF
                </button>
            ),
        },
    ];

    return (
        <PatientLayout>
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>📋 My Medical Reports</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                    Access and view diagnostic reports and clinical files uploaded by your doctor.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading reports…
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div style={{ padding: "12px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", marginBottom: "20px" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <div className="table-container-wrapper">
                    {reports.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                            <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No reports uploaded yet</p>
                            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                                Medical reports uploaded by your treating doctor will appear here.
                            </p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={reports}
                            title="All Medical Reports"
                            keyField="_id"
                        />
                    )}
                </div>
            )}
        </PatientLayout>
    );
}

export default Reports;
