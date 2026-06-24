const express = require('express');
const router = express.Router();
const Caregiver = require('../models/Caregiver');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get assigned patients
// @route   GET /api/caregiver/my-patients
// @access  Private/Caregiver
router.get('/my-patients', protect, authorize('caregiver'), async (req, res) => {
    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id })
            .populate({
                path: 'assignedPatients',
                populate: {
                    path: 'user',
                    select: '-password',
                },
            });

        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver profile not found' });
        }

        res.json(caregiver.assignedPatients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Task = require('../models/Task');
const Prescription = require('../models/Prescription');

// @desc    Assign daily task to patient
// @route   POST /api/caregiver/task
// @access  Private/Caregiver
router.post('/task', protect, authorize('caregiver'), async (req, res) => {
    const { patientId, description, date } = req.body;

    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'Patient not assigned to you' });
        }

        const task = await Task.create({
            title: description || 'New Task',
            description: description || '',
            patient: patientId,
            caregiver: caregiver._id,
            dueDate: date || Date.now(),
            category: 'Other',
            priority: 'Medium',
            status: 'Pending',
            createdBy: req.user.id
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign prescription to patient
// @route   POST /api/caregiver/prescription
// @access  Private/Caregiver
router.post('/prescription', protect, authorize('caregiver'), async (req, res) => {
    const { patientId, medicineName, dosage, frequency, startDate, endDate } = req.body;

    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'Patient not assigned to you' });
        }

        const prescription = await Prescription.create({
            medicineName,
            dosage,
            frequency,
            patient: patientId,
            caregiver: caregiver._id,
            startDate: startDate || Date.now(),
            endDate
        });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const CaregiverNote = require('../models/CaregiverNote');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// @desc    Add caregiver note for patient
// @route   POST /api/caregiver/notes
// @access  Private/Caregiver
router.post('/notes', protect, authorize('caregiver'), async (req, res) => {
    const { patientId, note } = req.body;

    if (!patientId || !note || !note.trim()) {
        return res.status(400).json({ message: 'Patient ID and note content are required' });
    }

    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver profile not found' });
        }

        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'Patient not assigned to you' });
        }

        const caregiverNote = await CaregiverNote.create({
            patient: patientId,
            caregiver: req.user.id,
            note: note.trim(),
            date: new Date()
        });

        res.status(201).json(caregiverNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get caregiver notes for a patient
// @route   GET /api/caregiver/notes/:patientId
// @access  Private/Caregiver, Doctor, Admin, Patient
router.get('/notes/:patientId', protect, authorize('caregiver', 'doctor', 'admin', 'patient'), async (req, res) => {
    const { patientId } = req.params;

    try {
        // Authorisation checks
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient || patient._id.toString() !== patientId) {
                return res.status(403).json({ message: 'Access denied: You can only view your own notes.' });
            }
        } else if (req.user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            if (!caregiver || !caregiver.assignedPatients.some(id => id.toString() === patientId)) {
                return res.status(403).json({ message: 'Access denied: Patient is not assigned to you.' });
            }
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ user: req.user.id });
            if (!doctor || !doctor.assignedPatients.some(id => id.toString() === patientId)) {
                return res.status(403).json({ message: 'Access denied: Patient is not assigned to you.' });
            }
        }

        const notes = await CaregiverNote.find({ patient: patientId })
            .sort({ date: -1 })
            .populate('caregiver', 'firstName lastName email');

        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a caregiver note
// @route   PUT /api/caregiver/notes/:id
// @access  Private/Caregiver
router.put('/notes/:id', protect, authorize('caregiver'), async (req, res) => {
    const { note } = req.body;

    if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Note content is required' });
    }

    try {
        const caregiverNote = await CaregiverNote.findById(req.params.id);
        if (!caregiverNote) {
            return res.status(404).json({ message: 'Caregiver note not found' });
        }

        // Verify ownership (only the creator can edit)
        if (caregiverNote.caregiver.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized: You can only edit your own notes' });
        }

        caregiverNote.note = note.trim();
        await caregiverNote.save();

        res.json(caregiverNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a caregiver note
// @route   DELETE /api/caregiver/notes/:id
// @access  Private/Caregiver, Admin
router.delete('/notes/:id', protect, authorize('caregiver', 'admin'), async (req, res) => {
    try {
        const caregiverNote = await CaregiverNote.findById(req.params.id);
        if (!caregiverNote) {
            return res.status(404).json({ message: 'Caregiver note not found' });
        }

        // Verify ownership (if caregiver, must be creator)
        if (req.user.role === 'caregiver' && caregiverNote.caregiver.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized: You can only delete your own notes' });
        }

        await CaregiverNote.findByIdAndDelete(req.params.id);
        res.json({ message: 'Caregiver note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Report = require('../models/Report');

// @desc    Get medical reports for assigned patient
// @route   GET /api/caregiver/reports/:patientId
// @access  Private/Caregiver
router.get('/reports/:patientId', protect, authorize('caregiver'), async (req, res) => {
    try {
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver) return res.status(404).json({ message: 'Caregiver profile not found' });

        const isAssigned = caregiver.assignedPatients.some(id => id.toString() === req.params.patientId);
        if (!isAssigned) {
            return res.status(403).json({ message: 'Access denied: Patient is not assigned to you' });
        }

        const reports = await Report.find({ patient: req.params.patientId }).sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
