import { useEffect, useState, useRef } from "react";
import CaregiverLayout from "../layouts/CaregiverLayout";
import api from "../../services/api";
import socket from "../../services/socket";
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Inject custom marker styles into the document head
const styles = `
.custom-patient-marker {
  position: relative;
}
.patient-marker-ping {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  font-size: 20px;
  position: relative;
}
.patient-marker-ping.safe {
  border: 3px solid #22c55e;
}
.patient-marker-ping.breached {
  border: 3px solid #ef4444;
  animation: pulse-border 1.5s infinite;
}
.ping-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.6;
  pointer-events: none;
}
.patient-marker-ping.safe .ping-circle {
  border: 3px solid #22c55e;
}
.patient-marker-ping.breached .ping-circle {
  border: 3px solid #ef4444;
  animation: ping-anim 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping-anim {
  75%, 100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.7), 0 2px 5px rgba(0,0,0,0.3);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0), 0 2px 5px rgba(0,0,0,0.3);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement("style");
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
}

// Custom markers using Leaflet divIcon
const createPatientIcon = (status) => L.divIcon({
  html: `<div class="patient-marker-ping ${status === 'BREACHED' ? 'breached' : 'safe'}">
           <div class="ping-circle"></div>
           👵
         </div>`,
  className: "custom-patient-marker",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const homeIcon = L.divIcon({
  html: `<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 50%; width: 36px; height: 36px; border: 2px solid #3b82f6; box-shadow: 0 2px 5px rgba(0,0,0,0.3)">🏠</div>`,
  className: "custom-home-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

