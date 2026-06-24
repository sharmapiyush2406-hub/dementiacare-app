const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Report = require("../models/Report");
const Chat = require("../models/Chat");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const askGemini = require("../utils/gemini");

const CaregiverNote = require("../models/CaregiverNote");
const Task = require("../models/Task");

console.log("Dementia Memory AI Routes Loaded");

// Helper to resolve patient ID and check role-based permissions
async function resolvePatientId(req, res, targetPatientId) {
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            res.status(404).json({ success: false, message: 'Patient profile not found.' });
            return null;
        }
        return patient._id.toString();
    }

    if (!targetPatientId) {
        res.status(400).json({ success: false, message: 'patientId is required for caregivers/doctors/admins.' });
        return null;
    }

    if (req.user.role === 'caregiver') {
        const Caregiver = require('../models/Caregiver');
        const caregiver = await Caregiver.findOne({ user: req.user.id });
        if (!caregiver || !caregiver.assignedPatients.some(id => id.toString() === targetPatientId.toString())) {
            res.status(403).json({ success: false, message: 'Not authorized: Patient is not assigned to you.' });
            return null;
        }
    } else if (req.user.role === 'doctor') {
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findOne({ user: req.user.id });
        if (!doctor || !doctor.assignedPatients.some(id => id.toString() === targetPatientId.toString())) {
            res.status(403).json({ success: false, message: 'Not authorized: Patient is not assigned to you.' });
            return null;
        }
    }
    return targetPatientId;
}

