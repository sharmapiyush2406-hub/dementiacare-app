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
    { day: "Mon", steps: 4000, water: 2.5, sleep: 7 },
    { day: "Tue", steps: 3000, water: 2.0, sleep: 6.5 },
    { day: "Wed", steps: 2000, water: 2.2, sleep: 8 },
    { day: "Thu", steps: 2780, water: 2.4, sleep: 7.5 },
    { day: "Fri", steps: 1890, water: 1.8, sleep: 6 },
    { day: "Sat", steps: 2390, water: 2.0, sleep: 8.5 },
    { day: "Sun", steps: 3490, water: 2.5, sleep: 8 },
];

function HealthOverviewChart() {
    return (
        <div className="chart-container">
            <h3>Health Overview (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" />
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
                    <Bar dataKey="steps" name="Steps" fill="#4e0eff" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="sleep" name="Sleep (hrs)" fill="#ff2a68" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default HealthOverviewChart;
