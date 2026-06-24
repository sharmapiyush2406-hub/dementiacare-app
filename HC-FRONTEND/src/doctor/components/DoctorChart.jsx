import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";

const monthlyData = [
    { month: "Sep", consultations: 38, reports: 12 },
    { month: "Oct", consultations: 45, reports: 18 },
    { month: "Nov", consultations: 42, reports: 15 },
    { month: "Dec", consultations: 50, reports: 22 },
    { month: "Jan", consultations: 48, reports: 20 },
    { month: "Feb", consultations: 53, reports: 17 },
];

function DoctorChart() {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                border: "1px solid #e2e8f0",
                marginBottom: "28px",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1e293b", fontWeight: 700 }}>
                        Consultations & Reports — Last 6 Months
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                        Monthly overview of your patient activity
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} barGap={6} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 13 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            fontSize: "0.85rem",
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: "0.82rem", paddingTop: "12px" }} />
                    <Bar dataKey="consultations" name="Consultations" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reports" name="Reports Filed" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default DoctorChart;
