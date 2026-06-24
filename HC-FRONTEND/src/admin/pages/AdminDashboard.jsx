import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import StatsCard from "../../shared/components/StatsCard";
import { UsersIcon, ActivityIcon, HeartIcon, FileTextIcon } from "../../shared/components/Icons";
import AdminChart from "../components/AdminChart";
import UsersTable from "../components/UsersTable";
import "../styles/AdminDashboard.css";
import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: "—",
    patients: "—",
    caregivers: "—",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, caregiversRes] = await Promise.all([
          api.get("/admin/patients"),
          api.get("/admin/caregivers"),
        ]);
        const patientCount = patientsRes.data.length;
        const caregiverCount = caregiversRes.data.length;
        setStats({
          totalUsers: patientCount + caregiverCount,
          patients: patientCount,
          caregivers: caregiverCount,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <h2>Admin Dashboard</h2>

      <div className="stats-grid">
        <StatsCard
          title="Total Users"
          value={String(stats.totalUsers)}
          icon={<UsersIcon />}
          color="blue"
          trend=""
          trendValue=""
        />
        <StatsCard
          title="Active Patients"
          value={String(stats.patients)}
          icon={<HeartIcon />}
          color="green"
          trend=""
          trendValue=""
        />
        <StatsCard
          title="Caregivers"
          value={String(stats.caregivers)}
          icon={<ActivityIcon />}
          color="purple"
          trend=""
          trendValue=""
        />
        <StatsCard
          title="Reports Generated"
          value="240"
          icon={<FileTextIcon />}
          color="orange"
          trend="+18%"
          trendValue="↑"
        />
      </div>

      <AdminChart />

      <UsersTable />
    </AdminLayout>
  );
}

export default AdminDashboard;
