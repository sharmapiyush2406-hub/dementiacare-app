const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private/Patient
router.get('/profile', protect, authorize('patient'), async (req, res) => {
    try {
        let patient = await Patient.findOne({ user: req.user.id });

        if (!patient) {
            // Auto-create a blank profile doc for this patient
            patient = await Patient.create({ user: req.user.id });
        }

        // Also send the email from the User doc
        res.json({
            email: req.user.email,
            personal: {
                firstName: patient.firstName,
                lastName: patient.lastName,
                phone: patient.phone,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                address: patient.address,
            },
            medical: {
                bloodGroup: patient.bloodGroup,
                age: patient.age,
                weight: patient.weight,
                height: patient.height,
                conditions: patient.conditions,
                allergies: patient.allergies,
                currentMedications: patient.currentMedications,
                primaryDoctor: patient.primaryDoctor,
                lastVisit: patient.lastVisit,
                nextAppointment: patient.nextAppointment,
            },
            emergency: patient.emergency,
            preferences: patient.preferences,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private/Patient
router.put('/profile', protect, authorize('patient'), async (req, res) => {
    try {
        const { personal, medical, emergency, preferences } = req.body;

        let patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            patient = new Patient({ user: req.user.id });
        }

        // Update personal fields
        if (personal) {
            patient.firstName = personal.firstName ?? patient.firstName;
            patient.lastName = personal.lastName ?? patient.lastName;
            patient.phone = personal.phone ?? patient.phone;
            patient.dateOfBirth = personal.dateOfBirth ?? patient.dateOfBirth;
            patient.gender = personal.gender ?? patient.gender;
            patient.address = personal.address ?? patient.address;
        }

        // Update medical fields
        if (medical) {
            patient.bloodGroup = medical.bloodGroup ?? patient.bloodGroup;
            patient.age = medical.age ?? patient.age;
            patient.weight = medical.weight ?? patient.weight;
            patient.height = medical.height ?? patient.height;
            patient.conditions = medical.conditions ?? patient.conditions;
            patient.allergies = medical.allergies ?? patient.allergies;
            patient.currentMedications = medical.currentMedications ?? patient.currentMedications;
            patient.primaryDoctor = medical.primaryDoctor ?? patient.primaryDoctor;
            patient.lastVisit = medical.lastVisit ?? patient.lastVisit;
            patient.nextAppointment = medical.nextAppointment ?? patient.nextAppointment;
        }

        // Update emergency contacts
        if (emergency) {
            patient.emergency = { ...patient.emergency.toObject(), ...emergency };
        }

        // Update preferences
        if (preferences) {
            patient.preferences = { ...patient.preferences.toObject(), ...preferences };
        }

        await patient.save();

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get assigned caregiver
// @route   GET /api/patient/my-caregiver
// @access  Private/Patient
router.get('/my-caregiver', protect, authorize('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id })
            .populate('assignedCaregiver', '-password');

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient.assignedCaregiver);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Task = require('../models/Task');
const Prescription = require('../models/Prescription');

// @desc    Get my daily tasks
// @route   GET /api/patient/my-tasks
// @access  Private/Patient
router.get('/my-tasks', protect, authorize('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const tasks = await Task.find({ patient: patient._id }).sort({ dueDate: -1 });
        const mappedTasks = tasks.map(task => ({
            _id: task._id,
            description: task.description || task.title,
            patient: task.patient,
            caregiver: task.caregiver,
            isCompleted: task.status === 'Completed',
            date: task.dueDate
        }));
        res.json(mappedTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark task as complete
// @route   PUT /api/patient/task/:id/complete
// @access  Private/Patient
router.put('/task/:id/complete', protect, authorize('patient'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Verify task belongs to this patient
        const patient = await Patient.findOne({ user: req.user.id });
        if (task.patient.toString() !== patient._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        task.status = 'Completed';
        await task.save();
        res.json({
            _id: task._id,
            description: task.description || task.title,
            patient: task.patient,
            caregiver: task.caregiver,
            isCompleted: true,
            date: task.dueDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my prescriptions
// @route   GET /api/patient/my-prescriptions
// @access  Private/Patient
router.get('/prescriptions', protect, authorize('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const prescriptions = await Prescription.find({ patient: patient._id }).sort({ startDate: -1 });
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get all doctors for booking
// @route   GET /api/patient/doctors
// @access  Private/Patient
router.get('/doctors', protect, authorize('patient'), async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('firstName lastName specialization department hospital');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Book a new appointment
// @route   POST /api/patient/appointment
// @access  Private/Patient
router.post('/appointment', protect, authorize('patient'), async (req, res) => {
    try {
        const { doctorId, doctorName, department, date, time, type, notes } = req.body;

        if (!doctorId || !doctorName || !department || !date || !time) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const appointment = await Appointment.create({
            patient: patient._id,
            doctor: doctorId,
            doctorName,
            department,
            date,
            time,
            type: type || 'Routine Checkup',
            notes: notes || '',
            status: 'Upcoming'
        });

        // Sync Patient.nextAppointment
        const nextAppt = await Appointment.findOne({
            patient: patient._id,
            status: 'Upcoming'
        }).sort({ date: 1, time: 1 });

        if (nextAppt) {
            patient.nextAppointment = nextAppt.date;
            await patient.save();
        }

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
router.get('/appointments', protect, authorize('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const appointments = await Appointment.find({ patient: patient._id }).sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel an appointment
// @route   PUT /api/patient/appointment/:id/cancel
// @access  Private/Patient
router.put('/appointment/:id/cancel', protect, authorize('patient'), async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const patient = await Patient.findOne({ user: req.user.id });
        if (appointment.patient.toString() !== patient._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.status = 'Cancelled';
        await appointment.save();

        // Sync nextAppointment
        const nextAppt = await Appointment.findOne({
            patient: patient._id,
            status: 'Upcoming'
        }).sort({ date: 1, time: 1 });
        patient.nextAppointment = nextAppt ? nextAppt.date : '';
        await patient.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reschedule an appointment
// @route   PUT /api/patient/appointment/:id/reschedule
// @access  Private/Patient
router.put('/appointment/:id/reschedule', protect, authorize('patient'), async (req, res) => {
    try {
        const { date, time } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const patient = await Patient.findOne({ user: req.user.id });
        if (appointment.patient.toString() !== patient._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.date = date;
        appointment.time = time;
        appointment.status = 'Upcoming';
        await appointment.save();

        // Sync nextAppointment
        const nextAppt = await Appointment.findOne({
            patient: patient._id,
            status: 'Upcoming'
        }).sort({ date: 1, time: 1 });
        patient.nextAppointment = nextAppt ? nextAppt.date : '';
        await patient.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const Report = require('../models/Report');

// @desc    Get my medical reports
// @route   GET /api/patient/reports
// @access  Private/Patient
router.get('/reports', protect, authorize('patient'), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const reports = await Report.find({ patient: patient._id }).sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
