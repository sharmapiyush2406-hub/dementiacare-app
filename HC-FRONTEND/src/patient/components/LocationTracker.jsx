import { useEffect, useState } from "react";
import api from "../../services/api";

function LocationTracker() {
  const [status, setStatus] = useState("Initializing location sharing...");
  const [statusColor, setStatusColor] = useState("gray");
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("Location tracking not supported by this browser.");
      setStatusColor("red");
      return;
    }

    const handleSuccess = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = new Date(position.timestamp).toISOString();
      setCoordinates({ latitude, longitude, accuracy });

      try {
        await api.post("/location/update", {
          latitude,
          longitude,
          accuracy,
          timestamp
        });
        setStatus("Location sharing active");
        setStatusColor("green");
      } catch (err) {
        console.error("Failed to upload location coordinates:", err);
        setStatus("Network error, trying to reconnect...");
        setStatusColor("orange");
      }
    };

    const handleError = (error) => {
      console.error("GPS tracking error:", error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setStatus("Location permission denied. Please allow GPS access.");
          setStatusColor("red");
          break;
        case error.POSITION_UNAVAILABLE:
          setStatus("GPS position unavailable.");
          setStatusColor("red");
          break;
        case error.TIMEOUT:
          setStatus("GPS tracking timed out.");
          setStatusColor("orange");
          break;
        default:
          setStatus("Location tracking encountered an error.");
          setStatusColor("red");
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div 
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        backgroundColor: "var(--card-bg, #ffffff)",
        border: `1px solid var(--border-color, #e2e8f0)`,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px"
      }}
    >
      <div 
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: 
            statusColor === "green" ? "#22c55e" :
            statusColor === "orange" ? "#f97316" :
            statusColor === "red" ? "#ef4444" : "#94a3b8",
          boxShadow: `0 0 8px ${
            statusColor === "green" ? "#22c55e" :
            statusColor === "orange" ? "#f97316" :
            statusColor === "red" ? "#ef4444" : "#94a3b8"
          }`
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-color, #1e293b)" }}>
          {status}
        </p>
        {coordinates && statusColor === "green" && (
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-light, #64748b)" }}>
            Lat: {coordinates.latitude.toFixed(6)}, Lon: {coordinates.longitude.toFixed(6)} (Acc: {Math.round(coordinates.accuracy)}m)
          </p>
        )}
      </div>
    </div>
  );
}

export default LocationTracker;
