import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import Table from "../../shared/components/Table";
import "../styles/DoctorDashboard.css";
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

const statusColors = {
    Completed: { bg: "#ecfdf5", color: "#10b981" },
    Pending: { bg: "#fef3c7", color: "#d97706" },
    "In Review": { bg: "#eff6ff", color: "#3b82f6" },
};

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DoctorReports() {
    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Form states
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [reportTitle, setReportTitle] = useState("");
    const [reportType, setReportType] = useState("Diagnostic");
    const [reportPriority, setReportPriority] = useState("Medium");
    const [pdfFile, setPdfFile] = useState(null);

    const backendRoot = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';

    const fetchReports = async () => {
        try {
            const res = await api.get("/doctor/reports");
            setReports(res.data || []);
        } catch (err) {
            setError("Failed to load reports. Make sure the backend is running.");
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await api.get("/doctor/my-patients");
            setPatients(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedPatientId(res.data[0].id);
            }
        } catch (err) {
            console.error("Failed to load patients for report dropdown:", err);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchReports(), fetchPatients()])
            .finally(() => setLoading(false));
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                setError("Only PDF files are allowed.");
                setPdfFile(null);
                return;
            }
            setPdfFile(file);
            setError("");
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatientId) {
            setError("Please select a patient.");
            return;
        }
        if (!pdfFile) {
            setError("Please select a PDF report file.");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        const formData = new FormData();
        formData.append("patientId", selectedPatientId);
        formData.append("title", reportTitle.trim());
        formData.append("type", reportType);
        formData.append("priority", reportPriority);
        formData.append("pdf", pdfFile);

        try {
            await api.post("/doctor/reports/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setSuccess("Medical report uploaded, text findings parsed, and RAG indexed successfully!");
            setReportTitle("");
            setPdfFile(null);
            setShowUploadForm(false);
            // Refresh reports
            await fetchReports();
        } catch (err) {
            console.error("Report upload failure:", err);
            setError(err.response?.data?.message || "Failed to upload report. Please check size and try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to permanently delete this medical report? This will also clear its vectors from RAG memory.")) {
            return;
        }

        try {
            await api.delete(`/doctor/reports/${reportId}`);
            setSuccess("Report deleted successfully.");
            await fetchReports();
        } catch (err) {
            setError("Failed to delete report. Please try again.");
        }
    };

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
            header: "Status",
            accessor: "status",
            render: (row) => {
                const s = statusColors[row.status] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: "999px", fontWeight: 600, fontSize: "0.75rem" }}>
                        {row.status}
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
        <DoctorLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Medical Reports</h2>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    style={{
                        background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px",
                        padding: "10px 20px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer"
                    }}
                >
                    {showUploadForm ? "Close Upload Form" : "Upload PDF Report 📋"}
                </button>
            </div>

            {/* Upload Form card */}
            {showUploadForm && (
                <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>Upload New Diagnostic PDF</h3>
                    <form onSubmit={handleUploadSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Select Patient *</label>
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff" }}
                                    required
                                >
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Report Title (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Brain MRI Scans"
                                    value={reportTitle}
                                    onChange={(e) => setReportTitle(e.target.value)}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Report Type *</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff" }}
                                >
                                    <option value="Diagnostic">Diagnostic</option>
                                    <option value="Assessment">Assessment</option>
                                    <option value="Medication">Medication</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Incident">Incident</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Priority Level *</label>
                                <select
                                    value={reportPriority}
                                    onChange={(e) => setReportPriority(e.target.value)}
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#fff" }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>

                        {/* File Picker / Drag and Drop Area */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "0.85rem", color: "#475569" }}>Select PDF Report *</label>
                            <div style={{ border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "20px", textAlign: "center", background: "#f8fafc", cursor: "pointer", position: "relative" }}>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                    required
                                />
                                <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>📁</div>
                                <p style={{ margin: 0, fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>
                                    {pdfFile ? `Selected: ${pdfFile.name}` : "Click or drag to upload medical report PDF"}
                                </p>
                                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.75rem" }}>PDF documents only. Maximum size 10MB.</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => { setShowUploadForm(false); setPdfFile(null); }}
                                style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: 600 }}
                            >
                                {uploading ? "Extracting & Indexing... ⏳" : "Submit & RAG Index 🚀"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
            {!loading && (
                <>
                    <div style={{ marginBottom: "20px", color: "#64748b", fontSize: "0.9rem" }}>
                        {reports.filter((r) => r.status === "Pending").length} reports pending ·{" "}
                        {reports.filter((r) => r.status === "Completed").length} completed
                    </div>
                    <div className="table-container-wrapper">
                        {reports.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                                <p style={{ fontWeight: 600, color: "#1e293b", margin: 0 }}>No reports yet</p>
                                <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>
                                    Upload a diagnostic PDF report to begin semantic retrieval.
                                </p>
                            </div>
                        ) : (
                            <Table
                                columns={columns}
                                data={reports}
                                title={`All Reports (${reports.length})`}
                                keyField="_id"
                            />
                        )}
                    </div>
                </>
            )}
        </DoctorLayout>
    );
}

export default DoctorReports;
