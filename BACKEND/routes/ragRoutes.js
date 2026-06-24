const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Task = require('../models/Task');
const Chat = require('../models/Chat');
const Report = require('../models/Report');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { testPineconeConnection, index } = require('../utils/pinecone');
const {
    indexPatient,
    reindexPatient,
    reindexAllPatients
} = require('../services/ragService');
const { handleRagChat } = require('../controllers/ragChatController');

// Configure multer storage for RAG uploads
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

/**
 * Helper to resolve patient ID and verify role-based permissions
 */
async function getPatientIdAndCheckPermission(req, res, targetPatientId) {
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            res.status(404).json({ message: 'Patient profile not found.' });
            return null;
        }
        return patient._id.toString();
    }

    if (req.user.role === 'caregiver') {
        if (!targetPatientId) {
            res.status(400).json({ message: 'patientId is required for caregivers.' });
            return null;
        }

        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver) {
            res.status(404).json({ message: 'Caregiver profile not found.' });
            return null;
        }

        if (!caregiver.assignedPatients.includes(targetPatientId)) {
            res.status(403).json({ message: 'Not authorized: Patient is not assigned to you.' });
            return null;
        }

        return targetPatientId;
    }

    if (req.user.role === 'admin') {
        if (!targetPatientId) {
            res.status(400).json({ message: 'patientId is required for administrators.' });
            return null;
        }
        return targetPatientId;
    }

    res.status(403).json({ message: 'Access denied: Unauthorized role.' });
    return null;
}

// @desc    Test Pinecone connection status
// @route   GET /api/rag/status
// @access  Private (Patient, Caregiver, Admin)
router.get('/status', protect, authorize('patient', 'caregiver', 'admin'), async (req, res) => {
    const result = await testPineconeConnection();
    if (result.success) {
        res.json({
            success: true,
            status: 'Connected',
            stats: result.stats
        });
    } else {
        res.status(500).json({
            success: false,
            status: 'Disconnected',
            message: result.message
        });
    }
});

