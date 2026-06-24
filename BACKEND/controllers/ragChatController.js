const Patient = require('../models/Patient');
const Chat = require('../models/Chat');
const askGemini = require('../utils/gemini');
const { retrieveRelevantDocuments } = require('../services/retrievalService');

/**
 * Handles RAG-based chat queries for Dementia Care Memory Assistant
 * POST /api/rag/chat
 */
async function handleRagChat(req, res) {
    try {
        const { message, patientId: targetPatientId } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // 1. Resolve patient ID and check permissions
        let patientId;
        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient) {
                return res.status(404).json({ success: false, message: 'Patient profile not found.' });
            }
            patientId = patient._id.toString();
        } else if (req.user.role === 'caregiver') {
            if (!targetPatientId) {
                return res.status(400).json({ success: false, message: 'patientId is required for caregivers.' });
            }
            const Caregiver = require('../models/Caregiver');
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            if (!caregiver) {
                return res.status(404).json({ success: false, message: 'Caregiver profile not found.' });
            }
            const isAssigned = caregiver.assignedPatients.some(id => id.toString() === targetPatientId.toString());
            if (!isAssigned) {
                return res.status(403).json({ success: false, message: 'Not authorized: Patient is not assigned to you.' });
            }
            patientId = targetPatientId;
        } else if (req.user.role === 'admin') {
            if (!targetPatientId) {
                return res.status(400).json({ success: false, message: 'patientId is required for administrators.' });
            }
            patientId = targetPatientId;
        } else if (req.user.role === 'doctor') {
            // Doctors bypass target check but must be assigned to the patient
            if (!targetPatientId) {
                return res.status(400).json({ success: false, message: 'patientId is required for doctors.' });
            }
            const Doctor = require('../models/Doctor');
            const doctor = await Doctor.findOne({ user: req.user.id });
            if (!doctor || !doctor.assignedPatients.some(id => id.toString() === targetPatientId.toString())) {
                return res.status(403).json({ success: false, message: 'Not authorized: Patient is not assigned to you.' });
            }
            patientId = targetPatientId;
        } else {
            return res.status(403).json({ success: false, message: 'Access denied: Unauthorized role.' });
        }

        // 2. Fetch basic Patient details for naming context
        const patientRecord = await Patient.findById(patientId);
        const patientName = patientRecord 
            ? `${patientRecord.firstName || ''} ${patientRecord.lastName || ''}`.trim() || 'Patient'
            : 'Patient';

        // 3. Query Pinecone for the top 5 relevant documents matching this patient
        const retrievalResult = await retrieveRelevantDocuments(patientId, message, 5);
        const retrievedDocs = retrievalResult.documents || [];
        const sourceTypes = retrievalResult.sourceTypes || [];

        // 4. Retrieve recent MongoDB chat history (last 5 messages) for immediate dialog context
        const recentChats = await Chat.find({ patient: patientId })
            .sort({ createdAt: -1 })
            .limit(5);
        
        const formattedHistory = recentChats
            .reverse()
            .map(c => `${c.role === 'user' ? 'Patient' : 'Assistant'}: ${c.message}`)
            .join('\n');

        // 5. Timeline-Aware RAG (Feature 6): Fetch actual database events if chronological query detected
        let timelineContext = '';
        const chronologicalKeywords = /\b(timeline|history|this month|what happened|recent|past|schedule|notes|observations|observations?|events|happenings|medication|appointments?|tasks?|prescriptions?)\b/i;
        if (chronologicalKeywords.test(message)) {
            console.log(`[RAGChatController] Temporal/Timeline query detected. Injecting database timeline...`);
            const Appointment = require('../models/Appointment');
            const Task = require('../models/Task');
            const Prescription = require('../models/Prescription');
            const Report = require('../models/Report');
            const CaregiverNote = require('../models/CaregiverNote');

            const appts = await Appointment.find({ patient: patientId }).sort({ date: -1 }).limit(8);
            const tsks = await Task.find({ patient: patientId }).sort({ dueDate: -1 }).limit(8);
            const rxs = await Prescription.find({ patient: patientId }).sort({ startDate: -1 }).limit(8);
            const rpts = await Report.find({ patient: patientId }).sort({ date: -1 }).limit(8);
            const nts = await CaregiverNote.find({ patient: patientId }).sort({ date: -1 }).limit(8);

            const timelineEvents = [];
            appts.forEach(a => timelineEvents.push({ text: `Appointment on ${a.date} at ${a.time} with Dr. ${a.doctorName} (${a.department}). Status: ${a.status}. Notes: ${a.notes || 'None'}`, date: new Date(a.date) }));
            tsks.forEach(t => timelineEvents.push({ text: `Reminder Task: "${t.title}" (Priority: ${t.priority}, Status: ${t.status}) due on ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}.`, date: new Date(t.dueDate) }));
            rxs.forEach(r => timelineEvents.push({ text: `Prescription: ${r.medicineName} (Dosage: ${r.dosage}, Frequency: ${r.frequency}) starting on ${r.startDate ? new Date(r.startDate).toLocaleDateString() : 'N/A'}.`, date: new Date(r.startDate) }));
            rpts.forEach(rp => timelineEvents.push({ text: `Medical Diagnostic Report: "${rp.title}" (${rp.type}, Date: ${rp.date ? new Date(rp.date).toLocaleDateString() : 'N/A'}). Priority: ${rp.priority}, Status: ${rp.status}`, date: new Date(rp.date) }));
            nts.forEach(n => timelineEvents.push({ text: `Caregiver Daily Observation: "${n.note}" logged on ${n.date ? new Date(n.date).toLocaleString() : 'N/A'}.`, date: new Date(n.date) }));

            timelineEvents.sort((a, b) => b.date - a.date);
            timelineContext = timelineEvents.slice(0, 12).map(e => `- ${e.text}`).join('\n');
        }

        // 6. Build system prompt and RAG context
        let systemPrompt = `You are a Dementia Memory Assistant.
Your primary goal is to help patient ${patientName} with their daily reminders, medicines, appointments, personal memories, and caregiver observations.

Rules:
* Use the retrieved patient records below first to answer any questions.
* Never hallucinate or make up medicines, prescriptions, courses, or dosages.
* Never hallucinate or fabricate scheduled appointments, doctors, dates, times, or notes.
* Never hallucinate or fabricate diagnoses, allergies, profile details, or caregiver notes.
* If the required information is not available in the retrieved records or recent conversation, explicitly and politely say: "I'm sorry, I cannot find that information in your record. Please check with your caregiver or primary doctor."
* Answer in very simple, short, and clear language suitable for dementia patients.
* Keep responses comforting, reassuring, and concise (usually 2-4 sentences max).
* Do NOT append any list of sources or citations yourself. The system will programmatically append verified sources to your response.

Retrieved Patient Records (Context):
${retrievedDocs.map((doc, idx) => `[Record ${idx + 1}] (Source: ${doc.type}) - ${doc.text}`).join('\n\n') || 'No matching records found in the database.'}
`;

        if (timelineContext) {
            systemPrompt += `\n\nRecent Patient Timeline (Actual Chronological Database Events):\n${timelineContext}\n`;
        }

        systemPrompt += `\nRecent Conversation History:\n${formattedHistory || 'No previous messages in this session.'}\n`;

        const fullPrompt = `${systemPrompt}\n\nPatient: ${message}\nAssistant:`;

        // 7. Generate answer using Gemini
        console.log(`[RAGChatController] Submitting context and prompt to Gemini...`);
        const answer = await askGemini(fullPrompt);

        // 8. Programmatically format verified source citations (Feature 1)
        let finalAnswer = answer;
        const uniqueSources = new Map();
        
        // Filter out low similarity matches for citations (e.g. score < 0.2)
        const relevantDocs = retrievedDocs.filter(d => d.score >= 0.15);
        
        relevantDocs.forEach(doc => {
            const key = `${doc.type}_${doc.contentId || doc.id}`;
            if (!uniqueSources.has(key)) {
                let sourceName = "";
                if (doc.type === 'profile') sourceName = "Medical Profile Record";
                else if (doc.type === 'prescription') sourceName = "Prescription Medication File";
                else if (doc.type === 'appointment') sourceName = "Doctor Appointment Schedule";
                else if (doc.type === 'task') sourceName = "Care Task Reminder";
                else if (doc.type === 'chat') sourceName = "Recent Conversation Log";
                else if (doc.type === 'caregiver_note') sourceName = "Caregiver Daily Observation";
                else if (doc.type === 'report') sourceName = "Medical Diagnostic Report";
                else sourceName = "Health File Record";

                let extraDetail = "";
                if (doc.type === 'prescription') {
                    const match = doc.text.match(/Starts on\s+([^\s\n]+)/i);
                    if (match) extraDetail = `\n  - Prescribed on: ${match[1].replace(/[.,\/]$/, "")}`;
                } else if (doc.type === 'appointment') {
                    const match = doc.text.match(/Date:\s+([^\s\n]+)/i);
                    if (match) extraDetail = `\n  - Date: ${match[1].replace(/[.,\/]$/, "")}`;
                } else if (doc.type === 'report') {
                    const match = doc.text.match(/Date of Report:\s+([^\n]+)/i);
                    if (match) extraDetail = `\n  - Date: ${match[1].trim()}`;
                } else if (doc.type === 'task') {
                    const match = doc.text.match(/Due Date and Time:\s+([^\n]+)/i);
                    if (match) extraDetail = `\n  - Due: ${match[1].trim()}`;
                } else if (doc.type === 'caregiver_note') {
                    const match = doc.text.match(/Logged by Caregiver on:\s+([^\n]+)/i);
                    if (match) extraDetail = `\n  - Observation date: ${match[1].trim()}`;
                }

                uniqueSources.set(key, {
                    type: doc.type,
                    name: `${sourceName}${extraDetail}`,
                    contentId: doc.contentId
                });
            }
        });

        if (uniqueSources.size > 0) {
            const sourceList = Array.from(uniqueSources.values())
                .map(src => `- ${src.name}`)
                .join('\n');
            finalAnswer = `${answer}\n\nSources:\n${sourceList}`;
        }

        // 9. Store user message and assistant response in MongoDB Chat history
        await Chat.create({ patient: patientId, role: 'user', message });
        await Chat.create({ patient: patientId, role: 'assistant', message: finalAnswer });

        // 10. Return structured RAG response
        res.json({
            success: true,
            answer: finalAnswer,
            retrievedDocuments: Array.from(uniqueSources.values()),
            sourceTypes
        });

    } catch (error) {
        console.error('[RAGChatController] Chat handler error:', error);
        res.status(500).json({
            success: false,
            message: 'RAG Chat Error: Failed to process assistant response.'
        });
    }
}

module.exports = {
    handleRagChat
};