// Helper component to center map dynamically
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LiveLocationMap() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [geofenceAlert, setGeofenceAlert] = useState(null);
  const [radiusInput, setRadiusInput] = useState(1000);
  const [loading, setLoading] = useState(false);

  // Fetch assigned patients list on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/caregiver/my-patients");
        setPatients(res.data);
        if (res.data.length > 0) {
          setSelectedPatientId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };
    fetchPatients();
  }, []);

  // Fetch current location and geofence status for the selected patient
  const fetchPatientLocation = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/location/status/${id}`);
      setPatientData(res.data);
      if (res.data.safeZone) {
        setRadiusInput(res.data.safeZone.radius || 1000);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading location details:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientLocation(selectedPatientId);
  }, [selectedPatientId]);

  // Handle real-time updates via Socket.IO
  useEffect(() => {
    const handleLocationUpdate = (data) => {
      if (patientData && data.patientId === selectedPatientId) {
        setPatientData(prev => ({
          ...prev,
          location: data.location,
          geofenceStatus: data.geofenceStatus,
          distance: data.distance,
          safeZone: data.safeZone
        }));
      }
    };

    const handleGeofenceAlert = (data) => {
      if (data.patientId === selectedPatientId) {
        setGeofenceAlert(data);
      }
    };

    socket.on("patient-location-update", handleLocationUpdate);
    socket.on("geofence-alert", handleGeofenceAlert);

    return () => {
      socket.off("patient-location-update", handleLocationUpdate);
      socket.off("geofence-alert", handleGeofenceAlert);
    };
  }, [patientData, selectedPatientId]);

  // Update Safe Zone settings on backend
  const handleSaveSafeZone = async (e) => {
    e.preventDefault();
    if (!patientData || !patientData.location) return;

    // Use current location as center if not already set
    const centerLat = patientData.safeZone?.centerLatitude || patientData.location.latitude;
    const centerLon = patientData.safeZone?.centerLongitude || patientData.location.longitude;

    try {
      const res = await api.post("/location/safe-zone", {
        patientId: selectedPatientId,
        centerLatitude: centerLat,
        centerLongitude: centerLon,
        radius: Number(radiusInput),
        enabled: true
      });
      setPatientData(prev => ({
        ...prev,
        safeZone: res.data.safeZone,
        geofenceStatus: res.data.geofenceStatus
      }));
      alert("Safe zone parameters updated successfully!");
    } catch (err) {
      console.error("Failed to save safe zone config:", err);
      alert("Failed to update safe zone configuration.");
    }
  };

  // Reset/Center safe zone to current patient coordinates
  const handleSetCenterToPatient = async () => {
    if (!patientData || !patientData.location) {
      alert("Patient location unavailable to use as center.");
      return;
    }

    try {
      const res = await api.post("/location/safe-zone", {
        patientId: selectedPatientId,
        centerLatitude: patientData.location.latitude,
        centerLongitude: patientData.location.longitude,
        radius: Number(radiusInput),
        enabled: true
      });
      setPatientData(prev => ({
        ...prev,
        safeZone: res.data.safeZone,
        geofenceStatus: res.data.geofenceStatus
      }));
      alert("Safe zone center set to patient's current position!");
    } catch (err) {
      console.error("Failed to update safe zone center:", err);
    }
  };

  // Determine starting maps center
  const mapCenter = patientData?.location?.latitude 
    ? [patientData.location.latitude, patientData.location.longitude] 
    : [26.1445, 91.7362]; // Guwahati coordinates as generic North East center fallback

  const safeZoneCenter = patientData?.safeZone?.centerLatitude
    ? [patientData.safeZone.centerLatitude, patientData.safeZone.centerLongitude]
    : null;

  return (
    <CaregiverLayout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px" }}>
        <h2 style={{ color: "var(--text-color, #1e293b)", marginBottom: "20px" }}>🌐 Live Patient Tracking</h2>

        {geofenceAlert && (
          <div style={{
            background: geofenceAlert.status === "BREACHED" ? "#fef2f2" : "#f0fdf4",
            borderLeft: `5px solid ${geofenceAlert.status === "BREACHED" ? "#ef4444" : "#22c55e"}`,
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h4 style={{ margin: 0, color: geofenceAlert.status === "BREACHED" ? "#991b1b" : "#166534" }}>
                {geofenceAlert.status === "BREACHED" ? "⚠️ Geofence Breached!" : "🟢 Returned to Safe Zone"}
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#475569" }}>
                Patient <strong>{geofenceAlert.patientName}</strong> is {geofenceAlert.status === "BREACHED" ? "OUTSIDE" : "INSIDE"} the Safe Zone. 
                Current distance: {geofenceAlert.distance}m.
              </p>
            </div>
            <button 
              onClick={() => setGeofenceAlert(null)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                color: "#64748b"
              }}
            >
              Clear Dismiss
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
          
          {/* Header Controls */}
          <div style={{
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            flexWrap: "wrap",
            gap: "12px",
            padding: "16px",
            backgroundColor: "var(--card-bg, #ffffff)",
            borderRadius: "10px",
            border: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontWeight: "600", color: "#475569" }}>Select Patient:</label>
              <select 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none"
                }}
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            {patientData && patientData.phone && (
              <a 
                href={`tel:${patientData.phone}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  backgroundColor: "#22c55e",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "14px",
                  boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)"
                }}
              >
                📞 Call Patient (${patientData.phone})
              </a>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>
            
            {/* Live Map Display */}
            <div style={{
              height: "500px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--border-color, #e2e8f0)",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
              <MapContainer 
                center={mapCenter} 
                zoom={14} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {patientData?.location?.latitude && (
                  <>
                    <Marker 
                      position={[patientData.location.latitude, patientData.location.longitude]}
                      icon={createPatientIcon(patientData.geofenceStatus)}
                    >
                      <Popup>
                        <strong>{patientData.patientName}</strong><br />
                        Accuracy: {Math.round(patientData.location.accuracy || 0)}m<br />
                        Last Active: {patientData.location.timestamp ? new Date(patientData.location.timestamp).toLocaleTimeString() : "N/A"}
                      </Popup>
                    </Marker>
                    <MapRecenter center={[patientData.location.latitude, patientData.location.longitude]} />
                  </>
                )}

                {safeZoneCenter && patientData?.safeZone?.enabled && (
                  <>
                    <Marker position={safeZoneCenter} icon={homeIcon}>
                      <Popup>Safe Zone Hub (Center)</Popup>
                    </Marker>
                    <Circle 
                      center={safeZoneCenter} 
                      radius={patientData.safeZone.radius}
                      pathOptions={{
                        color: patientData.geofenceStatus === 'BREACHED' ? '#ef4444' : '#22c55e',
                        fillColor: patientData.geofenceStatus === 'BREACHED' ? '#ef4444' : '#22c55e',
                        fillOpacity: 0.15
                      }}
                    />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Config & Details Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Connection Status Card */}
              <div style={{
                padding: "20px",
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #e2e8f0)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#475569" }}>Tracking Telemetry</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", display: "block" }}>GEOFENCE STATUS</label>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginTop: "4px",
                      backgroundColor: patientData?.geofenceStatus === 'BREACHED' ? '#fee2e2' : patientData?.geofenceStatus === 'SAFE' ? '#dcfce7' : '#f1f5f9',
                      color: patientData?.geofenceStatus === 'BREACHED' ? '#ef4444' : patientData?.geofenceStatus === 'SAFE' ? '#22c55e' : '#64748b'
                    }}>
                      {patientData?.geofenceStatus === 'BREACHED' ? "🔴 Outside Safe Zone" : patientData?.geofenceStatus === 'SAFE' ? "🟢 Inside Safe Zone" : "⚪ Unknown"}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", display: "block" }}>DISTANCE FROM HOME</label>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>
                      {patientData?.distance !== undefined ? `${patientData.distance} meters` : "N/A"}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", display: "block" }}>LAST TELEMETRY UPDATE</label>
                    <span style={{ fontSize: "14px", color: "#334155" }}>
                      {patientData?.location?.timestamp ? new Date(patientData.location.timestamp).toLocaleTimeString() : "Never"}
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#64748b", display: "block" }}>GPS ACCURACY</label>
                    <span style={{ fontSize: "14px", color: "#334155" }}>
                      {patientData?.location?.accuracy ? `± ${Math.round(patientData.location.accuracy)} meters` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safe Zone Configuration Form */}
              <div style={{
                padding: "20px",
                backgroundColor: "var(--card-bg, #ffffff)",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #e2e8f0)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#475569" }}>Safe Zone Settings</h3>

                <form onSubmit={handleSaveSafeZone}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", color: "#475569", fontWeight: "500", display: "block", marginBottom: "6px" }}>
                      Radius (meters):
                    </label>
                    <select 
                      value={radiusInput} 
                      onChange={(e) => setRadiusInput(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px"
                      }}
                    >
                      <option value="500">500 meters</option>
                      <option value="1000">1 km</option>
                      <option value="2000">2 km</option>
                      <option value="5000">5 km</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginBottom: "10px"
                    }}
                  >
                    Save Radius Config
                  </button>

                  <button 
                    type="button"
                    onClick={handleSetCenterToPatient}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                      fontWeight: "500",
                      cursor: "pointer"
                    }}
                  >
                    🎯 Use Patient Location as Center
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>
      </div>
    </CaregiverLayout>
  );
}

export default LiveLocationMap;