// @desc    Index single patient records in Pinecone
// @route   POST /api/rag/index-patient
// @access  Private (Patient, Caregiver, Admin)
router.post('/index-patient', protect, authorize('patient', 'caregiver', 'admin'), async (req, res) => {
    try {
        const targetPatientId = req.body.patientId;
        const patientId = await getPatientIdAndCheckPermission(req, res, targetPatientId);
        
        if (!patientId) return; // Response sent in helper

        const vectorCount = await indexPatient(patientId);
        
        res.json({
            success: true,
            message: `Patient records successfully indexed.`,
            patientId,
            vectorsUpserted: vectorCount
        });
    } catch (error) {
        console.error('RAG Indexing API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Reindex single patient records (deletes old vectors first)
// @route   POST /api/rag/reindex-patient
// @access  Private (Patient, Caregiver, Admin)
router.post('/reindex-patient', protect, authorize('patient', 'caregiver', 'admin'), async (req, res) => {
    try {
        const targetPatientId = req.body.patientId;
        const patientId = await getPatientIdAndCheckPermission(req, res, targetPatientId);
        
        if (!patientId) return; // Response sent in helper

        const vectorCount = await reindexPatient(patientId);
        
        res.json({
            success: true,
            message: `Patient records successfully re-indexed.`,
            patientId,
            vectorsUpserted: vectorCount
        });
    } catch (error) {
        console.error('RAG Reindexing API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Reindex all patients (caregiver/admin only)
// @route   POST /api/rag/reindex-all
// @access  Private (Caregiver, Admin)
router.post('/reindex-all', protect, authorize('caregiver', 'admin'), async (req, res) => {
    try {
        const result = await reindexAllPatients();
        res.json({
            success: true,
            message: 'Successfully re-indexed all patients.',
            ...result
        });
    } catch (error) {
        console.error('RAG Reindex All API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Upload patient PDF medical report and index its text findings via RAG
// @route   POST /api/rag/upload
// @access  Private (Patient, Caregiver, Admin)
router.post('/upload', protect, authorize('patient', 'caregiver', 'admin'), upload.single('pdf'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'PDF report file is required' });
        }

        const targetPatientId = req.body.patientId;
        const patientId = await getPatientIdAndCheckPermission(req, res, targetPatientId);
        
        if (!patientId) return; // Response sent in helper

        // 1. Fetch patient details for name
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
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

        // 3. Create Report in MongoDB (uses uploader user as doctor ref)
        const report = await Report.create({
            title: req.body.title || file.originalname.replace(/\.[^/.]+$/, ""),
            patient: patientId,
            patientName,
            doctor: req.user.id,
            type: req.body.type || 'Diagnostic',
            priority: req.body.priority || 'Medium',
            status: 'Completed',
            filePath: `/uploads/reports/${file.filename}`,
            extractedText: extractedText
        });

        res.status(201).json({
            success: true,
            message: 'Report uploaded and parsed successfully',
            report
        });
    } catch (error) {
        console.error('Report upload API error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    RAG-powered conversational assistant chat
// @route   POST /api/rag/chat
// @access  Private (Patient, Caregiver, Admin)
router.post('/chat', protect, authorize('patient', 'caregiver', 'admin'), handleRagChat);

// @desc    Retrieve diagnostics information for Pinecone and MongoDB indexing
// @route   GET /api/rag/debug
// @access  Private (Patient, Caregiver, Admin)
router.get('/debug', protect, authorize('patient', 'caregiver', 'admin'), async (req, res) => {
    try {
        const targetPatientId = req.query.patientId;
        const patientId = await getPatientIdAndCheckPermission(req, res, targetPatientId);
        if (!patientId) return; // response sent in helper

        // 1. Get Pinecone Status & Index Stats
        const pineconeConn = await testPineconeConnection();
        let stats = null;
        let vectorCount = 0;
        let namespaces = {};

        if (pineconeConn.success) {
            stats = pineconeConn.stats;
            if (stats && stats.namespaces) {
                namespaces = stats.namespaces;
                const nsInfo = stats.namespaces[''] || Object.values(stats.namespaces)[0];
                if (nsInfo) {
                    vectorCount = nsInfo.recordCount || 0;
                }
            }
        }

        // 2. Fetch last 5 records of each type indexed in MongoDB for this patient
        const lastPrescriptions = await Prescription.find({ patient: patientId }).sort({ updatedAt: -1 }).limit(3);
        const lastAppointments = await Appointment.find({ patient: patientId }).sort({ updatedAt: -1 }).limit(3);
        const lastTasks = await Task.find({ patient: patientId }).sort({ updatedAt: -1 }).limit(3);
        const lastChats = await Chat.find({ patient: patientId }).sort({ updatedAt: -1 }).limit(3);

        const lastIndexed = {
            prescriptions: lastPrescriptions.map(p => ({ id: p._id, name: p.medicineName, updatedAt: p.updatedAt })),
            appointments: lastAppointments.map(a => ({ id: a._id, doctor: a.doctorName, date: a.date, updatedAt: a.updatedAt })),
            tasks: lastTasks.map(t => ({ id: t._id, title: t.title, status: t.status, updatedAt: t.updatedAt })),
            chats: lastChats.map(c => ({ id: c._id, role: c.role, message: c.message.substring(0, 30) + '...', updatedAt: c.updatedAt }))
        };

        res.json({
            success: true,
            pineconeStatus: pineconeConn.success ? 'Connected' : 'Disconnected',
            pineconeMessage: pineconeConn.message,
            namespace: process.env.PINECONE_INDEX_NAME || 'default',
            vectorCount,
            namespaces,
            lastIndexedRecords: lastIndexed
        });
    } catch (error) {
        console.error('RAG Debug API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
