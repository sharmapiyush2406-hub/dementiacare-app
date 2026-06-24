import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import "../styles/AdminDashboard.css";
import Table from "../../shared/components/Table";
import api from "../../services/api";

function Caregivers() {
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCaregivers();
    }, []);

    const fetchCaregivers = async () => {
        try {
            const response = await api.get('/admin/caregivers');
            const data = response.data.map(c => ({
                id: c._id,
                userId: c.user?._id,
                name: c.user?.email,
                status: 'Active', // Default status as backend doesn't have it yet
                assignedPatients: c.assignedPatients || []
            }));
            setCaregivers(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching caregivers:", err);
            setError("Failed to load caregivers");
            setLoading(false);
        }
    };

    const columns = [
        { header: "ID", accessor: "userId", render: (row) => row.userId?.substring(0, 8) + "..." },
        { header: "Email", accessor: "name" },
        {
            header: "Assigned Patients",
            accessor: "assignedPatients",
            render: (row) => row.assignedPatients.length
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
        // Removed "Assign Patient" action as that's done in Manage Users
    ];

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;
    if (error) return <AdminLayout><div className="text-red-500">{error}</div></AdminLayout>;

    return (
        <AdminLayout>
            <h2>Caregiver List</h2>
            <Table
                columns={columns}
                data={caregivers}
                title="All Caregivers"
                keyField="id"
            />
        </AdminLayout>
    );
}

export default Caregivers;
