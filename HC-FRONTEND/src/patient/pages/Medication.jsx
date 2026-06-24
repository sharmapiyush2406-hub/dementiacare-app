import { useState, useEffect } from "react";
import PatientLayout from "../layouts/PatientLayout";
import "../../shared/styles/Dashboard.css";
import api from "../../services/api";
import { PillIcon, ClipboardIcon, CalendarIcon } from "../../shared/components/Icons";

function Medication() {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchMeds() {
            try {
                setLoading(true);
                const { data } = await api.get("/patient/prescriptions");
                setMedications(data || []);
            } catch (err) {
                console.error("Failed to load medications", err);
                setError("Failed to load medications. Please try again later.");
            } finally {
                setLoading(false);
            }
        }
        fetchMeds();
    }, []);

    return (
        <PatientLayout>
            <div className="medication-header" style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "1.8rem", color: "#1e293b", margin: 0 }}>My Medication</h2>
                <p style={{ color: "#64748b", margin: "4px 0 0" }}>View your current prescriptions assigned by your doctor.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>Loading medications...</div>
            ) : error ? (
                <div style={{ color: "#dc2626", padding: "20px", background: "#fee2e2", borderRadius: "12px" }}>{error}</div>
            ) : medications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #e2e8f0" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>💊</div>
                    <p style={{ fontWeight: 600, color: "#1e293b" }}>No active medications</p>
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Your doctor hasn't assigned any prescriptions yet.</p>
                </div>
            ) : (
                <div className="stats-grid">
                    {medications.map(med => (
                        <div className="stat-card" key={med._id} style={{ position: "relative", overflow: "hidden" }}>
                            <div style={{ display: "flex", gap: "16px" }}>
                                <div style={{ background: "#eff6ff", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                                    <PillIcon />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{med.medicineName}</h3>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <ClipboardIcon /> {med.dosage}
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <CalendarIcon /> {med.frequency}
                                        </div>
                                    </div>

                                    {med.instructions && (
                                        <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", fontSize: "0.85rem", color: "#475569", marginBottom: "10px" }}>
                                            <strong>Note:</strong> {med.instructions}
                                        </div>
                                    )}

                                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                        Start: {new Date(med.startDate).toLocaleDateString()}
                                        {med.endDate && ` • End: ${new Date(med.endDate).toLocaleDateString()}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PatientLayout>
    );
}

export default Medication;
