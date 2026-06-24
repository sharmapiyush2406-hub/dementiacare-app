import AdminLayout from "../layouts/AdminLayout";
import "../styles/AdminDashboard.css";
import AdminChart from "../components/AdminChart";
import PatientOutcomesChart from "../components/PatientOutcomesChart";
import StatsCard from "../../shared/components/StatsCard";
import { ActivityIcon, UsersIcon, FileTextIcon } from "../../shared/components/Icons";

function Analytics() {
    return (
        <AdminLayout>
            <h2>Analytics & Reports</h2>

            <div className="stats-grid">
                <StatsCard
                    title="Total Visits"
                    value="12,450"
                    icon={<ActivityIcon />}
                    color="blue"
                    trend="+12%"
                    trendValue="↑"
                />
                <StatsCard
                    title="New Signups"
                    value="850"
                    icon={<UsersIcon />}
                    color="green"
                    trend="+5%"
                    trendValue="↑"
                />
                <StatsCard
                    title="Active Sessions"
                    value="120"
                    icon={<FileTextIcon />}
                    color="purple"
                    trend="+2%"
                    trendValue="↑"
                />
            </div>

            <AdminChart />

            <PatientOutcomesChart />
        </AdminLayout>
    );
}

export default Analytics;
