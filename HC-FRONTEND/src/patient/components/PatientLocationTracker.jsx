import { useEffect } from 'react';
import socket from '../../services/socket';
import { getDistance } from 'geolib';

// Fixed Safe Zone for demonstration if true physical bounds aren't loaded 
// In a real application, you'd fetch the home coordinates of the patient.
// We will initialize the safe zone dynamically to the very first highly-accurate physical location they get.
let dynamicSafeZone = null;

const PatientLocationTracker = () => {
    useEffect(() => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }

        // We update the safe zone coordinates to match the first position 
        // to establish a physical geofence center based on accurate GPS.
        let isFirstPos = true;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                
                // Establish safe zone on first accurate reading
                if (isFirstPos) {
                    dynamicSafeZone = {
                        latitude,
                        longitude,
                        radiusInMeters: 1000 // 1 km safe zone around initial physical location
                    };
                    isFirstPos = false;
                }

                // Send location update to backend
                socket.emit('patient-location-update', {
                    patientId: 'patient-test',
                    location: { latitude, longitude, accuracy },
                    timestamp: new Date().toISOString()
                });

                // Check geofence against the dynamic center
                if (dynamicSafeZone) {
                    const distance = getDistance(
                        { latitude, longitude },
                        { latitude: dynamicSafeZone.latitude, longitude: dynamicSafeZone.longitude }
                    );

                    if (distance > dynamicSafeZone.radiusInMeters) {
                        socket.emit('geofence-alert', {
                            patientId: 'patient-test',
                            distanceFromSafeZone: distance,
                            location: { latitude, longitude, accuracy },
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            },
            (error) => {
                console.error('Error watching position', error);
            },
            {
                enableHighAccuracy: true, // Forces physical GPS accuracy instead of cell tower/IP mock bounds
                timeout: 10000,
                maximumAge: 0 // Do not use cached positions
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return null; // This component does not render any UI
};

export default PatientLocationTracker;