// @desc    Get chat history for patient
// @route   GET /api/ai/history
// @access  Private/Patient
router.get("/history", protect, authorize("patient"), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient profile not found" });
        }

        const chats = await Chat.find({ patient: patient._id }).sort({ createdAt: 1 });
        
        const mappedHistory = chats.map(chat => ({
            id: chat._id,
            sender: chat.role,
            text: chat.message,
            time: new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        res.json({
            success: true,
            history: mappedHistory
        });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Clear chat history for patient
// @route   DELETE /api/ai/history
// @access  Private/Patient
router.delete("/history", protect, authorize("patient"), async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user.id });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient profile not found" });
        }

        await Chat.deleteMany({ patient: patient._id });

        res.json({
            success: true,
            message: "Chat history cleared successfully"
        });
    } catch (error) {
        console.error("Error clearing chat history:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Send question to Dementia AI Assistant
// @route   POST /api/ai/chat
// @access  Private/Patient
router.post("/chat", protect, authorize("patient"), async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        // 1. Fetch patient profile
        const patient = await Patient.findOne({ user: req.user.id })
            .populate({ path: "user", select: "email" });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        // 2. Fetch prescriptions
        const prescriptions = await Prescription.find({ patient: patient._id });

        // 3. Fetch appointments
        const appointments = await Appointment.find({ patient: patient._id }).sort({ date: 1 });

        // 4. Fetch reports
        const reports = await Report.find({ patient: patient._id }).sort({ date: -1 });

        // 5. Fetch chat history for context memory
        const pastMessages = await Chat.find({ patient: patient._id })
            .sort({ createdAt: -1 })
            .limit(10);
            
        const formattedHistory = pastMessages
            .reverse()
            .map(m => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.message}`)
            .join("\n");

        // 6. Build context dynamically
        const patientName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient";
        
        let context = `System Instructions:
You are an AI Personal Memory Assistant designed to help patients with dementia, memory concerns, or cognitive impairment.
Be extremely kind, patient, reassuring, and clear.
Use simple language, short sentences, and structured bullet points if helpful.
Do not overwhelm the patient. Keep replies concise (usually 2-4 sentences is best).
Answer questions using ONLY the provided patient records.
If the patient asks about information not present in the records below, answer politely that you cannot find it in their file and suggest they contact their primary caregiver or primary doctor.
Do not make up or guess any medical details. If any information is missing or empty, gracefully tell them you don't have it on file.

Patient Profile:
- Name: ${patientName}
- Age: ${patient.age || "Not specified"}
- Diagnosed Conditions: ${patient.conditions || "None listed"}
- Allergies: ${patient.allergies || "None listed"}
- Primary Doctor: ${patient.primaryDoctor || "Not specified"}
- Emergency Contact: ${patient.emergency?.contactName || "None"} (${patient.emergency?.contactPhone || ""})

Medications & Prescriptions (Active):
${prescriptions.map((pr, i) => `${i+1}. ${pr.medicineName} - Dosage: ${pr.dosage}, Frequency: ${pr.frequency}, Instructions: ${pr.instructions || "None"}`).join("\n") || "No active prescriptions listed."}

Upcoming Appointments:
${appointments.map((ap, i) => `${i+1}. with ${ap.doctorName} (${ap.department}) on ${ap.date} at ${ap.time}. Status: ${ap.status}, Notes: ${ap.notes || "None"}`).join("\n") || "No upcoming appointments listed."}

Recent Medical Reports:
${reports.map((rp, i) => `${i+1}. "${rp.title}" (${rp.type}) dated ${new Date(rp.date).toLocaleDateString()}. Status: ${rp.status}, Priority: ${rp.priority}`).join("\n") || "No medical reports listed."}

Recent Conversation History:
${formattedHistory || "No previous messages."}
`;

        const fullPrompt = `${context}\n\nPatient: ${message}\nAssistant:`;

        // 7. Send context to Gemini
        const responseText = await askGemini(fullPrompt);

        // 8. Store conversations in DB
        await Chat.create({ patient: patient._id, role: "user", message });
        await Chat.create({ patient: patient._id, role: "assistant", message: responseText });

        res.json({
            success: true,
            response: responseText
        });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({
            success: false,
            message: "AI Error: Failed to process assistant response."
        });
    }
});

// @desc    Get AI-generated dementia-friendly daily summary
// @route   GET /api/ai/daily-summary
// @access  Private
router.get("/daily-summary", protect, authorize("patient", "caregiver", "doctor", "admin"), async (req, res) => {
    try {
        const targetPatientId = req.query.patientId;
        const patientId = await resolvePatientId(req, res, targetPatientId);
        if (!patientId) return;

        const patient = await Patient.findById(patientId);
        const patientName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient";

        // Fetch recent patient records
        const appointments = await Appointment.find({ patient: patientId, status: "Upcoming" }).sort({ date: 1 }).limit(5);
        const tasks = await Task.find({ patient: patientId, status: { $in: ["Pending", "In Progress"] } }).sort({ dueDate: 1 }).limit(5);
        const prescriptions = await Prescription.find({ patient: patientId }).sort({ startDate: -1 }).limit(10);
        const caregiverNotes = await CaregiverNote.find({ patient: patientId }).sort({ date: -1 }).limit(3);
        const reports = await Report.find({ patient: patientId }).sort({ date: -1 }).limit(3);

        // Format details for LLM context
        const apptText = appointments.map(a => `- Appt with ${a.doctorName} (${a.department}) on ${a.date} at ${a.time}`).join("\n") || "No upcoming appointments.";
        const taskText = tasks.map(t => `- Task: ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Today"})`).join("\n") || "No pending tasks.";
        const rxText = prescriptions.map(p => `- Medication: ${p.medicineName} (Dosage: ${p.dosage}, Freq: ${p.frequency})`).join("\n") || "No active medications.";
        const noteText = caregiverNotes.map(n => `- Note (${new Date(n.date).toLocaleDateString()}): ${n.note}`).join("\n") || "No recent caregiver notes.";
        const reportText = reports.map(r => `- Diagnostic update: ${r.title} (${r.type}, Date: ${r.date ? new Date(r.date).toLocaleDateString() : "N/A"})`).join("\n") || "No recent report updates.";

        const prompt = `System Instructions:
You are a warm, extremely kind, patient, and reassuring AI Dementia Care Assistant.
Create a highly concise, daily summary for patient ${patientName}.
Your summary MUST be extremely simple, positive, comforting, and clear.
Use short sentences and structured bullet points.
Format the output into 4 to 6 bullet points total, summarizing:
1. Today's key activities or reminders (pending tasks).
2. Upcoming appointments they should know about.
3. Their active medications to take.
4. Any helpful recent observations or comforting status updates from their caregiver team.
Address the patient directly by name (e.g., "Hello ${patientName}, here is a gentle overview of your day:"). Keep the tone very encouraging and warm.

Input Patient Data:
Name: ${patientName}
Active Medications:
${rxText}

Upcoming Appointments:
${apptText}

Pending Tasks/Reminders:
${taskText}

Caregiver Observations:
${noteText}

Medical Updates:
${reportText}
`;

        console.log(`[DailySummary] Querying Gemini for summary of patient: ${patientName}`);
        const summaryText = await askGemini(prompt);

        res.json({
            success: true,
            summary: summaryText
        });
    } catch (error) {
        console.error("Daily Summary API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get chronological patient event timeline
// @route   GET /api/ai/timeline
// @access  Private
router.get("/timeline", protect, authorize("patient", "caregiver", "doctor", "admin"), async (req, res) => {
    try {
        const targetPatientId = req.query.patientId;
        const patientId = await resolvePatientId(req, res, targetPatientId);
        if (!patientId) return;

        // Query all categories
        const appointments = await Appointment.find({ patient: patientId }).sort({ date: -1 });
        const tasks = await Task.find({ patient: patientId }).sort({ dueDate: -1 });
        const prescriptions = await Prescription.find({ patient: patientId }).sort({ startDate: -1 });
        const reports = await Report.find({ patient: patientId }).sort({ date: -1 });
        const caregiverNotes = await CaregiverNote.find({ patient: patientId }).sort({ date: -1 });

        const events = [];

        // Map appointments
        appointments.forEach(a => {
            let eventDate = new Date(a.date);
            if (isNaN(eventDate)) eventDate = new Date();
            events.push({
                id: `appt_${a._id}`,
                type: "appointment",
                title: `Doctor Appointment`,
                description: `With ${a.doctorName} (${a.department}) at ${a.time}. Status: ${a.status}. Notes: ${a.notes || "None"}`,
                date: eventDate,
                formattedDate: new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
        });

        // Map prescriptions
        prescriptions.forEach(p => {
            let eventDate = new Date(p.startDate || p.createdAt);
            if (isNaN(eventDate)) eventDate = new Date();
            events.push({
                id: `rx_${p._id}`,
                type: "prescription",
                title: `Medication Prescribed`,
                description: `Medicine: ${p.medicineName}. Dosage: ${p.dosage}, Frequency: ${p.frequency}. Instructions: ${p.instructions || "None"}`,
                date: eventDate,
                formattedDate: new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
        });

        // Map tasks
        tasks.forEach(t => {
            let eventDate = new Date(t.dueDate || t.createdAt);
            if (isNaN(eventDate)) eventDate = new Date();
            events.push({
                id: `task_${t._id}`,
                type: "task",
                title: `Reminder / Task`,
                description: `Task: ${t.title}. Description: ${t.description || "None"}. Priority: ${t.priority}, Status: ${t.status}`,
                date: eventDate,
                formattedDate: new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
        });

        // Map reports
        reports.forEach(r => {
            let eventDate = new Date(r.date || r.createdAt);
            if (isNaN(eventDate)) eventDate = new Date();
            events.push({
                id: `report_${r._id}`,
                type: "report",
                title: `Medical Report: ${r.title}`,
                description: `Type: ${r.type}, Priority: ${r.priority}, Status: ${r.status}. Findings extracted: ${r.extractedText ? "Yes" : "No"}`,
                date: eventDate,
                formattedDate: new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
        });

        // Map caregiver notes
        caregiverNotes.forEach(n => {
            let eventDate = new Date(n.date || n.createdAt);
            if (isNaN(eventDate)) eventDate = new Date();
            events.push({
                id: `note_${n._id}`,
                type: "caregiver_note",
                title: `Caregiver Observation`,
                description: `Observation: "${n.note}"`,
                date: eventDate,
                formattedDate: new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            });
        });

        // Sort events: latest first
        events.sort((a, b) => b.date - a.date);

        res.json({
            success: true,
            timeline: events
        });
    } catch (error) {
        console.error("Timeline API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;