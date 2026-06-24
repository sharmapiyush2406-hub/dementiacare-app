import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from "recharts";

const data = [
    { outcome: "Recovered", count: 65, color: "#4e0eff" },
    { outcome: "Stable", count: 45, color: "#ff2a68" },
    { outcome: "Critical", count: 12, color: "#ffae00" },
    { outcome: "Discharged", count: 80, color: "#00c851" },
];

function PatientOutcomesChart() {
    return (
        <div className="chart-container">
            <h3>Patient Outcomes</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="outcome" stroke="#64748b" />
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
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    />
                    <Legend wrapperStyle={{ color: "#334155" }} />
                    <Bar dataKey="count" fill="#8884d8" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default PatientOutcomesChart;
