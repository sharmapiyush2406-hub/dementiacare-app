const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Haversine formula to calculate distance in meters between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// @desc    Update patient live location
// @route   POST /api/location/update
// @access  Private/Patient
router.post('/update', protect, authorize('patient'), async (req, res) => {
    const { latitude, longitude, accuracy, timestamp } = req.body;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Keep current coordinates
        patient.location = {
            latitude: Number(latitude),
            longitude: Number(longitude),
            accuracy: accuracy ? Number(accuracy) : null,
            timestamp: timestamp ? new Date(timestamp) : new Date()
        };

        let status = 'SAFE';
        let distance = 0;

        if (patient.safeZone && patient.safeZone.enabled && patient.safeZone.centerLatitude && patient.safeZone.centerLongitude) {
            distance = calculateDistance(
                patient.location.latitude,
                patient.location.longitude,
                patient.safeZone.centerLatitude,
                patient.safeZone.centerLongitude
            );

            if (distance > patient.safeZone.radius) {
                status = 'BREACHED';
            }
        }

        const oldStatus = patient.geofenceStatus || 'UNKNOWN';
        patient.geofenceStatus = status;
        await patient.save();

        // Emit real-time update using Socket.IO if caregiver is linked
        if (patient.assignedCaregiver) {
            const io = req.app.get('io');
            if (io) {
                const roomName = `caregiver-${patient.assignedCaregiver.toString()}`;
                
                // Emitting basic location-update for real-time map drawing
                io.to(roomName).emit('patient-location-update', {
                    patientId: patient._id.toString(),
                    location: patient.location,
                    geofenceStatus: status,
                    distance: Math.round(distance),
                    safeZone: patient.safeZone
                });

                // If geofence status transitioned, emit an alert event
                if (oldStatus !== status) {
                    io.to(roomName).emit('geofence-alert', {
                        patientId: patient._id.toString(),
                        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
                        status,
                        distance: Math.round(distance),
                        lastKnownLocation: patient.location,
                        timestamp: new Date()
                    });
                }
            }
        }

        res.json({
            message: 'Location updated successfully',
            status,
            distance: Math.round(distance)
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Configure safe zone settings
// @route   POST /api/location/safe-zone
// @access  Private/Caregiver
router.post('/safe-zone', protect, authorize('caregiver'), async (req, res) => {
    const { patientId, centerLatitude, centerLongitude, radius, enabled } = req.body;

    if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
    }

    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver profile not found' });
        }

        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'Patient is not assigned to you' });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient.safeZone = {
            centerLatitude: centerLatitude !== undefined ? Number(centerLatitude) : patient.safeZone?.centerLatitude,
            centerLongitude: centerLongitude !== undefined ? Number(centerLongitude) : patient.safeZone?.centerLongitude,
            radius: radius !== undefined ? Number(radius) : patient.safeZone?.radius,
            enabled: enabled !== undefined ? Boolean(enabled) : patient.safeZone?.enabled
        };

        // Recalculate status immediately if location exists
        if (patient.location && patient.location.latitude && patient.safeZone.centerLatitude) {
            const distance = calculateDistance(
                patient.location.latitude,
                patient.location.longitude,
                patient.safeZone.centerLatitude,
                patient.safeZone.centerLongitude
            );
            patient.geofenceStatus = (patient.safeZone.enabled && distance > patient.safeZone.radius) ? 'BREACHED' : 'SAFE';
        } else {
            patient.geofenceStatus = 'UNKNOWN';
        }

        await patient.save();

        res.json({
            message: 'Safe zone updated successfully',
            safeZone: patient.safeZone,
            geofenceStatus: patient.geofenceStatus
        });
    } catch (error) {
        console.error('Error configuring safe zone:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get patient location & geofencing details
// @route   GET /api/location/status/:patientId
// @access  Private/Caregiver
router.get('/status/:patientId', protect, authorize('caregiver'), async (req, res) => {
    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver profile not found' });
        }

        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === req.params.patientId.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'Patient is not assigned to you' });
        }

        const patient = await Patient.findById(req.params.patientId).populate('user', 'email');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        let distance = 0;
        if (patient.location?.latitude && patient.safeZone?.centerLatitude) {
            distance = calculateDistance(
                patient.location.latitude,
                patient.location.longitude,
                patient.safeZone.centerLatitude,
                patient.safeZone.centerLongitude
            );
        }

        res.json({
            patientId: patient._id,
            patientName: `${patient.firstName} ${patient.lastName}`.trim(),
            phone: patient.phone,
            location: patient.location,
            safeZone: patient.safeZone,
            geofenceStatus: patient.geofenceStatus,
            distance: Math.round(distance)
        });
    } catch (error) {
        console.error('Error retrieving location status:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
