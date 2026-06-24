import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from "recharts";

const data = [
    { day: "Mon", interactions: 12, logs: 5 },
    { day: "Tue", interactions: 19, logs: 8 },
    { day: "Wed", interactions: 15, logs: 6 },
    { day: "Thu", interactions: 22, logs: 10 },
    { day: "Fri", interactions: 30, logs: 15 },
    { day: "Sat", interactions: 25, logs: 12 },
    { day: "Sun", interactions: 18, logs: 7 },
];

function WeeklyActivityChart() {
    return (
        <div className="chart-container">
            <h3>Weekly Activity Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
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
                            width: "140px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            textAlign: "center"
                        }}
                        itemStyle={{ padding: 0, margin: 0 }}
                    />
                    <Legend wrapperStyle={{ color: "#334155", bottom: 0 }} />
                    <Area type="monotone" dataKey="interactions" name="Interactions" stroke="#4e0eff" fillOpacity={1} fill="url(#colorInteractions)" />
                    <Area type="monotone" dataKey="logs" name="Logs Filed" stroke="#ff2a68" fillOpacity={1} fill="url(#colorLogs)" />
                    <defs>
                        <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4e0eff" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4e0eff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff2a68" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ff2a68" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default WeeklyActivityChart;
