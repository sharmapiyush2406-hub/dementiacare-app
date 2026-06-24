import { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import Table from "../../shared/components/Table";
import "../styles/DoctorDashboard.css";
import api from "../../services/api";
import PrescriptionModal from "../components/PrescriptionModal";

const conditionColors = {
    "Stage 2 Alzheimer's": { bg: "#fef3c7", color: "#d97706" },
    "Moderate Dementia": { bg: "#fee2e2", color: "#ef4444" },
    "Stage 1 Alzheimer's": { bg: "#eff6ff", color: "#3b82f6" },
    "Early Dementia": { bg: "#f5f3ff", color: "#8b5cf6" },
    MCI: { bg: "#ecfdf5", color: "#10b981" },
};

const statusColors = {
    Stable: { bg: "#ecfdf5", color: "#10b981" },
    Monitoring: { bg: "#eff6ff", color: "#3b82f6" },
    Critical: { bg: "#fee2e2", color: "#ef4444" },
};

function DoctorPatients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPatients = () => {
        setLoading(true);
        api.get("/doctor/my-patients")
            .then((res) => setPatients(res.data || []))
            .catch(() => setError("Failed to load patients. Please try again."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handlePrescribe = (patient, prescription = null) => {
        setSelectedPatient(patient);
        setSelectedPrescription(prescription);
        setIsModalOpen(true);
    };

    // Map backend patient data to table-friendly shape
    const rows = patients.map((p) => {
        const firstName = p.firstName || "";
        const lastName = p.lastName || "";
        // Backend returns a flat object — email is directly p.email (not p.user?.email)
        const fullName = `${firstName} ${lastName}`.trim() || p.email || "Unknown";
        const email = p.email || "—";

        // Status comes directly from the backend shape
        const statusLabel = p.status || "Active";

        return {
            id: p.id || p._id,
            name: fullName,
            email,
            age: p.age || "—",
            condition: p.conditions || "—",
            caregiver: "—",
            lastVisit: p.lastVisit || "—",
            nextVisit: p.nextAppointment || "—",
            status: statusLabel,
            hasPrescription: p.hasPrescription || false,
            prescription: p.prescription || null,
        };
    });

    const columns = [
        {
            header: "Patient Name",
            accessor: "name",
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{row.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{row.email}</div>
                </div>
            ),
        },
        {
            header: "Age",
            accessor: "age",
            render: (row) => <span>{row.age !== "—" ? `${row.age} yrs` : "—"}</span>,
        },
        {
            header: "Condition",
            accessor: "condition",
            render: (row) => {
                const s = conditionColors[row.condition] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span
                        style={{
                            background: s.bg,
                            color: s.color,
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {row.condition}
                    </span>
                );
            },
        },
        {
            header: "Assigned Caregiver",
            accessor: "caregiver",
            render: (row) => (
                <span style={{ color: row.caregiver === "Not Assigned" ? "#ef4444" : "#1e293b" }}>
                    {row.caregiver}
                </span>
            ),
        },
        { header: "Last Visit", accessor: "lastVisit" },
        { header: "Next Visit", accessor: "nextVisit" },
        {
            header: "Status",
            accessor: "status",
            render: (row) => {
                const s = statusColors[row.status] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span
                        style={{
                            background: s.bg,
                            color: s.color,
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                        }}
                    >
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
                        onClick={() => handlePrescribe(row)}
                        disabled={row.hasPrescription}
                        style={{
                            background: row.hasPrescription ? "#f0fdf4" : "#eff6ff",
                            color: row.hasPrescription ? "#16a34a" : "#3b82f6",
                            border: `1px solid ${row.hasPrescription ? "#bbf7d0" : "#bfdbfe"}`,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: row.hasPrescription ? "default" : "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                        onMouseOver={(e) => {
                            if (!row.hasPrescription) {
                                e.currentTarget.style.background = "#3b82f6";
                                e.currentTarget.style.color = "#fff";
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!row.hasPrescription) {
                                e.currentTarget.style.background = "#eff6ff";
                                e.currentTarget.style.color = "#3b82f6";
                            }
                        }}
                    >
                        {row.hasPrescription ? (
                            <>
                                <span style={{ fontSize: "0.9rem" }}>✓</span> Prescribed
                            </>
                        ) : (
                            "Prescribe"
                        )}
                    </button>

                    {row.hasPrescription && (
                        <button
                            onClick={() => handlePrescribe(row, row.prescription)}
                            style={{
                                background: "#fff",
                                color: "#64748b",
                                border: "1px solid #e2e8f0",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = "#f8fafc";
                                e.currentTarget.style.color = "#1e293b";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = "#fff";
                                e.currentTarget.style.color = "#64748b";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <DoctorLayout>
            <h2>My Patients</h2>
            <div style={{ marginBottom: "20px", color: "#64748b", fontSize: "0.9rem" }}>
                {loading
                    ? "Loading patients…"
                    : error
                        ? error
                        : `Showing all patients assigned to you — ${rows.length} total`}
            </div>
            <div className="table-container-wrapper">
                <Table
                    columns={columns}
                    data={rows}
                    title={`Assigned Patients (${rows.length})`}
                    keyField="id"
                />
            </div>

            {isModalOpen && (
                <PrescriptionModal
                    patient={selectedPatient}
                    initialData={selectedPrescription}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedPrescription(null);
                    }}
                    onSuccess={() => {
                        fetchPatients();
                        console.log("Prescription updated successfully!");
                    }}
                />
            )}
        </DoctorLayout>
    );
}

export default DoctorPatients;
