import { useEffect, useState } from "react";
import api from "../../services/api";
import Table from "../../shared/components/Table";

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const [patientsRes, caregiversRes] = await Promise.all([
          api.get("/admin/patients"),
          api.get("/admin/caregivers"),
        ]);

        const patients = patientsRes.data.map((p) => ({
          id: p.user._id,
          name: p.user.name || p.user.email,
          email: p.user.email,
          role: "Patient",
          status: p.assignedCaregiver ? "Assigned" : "Unassigned",
          joined: new Date(p.user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        }));

        const caregivers = caregiversRes.data.map((c) => ({
          id: c.user._id,
          name: c.user.name || c.user.email,
          email: c.user.email,
          role: "Caregiver",
          status: c.assignedPatients?.length > 0 ? "Active" : "Unassigned",
          joined: new Date(c.user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        }));

        const combined = [...patients, ...caregivers].sort(
          (a, b) => new Date(b.joined) - new Date(a.joined)
        );

        setUsers(combined);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(
          err.response?.data?.message || "Failed to load users from server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const columns = [
    { header: "Name / Email", accessor: "name" },
    {
      header: "Role",
      accessor: "role",
      render: (row) => {
        const colors = {
          Patient: { bg: "#eff6ff", color: "#3b82f6" },
          Caregiver: { bg: "#f5f3ff", color: "#8b5cf6" },
        };
        const s = colors[row.role] || { bg: "#f1f5f9", color: "#475569" };
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
            {row.role}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const isActive = row.status === "Active" || row.status === "Assigned";
        return (
          <span className={`status-badge ${isActive ? "active" : "inactive"}`}>
            {row.status}
          </span>
        );
      },
    },
    { header: "Joined", accessor: "joined" },
  ];

  if (loading) {
    return (
      <div
        className="table-container"
        style={{ textAlign: "center", padding: "40px 24px" }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
        <p style={{ color: "#64748b", marginTop: "14px", fontWeight: 500 }}>
          Loading users from server…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 24px",
          color: "#ef4444",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "16px",
          marginBottom: "30px",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>
          ⚠️ {error}
        </p>
        <p
          style={{ color: "#64748b", fontSize: "0.84rem", marginTop: "8px" }}
        >
          Make sure the backend is running and you are logged in as admin.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container-wrapper">
      <Table
        columns={columns}
        data={users}
        title={`Recent Users (${users.length} total)`}
        keyField="id"
      />
    </div>
  );
}

export default UsersTable;
