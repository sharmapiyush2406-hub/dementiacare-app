import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jan", users: 40 },
  { month: "Feb", users: 60 },
  { month: "Mar", users: 75 },
  { month: "Apr", users: 90 },
  { month: "May", users: 120 },
];

function AdminChart() {
  return (
    <div className="chart-container">
      <h3>User Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "8px",
              padding: "8px",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: "12px",
              width: "120px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              textAlign: "center"
            }}
            itemStyle={{ padding: 0, margin: 0, color: "#334155" }}
            labelStyle={{ color: "#1e293b", fontWeight: "bold", marginBottom: "5px" }}
          />
          <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AdminChart;
