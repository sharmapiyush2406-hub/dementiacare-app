const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Staff = require('../models/Staff');
const Report = require('../models/Report');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ── Helper: ensure a Doctor document always exists for the logged-in doctor ──
async function ensureDoctorDoc(userId) {
    let doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
        doctor = await Doctor.create({ user: userId, assignedPatients: [] });
    }
    return doctor;
}

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private/Doctor
router.get('/profile', protect, authorize('doctor'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Doctor not found' });

        const doctor = await ensureDoctorDoc(req.user.id);

        res.json({
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                specialization: user.specialization,
                licenseNo: user.licenseNo,
                department: user.department,
                hospital: user.hospital,
                experience: user.experience,
                opdTiming: user.opdTiming,
                ward: user.ward,
                bio: user.bio,
                joinDate: user.createdAt
                    ? new Date(user.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                    : '',
                patientCount: doctor ? doctor.assignedPatients.length : 0,
            },
            notifications: user.notifications,
            preferences: user.preferences,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update doctor profile
// @route   PUT /api/doctor/profile
// @access  Private/Doctor
router.put('/profile', protect, authorize('doctor'), async (req, res) => {
    try {
        const { profile, notifications, preferences } = req.body;

        const updateFields = {};

        if (profile) {
            const fields = [
                'firstName', 'lastName', 'phone', 'specialization',
                'licenseNo', 'department', 'hospital', 'experience',
                'opdTiming', 'ward', 'bio',
            ];
            fields.forEach((f) => {
                if (profile[f] !== undefined) updateFields[f] = profile[f];
            });
        }

        if (notifications) {
            updateFields.notifications = notifications;
        }

        if (preferences) {
            updateFields.preferences = preferences;
        }

        await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get assigned patients
// @route   GET /api/doctor/my-patients
// @access  Private/Doctor
router.get('/my-patients', protect, authorize('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.id })
            .populate({
                path: 'assignedPatients',
                populate: {
                    path: 'user',
                    select: '-password',
                },
            });

        // If no Doctor record yet, auto-create one and return empty list
        if (!doctor) {
            await Doctor.create({ user: req.user.id, assignedPatients: [] });
            return res.json([]);
        }

        // Filter out orphaned patient records (null user) then reshape into a
        // flat object that the frontend "My Patients" table can consume directly.
        const patientData = await Promise.all(doctor.assignedPatients
            .filter(p => p && p.user)
            .map(async (p) => {
                const latestPrescription = await Prescription.findOne({
                    patient: p._id,
                    doctor: req.user.id
                }).sort({ createdAt: -1 });

                // Find the next upcoming appointment from the Appointment model
                const nextAppt = await Appointment.findOne({
                    patient: p._id,
                    doctor: req.user.id,
                    status: 'Upcoming'
                }).sort({ date: 1, time: 1 });

                return {
                    id: p._id,
                    firstName: p.firstName || p.user.firstName || '',
                    lastName: p.lastName || p.user.lastName || '',
                    email: p.user.email,
                    phone: p.phone || '',
                    age: p.age || '',
                    gender: p.gender || '',
                    bloodGroup: p.bloodGroup || '',
                    conditions: p.conditions || '',
                    allergies: p.allergies || '',
                    currentMedications: p.currentMedications || '',
                    lastVisit: p.lastVisit || '',
                    nextAppointment: nextAppt ? nextAppt.date : p.nextAppointment || '',
                    address: p.address || '',
                    hasPrescription: !!latestPrescription,
                    prescription: latestPrescription,
                    emergency: {
                        contactName: p.emergency?.contactName || '',
                        relationship: p.emergency?.relationship || '',
                        contactPhone: p.emergency?.contactPhone || '',
                    },
                    // Derive a simple status tag for the UI
                    status: (() => {
                        const nextDateStr = nextAppt ? nextAppt.date : p.nextAppointment;
                        if (!nextDateStr) return 'Active';
                        const next = new Date(nextDateStr);
                        const now = new Date();
                        if (next < now) return 'Follow-up Needed';
                        const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
                        return diffDays <= 7 ? 'Upcoming' : 'Active';
                    })(),
                };
            }));

        res.json(patientData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all psychiatric medicines (reference / prescribing)
// @route   GET /api/doctor/medicines
// @query   category (optional) – filter by category name
// @access  Private/Doctor
router.get('/medicines', protect, authorize('doctor'), async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const medicines = await Medicine.find(filter).sort({ category: 1, name: 1 });
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get reports for logged-in doctor
// @route   GET /api/doctor/reports
// @access  Private/Doctor
router.get('/reports', protect, authorize('doctor'), async (req, res) => {
    try {
        const reports = await Report.find({ doctor: req.user.id })
            .sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all hospital staff
// @route   GET /api/doctor/staff
// @query   role (optional) – filter by role name (e.g. Doctor, Nurse)
// @access  Private/Doctor
router.get('/staff', protect, authorize('doctor'), async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        const staff = await Staff.find(filter).sort({ role: 1, name: 1 });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign prescription to a patient
// @route   POST /api/doctor/prescribe
// @access  Private/Doctor
router.post('/prescribe', protect, authorize('doctor'), async (req, res) => {
    try {
        const {
            patientId,
            medicineName,
            medicineId,
            dosage,
            frequency,
            instructions,
            startDate,
            endDate,
        } = req.body;

        if (!patientId || !medicineName || !dosage || !frequency) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const prescription = await Prescription.create({
            patient: patientId,
            doctor: req.user.id,
            medicineName,
            medicine: medicineId || null,
            dosage,
            frequency,
            instructions,
            startDate: startDate || Date.now(),
            endDate,
        });

        res.status(201).json({
            message: 'Prescription assigned successfully',
            prescription,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a prescription
// @route   PUT /api/doctor/prescription/:id
// @access  Private/Doctor
router.put('/prescription/:id', protect, authorize('doctor'), async (req, res) => {
    try {
        const {
            medicineName,
            medicineId,
            dosage,
            frequency,
            instructions,
            startDate,
            endDate,
        } = req.body;

        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Verify doctor ownership
        if (prescription.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this prescription' });
        }

        prescription.medicineName = medicineName || prescription.medicineName;
        prescription.medicine = medicineId || prescription.medicine;
        prescription.dosage = dosage || prescription.dosage;
        prescription.frequency = frequency || prescription.frequency;
        prescription.instructions = instructions !== undefined ? instructions : prescription.instructions;
        prescription.startDate = startDate || prescription.startDate;
        prescription.endDate = endDate || prescription.endDate;

        await prescription.save();

        res.json({
            message: 'Prescription updated successfully',
            prescription,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get prescription history for a specific patient
// @route   GET /api/doctor/prescriptions/:patientId
// @access  Private/Doctor
router.get('/prescriptions/:patientId', protect, authorize('doctor'), async (req, res) => {
    try {
        const prescriptions = await Prescription.find({
            patient: req.params.patientId,
            doctor: req.user.id,
        }).sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all appointments for the logged-in doctor
// @route   GET /api/doctor/appointments
// @access  Private/Doctor
router.get('/appointments', protect, authorize('doctor'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.user.id })
            .populate({
                path: 'patient',
                populate: { path: 'user', select: 'firstName lastName email' }
            })
            .sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new appointment
// @route   POST /api/doctor/appointment
// @access  Private/Doctor
router.post('/appointment', protect, authorize('doctor'), async (req, res) => {
    try {
        const { patientId, date, time, type, notes } = req.body;
        if (!patientId || !date || !time) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const doctorUser = await User.findById(req.user.id);

        const appointment = await Appointment.create({
            patient: patientId,
            doctor: req.user.id,
            doctorName: `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`,
            department: doctorUser.department,
            date,
            time,
            type: type || 'Routine Checkup',
            notes: notes || '',
            status: 'Upcoming'
        });

        // Sync Patient.nextAppointment
        const nextAppt = await Appointment.findOne({
            patient: patientId,
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

// @desc    Update an appointment
// @route   PUT /api/doctor/appointment/:id
// @access  Private/Doctor
router.put('/appointment/:id', protect, authorize('doctor'), async (req, res) => {
    try {
        const { date, time, status, type, notes } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (appointment.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.date = date || appointment.date;
        appointment.time = time || appointment.time;
        appointment.status = status || appointment.status;
        appointment.type = type || appointment.type;
        appointment.notes = notes !== undefined ? notes : appointment.notes;

        await appointment.save();

        // Sync Patient.nextAppointment
        const patient = await Patient.findById(appointment.patient);
        if (patient) {
            const nextAppt = await Appointment.findOne({
                patient: patient._id,
                status: 'Upcoming'
            }).sort({ date: 1, time: 1 });
            patient.nextAppointment = nextAppt ? nextAppt.date : '';
            await patient.save();
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/reports');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF file uploads are allowed.'));
        }
    }
});

// @desc    Upload patient PDF medical report and index its text findings
// @route   POST /api/doctor/reports/upload
// @access  Private/Doctor
router.post('/reports/upload', protect, authorize('doctor'), upload.single('pdf'), async (req, res) => {
    try {
        const { patientId, title, type, priority } = req.body;
        const file = req.file;

        if (!patientId) {
            return res.status(400).json({ message: 'Patient ID is required' });
        }

        if (!file) {
            return res.status(400).json({ message: 'PDF report file is required' });
        }

        // 1. Resolve patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }
        const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';

        // 2. Parse PDF and extract text findings
        let extractedText = '';
        try {
            const fileBuffer = fs.readFileSync(file.path);
            const parser = new PDFParse({ data: fileBuffer });
            const pdfData = await parser.getText();
            extractedText = pdfData.text || '';
            await parser.destroy();
        } catch (pdfErr) {
            console.error('PDF parsing failure:', pdfErr.message);
            extractedText = 'Failed to extract text from PDF document.';
        }

        // 3. Create Report in MongoDB
        const report = await Report.create({
            title: title || file.originalname.replace(/\.[^/.]+$/, ""),
            patient: patientId,
            patientName,
            doctor: req.user.id,
            type: type || 'Diagnostic',
            priority: priority || 'Medium',
            status: 'Completed',
            filePath: `/uploads/reports/${file.filename}`,
            extractedText: extractedText
        });

        res.status(201).json({
            message: 'Report uploaded and parsed successfully',
            report
        });
    } catch (error) {
        console.error('Report upload API error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a medical report
// @route   DELETE /api/doctor/reports/:id
// @access  Private/Doctor
router.delete('/reports/:id', protect, authorize('doctor'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // Verify doctor ownership
        if (report.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized: You did not upload this report' });
        }

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

// @desc    Get reports for a specific patient
// @route   GET /api/doctor/reports/patient/:patientId
// @access  Private/Doctor
router.get('/reports/patient/:patientId', protect, authorize('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.id });
        const isAssigned = doctor && doctor.assignedPatients.some(id => id.toString() === req.params.patientId);
        if (!doctor || !isAssigned) {
            return res.status(403).json({ message: 'Not authorized to view reports for this patient' });
        }

        const reports = await Report.find({ patient: req.params.patientId }).sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
