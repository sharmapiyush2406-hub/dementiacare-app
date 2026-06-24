import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const data = [
    { name: "High Adherence", value: 400, color: "#00c851" },
    { name: "Medium Adherence", value: 300, color: "#ffae00" },
    { name: "Low Adherence", value: 300, color: "#ff2a68" },
    { name: "Not Started", value: 200, color: "#a6a6a6" },
];

const cx = 150;
const cy = 200;
const iR = 50;
const oR = 100;

function AdherenceChart() {
    return (
        <div className="chart-container">
            <h3>Patient Adherence Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        data={data}
                        cx="50%"
                        cy="70%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            padding: "8px",
                            border: "none",
                            color: "#000",
                            fontSize: "12px",
                            width: "140px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            textAlign: "center"
                        }}
                        itemStyle={{ padding: 0, margin: 0 }}
                    />
                    <Legend wrapperStyle={{ color: "#334155", bottom: 20 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default AdherenceChart;
