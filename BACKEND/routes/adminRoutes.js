const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const User = require('../models/User');

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
router.get('/profile', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Admin not found' });

        res.json({
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: 'System Administrator',
                department: user.department,
                location: user.location,
                bio: user.bio,
                employeeId: user.employeeId,
                joinDate: user.createdAt
                    ? new Date(user.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                    : '',
            },
            notifications: user.notifications,
            preferences: user.preferences,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
router.put('/profile', protect, authorize('admin'), async (req, res) => {
    try {
        const { profile, notifications, preferences } = req.body;

        const updateFields = {};

        if (profile) {
            if (profile.firstName !== undefined) updateFields.firstName = profile.firstName;
            if (profile.lastName !== undefined) updateFields.lastName = profile.lastName;
            if (profile.phone !== undefined) updateFields.phone = profile.phone;
            if (profile.department !== undefined) updateFields.department = profile.department;
            if (profile.location !== undefined) updateFields.location = profile.location;
            if (profile.bio !== undefined) updateFields.bio = profile.bio;
        }

        if (notifications) {
            updateFields.notifications = notifications;
        }

        if (preferences) {
            updateFields.preferences = preferences;
        }

        await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true });

        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private/Admin
router.get('/patients', protect, authorize('admin'), async (req, res) => {
    try {
        const patients = await Patient.find()
            .populate('user', '-password')
            .populate({
                path: 'assignedCaregiver',
                select: '-password',
            })
            .populate({
                path: 'assignedDoctor',
                select: '-password',
            });


        // Filter out patients with null user (orphaned records)
        const validPatients = patients.filter(patient => patient.user);
        res.json(validPatients);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all caregivers
// @route   GET /api/admin/caregivers
// @access  Private/Admin
router.get('/caregivers', protect, authorize('admin'), async (req, res) => {
    try {
        const caregivers = await Caregiver.find()
            .populate('user', '-password')
            .populate({
                path: 'assignedPatients',
                populate: {
                    path: 'user',
                    select: '-password',
                },
            });
        // Filter out caregivers with null user (orphaned records)
        const validCaregivers = caregivers.filter(caregiver => caregiver.user);
        res.json(validCaregivers);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign caregiver to patient
// @route   PUT /api/admin/assign-caregiver
// @access  Private/Admin
router.put('/assign-caregiver', protect, authorize('admin'), async (req, res) => {
    const { patientId, caregiverId } = req.body;

    try {
        // Find Patient: Check if ID is Patient Doc ID OR User ID
        let patient = await Patient.findById(patientId);
        if (!patient) {
            patient = await Patient.findOne({ user: patientId });
        }

        // Find Caregiver: Check if ID is Caregiver Doc ID OR User ID
        let caregiver = await Caregiver.findById(caregiverId);
        if (!caregiver) {
            caregiver = await Caregiver.findOne({ user: caregiverId });
        }

        if (!patient || !caregiver) {
            return res.status(404).json({ message: 'Patient or Caregiver not found' });
        }

        // Remove patient from old caregiver's list if assigned
        if (patient.assignedCaregiver) {
            const oldCaregiver = await Caregiver.findOne({ user: patient.assignedCaregiver });
            if (oldCaregiver) {
                oldCaregiver.assignedPatients = oldCaregiver.assignedPatients.filter(
                    (pid) => pid.toString() !== patient._id.toString()
                );
                await oldCaregiver.save();
            }
        }

        // Update Patient: assignedCaregiver is a reference to User
        patient.assignedCaregiver = caregiver.user;
        await patient.save();

        // Update Caregiver: assignedPatients is an array of references to Patient
        const hasPatient = caregiver.assignedPatients.some(pid => pid.toString() === patient._id.toString());
        if (!hasPatient) {
            caregiver.assignedPatients.push(patient._id);
            await caregiver.save();
        }

        res.json({ message: 'Caregiver assigned successfully', patient, caregiver });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Cleanup based on role
        if (user.role === 'patient') {
            const patient = await Patient.findOne({ user: user._id });
            if (patient) {
                // Remove from caregiver's assigned list
                if (patient.assignedCaregiver) {
                    const caregiver = await Caregiver.findOne({ user: patient.assignedCaregiver });
                    if (caregiver) {
                        caregiver.assignedPatients = caregiver.assignedPatients.filter(
                            (pid) => pid.toString() !== patient._id.toString()
                        );
                        await caregiver.save();
                    }
                }
                await Patient.deleteOne({ _id: patient._id });
            }
        } else if (user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: user._id });
            if (caregiver) {
                // Update all assigned patients to set caregiver to null
                await Patient.updateMany(
                    { assignedCaregiver: user._id },
                    { $unset: { assignedCaregiver: "" } }
                );
                await Caregiver.deleteOne({ _id: caregiver._id });
            }
        }

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
router.get('/doctors', protect, authorize('admin'), async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .populate('user', '-password')
            .populate({
                path: 'assignedPatients',
                populate: { path: 'user', select: '-password' },
            });
        const validDoctors = doctors.filter(d => d.user);
        res.json(validDoctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign doctor to patient
// @route   PUT /api/admin/assign-doctor
// @access  Private/Admin
router.put('/assign-doctor', protect, authorize('admin'), async (req, res) => {
    const { patientId, doctorId } = req.body;

    try {
        let patient = await Patient.findById(patientId);
        if (!patient) patient = await Patient.findOne({ user: patientId });

        let doctor = await Doctor.findById(doctorId);
        if (!doctor) doctor = await Doctor.findOne({ user: doctorId });

        if (!patient || !doctor) {
            return res.status(404).json({ message: 'Patient or Doctor not found' });
        }

        // Remove patient from old doctor's list if any
        if (patient.assignedDoctor) {
            const oldDoctor = await Doctor.findOne({ user: patient.assignedDoctor });
            if (oldDoctor) {
                oldDoctor.assignedPatients = oldDoctor.assignedPatients.filter(
                    pid => pid.toString() !== patient._id.toString()
                );
                await oldDoctor.save();
            }
        }

        // Update patient
        patient.assignedDoctor = doctor.user;
        await patient.save();

        // Update doctor
        const hasPatient = doctor.assignedPatients.some(pid => pid.toString() === patient._id.toString());
        if (!hasPatient) {
            doctor.assignedPatients.push(patient._id);
            await doctor.save();
        }

        res.json({ message: 'Doctor assigned successfully', patient, doctor });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Report = require('../models/Report');

// @desc    Get all medical reports
// @route   GET /api/admin/reports
// @access  Private/Admin
router.get('/reports', protect, authorize('admin'), async (req, res) => {
    try {
        const reports = await Report.find().sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete any medical report
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
router.delete('/reports/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // Delete file from disk if it exists
        if (report.filePath) {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(__dirname, '..', report.filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

