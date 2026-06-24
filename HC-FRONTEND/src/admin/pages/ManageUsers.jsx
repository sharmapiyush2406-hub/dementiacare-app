import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/AdminDashboard.css";
import Table from "../../shared/components/Table";
import api from "../../services/api";

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [caregivers, setCaregivers] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientsRes, caregiversRes, doctorsRes] = await Promise.all([
                api.get('/admin/patients'),
                api.get('/admin/caregivers'),
                api.get('/admin/doctors'),
            ]);

            const patients = patientsRes.data || [];
            const caregiversRaw = caregiversRes.data || [];
            const doctorsRaw = doctorsRes.data || [];

            const patientsData = patients
                .filter(p => p.user)
                .map(p => ({
                    id: p._id,
                    userId: p.user?._id,
                    name: p.user?.email,
                    role: 'Patient',
                    status: 'Active',
                    assignedCaregiver: p.assignedCaregiver,
                    assignedDoctor: p.assignedDoctor,
                    type: 'patient'
                }));

            const caregiversData = caregiversRaw
                .filter(c => c.user)
                .map(c => ({
                    id: c._id,
                    userId: c.user?._id,
                    name: c.user?.email,
                    role: 'Caregiver',
                    status: 'Active',
                    assignedPatients: c.assignedPatients,
                    type: 'caregiver'
                }));

            const doctorsData = doctorsRaw
                .filter(d => d.user)
                .map(d => ({
                    id: d._id,
                    userId: d.user?._id,
                    name: d.user?.email,
                    role: 'Doctor',
                    status: 'Active',
                    assignedPatients: d.assignedPatients,
                    type: 'doctor'
                }));

            setUsers([...patientsData, ...caregiversData, ...doctorsData]);
            setCaregivers(caregiversData);
            setDoctors(doctorsData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignCaregiver = async (patientId, caregiverId) => {
        try {
            await api.put('/admin/assign-caregiver', { patientId, caregiverId });
            fetchData();
            alert("Caregiver assigned successfully");
        } catch (err) {
            console.error("Error assigning caregiver:", err);
            alert("Failed to assign caregiver");
        }
    };

    const handleAssignDoctor = async (patientId, doctorId) => {
        try {
            await api.put('/admin/assign-doctor', { patientId, doctorId });
            fetchData();
            alert("Doctor assigned successfully");
        } catch (err) {
            console.error("Error assigning doctor:", err);
            alert("Failed to assign doctor");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchData();
        } catch (err) {
            console.error("Error deleting user:", err);
            alert("Failed to delete user");
        }
    };

    const selectStyle = {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#1e293b",
        fontSize: "0.8rem",
        borderRadius: "8px",
        padding: "5px 8px",
        width: "100%",
        cursor: "pointer",
    };

    const columns = [
        {
            header: "ID",
            accessor: "userId",
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" }}>
                    {row.userId?.substring(0, 8)}…
                </span>
            ),
        },
        { header: "Email", accessor: "name" },
        {
            header: "Role",
            accessor: "role",
            render: (row) => {
                const colors = {
                    Patient: { bg: "#eff6ff", color: "#3b82f6" },
                    Caregiver: { bg: "#f5f3ff", color: "#8b5cf6" },
                    Doctor: { bg: "#ecfdf5", color: "#10b981" },
                };
                const s = colors[row.role] || { bg: "#f1f5f9", color: "#475569" };
                return (
                    <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: "999px", fontWeight: 600, fontSize: "0.75rem" }}>
                        {row.role}
                    </span>
                );
            },
        },
        {
            header: "Assign Caregiver",
            accessor: "assignedCaregiver",
            render: (row) => {
                if (row.role !== 'Patient') return <span style={{ color: "#94a3b8" }}>—</span>;
                return (
                    <select
                        value={row.assignedCaregiver?._id || row.assignedCaregiver || ""}
                        onChange={(e) => handleAssignCaregiver(row.userId, e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Select Caregiver</option>
                        {caregivers.map(cg => (
                            <option key={cg.userId} value={cg.userId}>{cg.name}</option>
                        ))}
                    </select>
                );
            },
        },
        {
            header: "Assign Doctor",
            accessor: "assignedDoctor",
            render: (row) => {
                if (row.role !== 'Patient') {
                    // For doctors, show their assigned patient count
                    if (row.role === 'Doctor') {
                        return (
                            <span style={{ fontWeight: 600, color: "#10b981" }}>
                                {row.assignedPatients?.length || 0} patient{row.assignedPatients?.length !== 1 ? 's' : ''}
                            </span>
                        );
                    }
                    return <span style={{ color: "#94a3b8" }}>—</span>;
                }
                return (
                    <select
                        value={row.assignedDoctor?._id || row.assignedDoctor || ""}
                        onChange={(e) => handleAssignDoctor(row.userId, e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Select Doctor</option>
                        {doctors.map(doc => (
                            <option key={doc.userId} value={doc.userId}>{doc.name}</option>
                        ))}
                    </select>
                );
            },
        },
        {
            header: "Assigned Patients",
            accessor: "assignedPatients",
            render: (row) => {
                if (row.role === 'Caregiver') {
                    return (
                        <span style={{ fontWeight: 600, color: "#8b5cf6" }}>
                            {row.assignedPatients?.length || 0} patient{row.assignedPatients?.length !== 1 ? 's' : ''}
                        </span>
                    );
                }
                return <span style={{ color: "#94a3b8" }}>—</span>;
            },
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`status-badge ${row.status.toLowerCase()}`}>
                    {row.status}
                </span>
            ),
        },
        {
            header: "Actions",
            accessor: "actions",
            render: (row) => (
                <button
                    className="action-btn delete"
                    onClick={() => handleDeleteUser(row.userId)}
                >
                    Delete
                </button>
            ),
        },
    ];

    if (loading) return <AdminLayout><div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading users…</div></AdminLayout>;
    if (error) return <AdminLayout><div style={{ padding: "20px", color: "#ef4444", background: "#fef2f2", borderRadius: "12px", margin: "20px" }}>{error}</div></AdminLayout>;

    const patientCount = users.filter(u => u.role === 'Patient').length;
    const doctorCount = users.filter(u => u.role === 'Doctor').length;
    const caregiverCount = users.filter(u => u.role === 'Caregiver').length;

    return (
        <AdminLayout>
            <h2>Manage Users</h2>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[
                    { label: "Patients", count: patientCount, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Doctors", count: doctorCount, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Caregivers", count: caregiverCount, color: "#8b5cf6", bg: "#f5f3ff" },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: "12px", padding: "12px 24px", minWidth: "120px" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{count}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>{label}</div>
                    </div>
                ))}
            </div>
            <Table
                columns={columns}
                data={users}
                title={`All Users (${users.length} total)`}
                keyField="id"
            />
        </AdminLayout>
    );
}

export default ManageUsers;
