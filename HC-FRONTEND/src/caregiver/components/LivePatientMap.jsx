import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import socket from '../../services/socket';
import L from 'leaflet';

// Fix for Leaflet marker icon issue in React/Vite
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// We will wait for the first real location update to set the Safe Zone Center
let initialSafeZone = null;

const LivePatientMap = () => {
    const [patientLocation, setPatientLocation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    // Null by default. Once first physical ping comes through, we set it.
    const [dynamicSafeZone, setDynamicSafeZone] = useState(null);

    useEffect(() => {
        let isFirstUpdate = true;

        const handleLocationUpdate = (data) => {
            if (data.location) {
                const newLoc = [data.location.latitude, data.location.longitude];
                setPatientLocation(newLoc);
                setLastUpdated(new Date(data.timestamp).toLocaleTimeString());

                // For demo: set safe zone to initial position
                if (isFirstUpdate) {
                    setDynamicSafeZone({
                        latitude: data.location.latitude,
                        longitude: data.location.longitude,
                        radiusInMeters: 1000
                    });
                    isFirstUpdate = false;
                }
            }
        };

        socket.on('patient-location-update', handleLocationUpdate);

        return () => {
            socket.off('patient-location-update', handleLocationUpdate);
        };
    }, []);

    // Default location for presentation purposes until real signal arrives
    const DEMO_CENTER = [28.704060, 77.102493];
    const safeZoneCenter = dynamicSafeZone ? [dynamicSafeZone.latitude, dynamicSafeZone.longitude] : DEMO_CENTER;
    const safeZoneRadius = dynamicSafeZone ? dynamicSafeZone.radiusInMeters : 1000;
    const mapCenter = patientLocation || DEMO_CENTER;

    return (
        <div className="live-patient-map" style={{ width: '100%', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Live Patient Tracking</h3>
                {lastUpdated && <span style={{ fontSize: '0.9rem', color: '#666' }}>Last updated: {lastUpdated}</span>}
            </div>
            
            <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                <MapContainer 
                    center={mapCenter} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Safe Zone Circle */}
                    <Circle 
                        center={safeZoneCenter} 
                        radius={safeZoneRadius} 
                        pathOptions={{ color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.2 }} 
                    />

                    {/* Patient Marker */}
                    {patientLocation && (
                        <Marker position={patientLocation} icon={customIcon}>
                            <Popup>
                                Patient's Current Location
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default LivePatientMap;
