import CaregiverLayout from "../layouts/CaregiverLayout";
import "../../shared/styles/Dashboard.css";
import { useEffect, useState } from "react";
import socket from "../../services/socket";

function Alerts() {
    const [sosAlert, setSosAlert] = useState(null);

    useEffect(() => {
        // Get the logged-in caregiver's userId
        let myUserId = null;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            myUserId = user._id || null;
        } catch (e) { }

        const handleSos = (data) => {
            // Only show alert if this SOS is meant for ME (this caregiver)
            // OR if no specific caregiver is set (fallback)
            if (!data.caregiverUserId || data.caregiverUserId === myUserId) {
                setSosAlert(data);
            }
        };

        socket.on('sos-alert', handleSos);

        return () => {
            socket.off('sos-alert', handleSos);
        };
    }, []);

    return (
        <CaregiverLayout>
            <h2>System Alerts</h2>

            {/* SOS Alert Section */}
            <div className="stat-card" style={{
                borderColor: sosAlert ? "#f44336" : "rgba(255,255,255,0.1)",
                border: `1px solid ${sosAlert ? "rgba(244,67,54,0.6)" : "rgba(255,255,255,0.1)"}`,
                marginBottom: "20px",
                background: sosAlert ? "rgba(244, 67, 54, 0.08)" : "rgba(255,255,255,0.02)"
            }}>
                <h3 style={{ color: sosAlert ? "#f44336" : "#aaa", display: "flex", alignItems: "center", gap: "10px" }}>
                    🚨 Patient SOS Alert
                </h3>
                {sosAlert ? (
                    <div style={{ marginTop: "15px", padding: "15px", background: "rgba(244,67,54,0.1)", borderRadius: "8px", borderLeft: "4px solid #f44336" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <strong>{sosAlert.patientName || `Patient`}</strong> has triggered an emergency SOS alert!
                                <div style={{ marginTop: "5px", fontSize: "0.9em", color: "#c5c5c5" }}>
                                    Time: {new Date(sosAlert.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            <button
                                className="action-btn"
                                style={{ background: "#f44336", color: "white", fontWeight: "bold" }}
                                onClick={() => setSosAlert(null)}
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: "10px", color: "#888", fontSize: "0.95em" }}>
                        No active SOS alerts. You will be notified here when a patient triggers an alert.
                    </div>
                )}
            </div>

            <div className="stat-card" style={{ borderColor: "red", border: "1px solid rgba(255,0,0,0.3)" }}>
                <h3 style={{ color: "#ff6b6b" }}>Critical Health Alerts</h3>
                <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255,0,0,0.1)", borderRadius: "5px" }}>
                    <strong>Jane Smith:</strong> High Blood Pressure detected (180/110) - Immediate Attention Required
                </div>
            </div>

            <div className="stat-card" style={{ marginTop: "20px" }}>
                <h3>Notifications</h3>
                <div style={{ marginTop: "10px", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    Appointment Reminder: John Doe at 2:00 PM tomorrow.
                </div>
                <div style={{ marginTop: "10px", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    New Report Available for Robert Brown.
                </div>
            </div>
        </CaregiverLayout>
    );
}

export default Alerts;
