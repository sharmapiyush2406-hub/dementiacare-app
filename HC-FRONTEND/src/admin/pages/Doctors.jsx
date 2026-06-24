import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/AdminDashboard.css";
import Table from "../../shared/components/Table";
import api from "../../services/api";

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/admin/doctors');
            const data = response.data.map(d => ({
                id: d._id,
                userId: d.user?._id,
                name: d.user?.email,
                specialization: d.specialization || 'General',
                status: 'Active',
                assignedPatients: d.assignedPatients || []
            }));
            setDoctors(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching doctors:", err);
            setError("Failed to load doctors");
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "ID",
            accessor: "userId",
            render: (row) => (
                <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#64748b" }}>
                    {row.userId?.substring(0, 8)}…
                </span>
            )
        },
        { header: "Email", accessor: "name" },
        { header: "Specialization", accessor: "specialization" },
        {
            header: "Assigned Patients",
            accessor: "assignedPatients",
            render: (row) => (
                <span style={{ fontWeight: 600, color: "#10b981" }}>
                    {row.assignedPatients.length} patient{row.assignedPatients.length !== 1 ? 's' : ''}
                </span>
            )
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`status-badge ${row.status.toLowerCase().replace(" ", "-")}`}>
                    {row.status}
                </span>
            )
        },
    ];

    if (loading) return <AdminLayout><div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading doctors…</div></AdminLayout>;
    if (error) return <AdminLayout><div style={{ padding: "20px", color: "#ef4444", background: "#fef2f2", borderRadius: "12px", margin: "20px" }}>{error}</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Doctor List</h2>
            </div>
            <Table
                columns={columns}
                data={doctors}
                title={`All Doctors (${doctors.length} total)`}
                keyField="id"
            />
        </AdminLayout>
    );
}

export default Doctors;
