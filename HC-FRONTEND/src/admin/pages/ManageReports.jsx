import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
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

const priorityColors = {
    High: { bg: "#fee2e2", color: "#ef4444" },
    Medium: { bg: "#fef3c7", color: "#d97706" },
    Low: { bg: "#ecfdf5", color: "#10b981" },
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ManageReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const backendRoot = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';

    const fetchReports = async () => {
        try {
            const res = await api.get("/admin/reports");
            setReports(res.data || []);
        } catch (err) {
            setError("Failed to load reports. Make sure the backend is running.");
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchReports().finally(() => setLoading(false));
    }, []);

    const handleViewReport = (report) => {
        if (!report.filePath) {
            alert("No file path attached to this report record.");
            return;
        }
        const fullUrl = `${backendRoot}${report.filePath}`;
        window.open(fullUrl, "_blank");
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to permanently delete this report? As an Administrator, this action is final and will also delete its vectors from Pinecone RAG memory.")) {
            return;
        }

        try {
            await api.delete(`/admin/reports/${reportId}`);
            setSuccess("Report deleted successfully.");
            await fetchReports();
        } catch (err) {
            setError("Failed to delete report. Please try again.");
        }
    };

    const columns = [
        {
            header: "Report Title",
            accessor: "title",
            render: (row) => (
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.title}</span>
            ),
        },
        {
            header: "Patient",
            accessor: "patientName",
            render: (row) => <span>{row.patientName || "—"}</span>,
        },
        {
            header: "Date",
            accessor: "date",
            render: (row) => <span>{formatDate(row.date)}</span>,
        },
        {
            header: "Type",
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
            header: "Priority",
            accessor: "priority",
            render: (row) => {
                const s = priorityColors[row.priority] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {row.priority}
                    </span>
                );
            },
        },
        {
            header: "Actions",
            accessor: "actions",
            render: (row) => (
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        style={{
                            background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe",
                            borderRadius: "6px", padding: "4px 12px", fontWeight: 600,
                            fontSize: "0.8rem", cursor: "pointer",
                        }}
                        onClick={() => handleViewReport(row)}
                    >
                        View PDF
                    </button>
                    <button
                        style={{
                            background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca",
                            borderRadius: "6px", padding: "4px 12px", fontWeight: 600,
                            fontSize: "0.8rem", cursor: "pointer",
                        }}
                        onClick={() => handleDeleteReport(row._id)}
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>📋 Master Reports Management</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
                    View and manage all patient medical diagnostic reports uploaded to the system.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading reports…
                </div>
            )}

            {/* Success and Error messages */}
            {success && (
                <div style={{ padding: "12px 20px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", color: "#059669", marginBottom: "20px", fontWeight: 500 }}>
                    ✅ {success}
                </div>
            )}
            {error && (
                <div style={{ padding: "12px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", marginBottom: "20px", fontWeight: 500 }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <div className="table-container-wrapper">
                    {reports.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                            <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No reports in the system</p>
                            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                                Reports uploaded by doctors will be listed here.
                            </p>
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            data={reports}
                            title={`System Wide Reports (${reports.length})`}
                            keyField="_id"
                        />
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

export default ManageReports;
