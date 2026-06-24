/**
 * Convert patient records into semantic text chunks suitable for vector embeddings
 */

function generateProfileDoc(patient) {
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
    const email = patient.user?.email || 'N/A';
    const emergencyContact = patient.emergency?.contactName
        ? `${patient.emergency.contactName} (${patient.emergency.relationship || 'Emergency contact'}), Phone: ${patient.emergency.contactPhone || 'N/A'}`
        : 'None listed';

    const text = `Medical Profile for Patient: ${patientName} (Email: ${email}).
Age: ${patient.age || 'Not specified'}, Date of Birth: ${patient.dateOfBirth || 'Not specified'}, Gender: ${patient.gender || 'Not specified'}, Address: ${patient.address || 'Not specified'}.
Blood Group: ${patient.bloodGroup || 'Not specified'}, Weight: ${patient.weight || 'Not specified'}, Height: ${patient.height || 'Not specified'}.
Diagnosed Health Conditions: ${patient.conditions || 'None listed'}.
Known Allergies: ${patient.allergies || 'None listed'}.
Current Medications: ${patient.currentMedications || 'None listed'}.
Primary Treating Doctor: ${patient.primaryDoctor || 'Not specified'}.
Emergency Contact Details: ${emergencyContact}.`;

    return {
        id: `${patient._id}_profile`,
        text,
        metadata: {
            patientId: patient._id.toString(),
            type: 'profile',
            contentId: patient._id.toString()
        }
    };
}

function generatePrescriptionDoc(patientName, rx) {
    const startDate = rx.startDate ? new Date(rx.startDate).toLocaleDateString() : 'N/A';
    const endDate = rx.endDate ? new Date(rx.endDate).toLocaleDateString() : 'Active/Ongoing';
    const text = `Medication Prescription Details for Patient: ${patientName}.
Medicine Name: ${rx.medicineName}.
Dosage/Strength: ${rx.dosage}.
Frequency: ${rx.frequency}.
Special Instructions: ${rx.instructions || 'None'}.
Prescribed course: Starts on ${startDate} and ends on ${endDate}.`;

    return {
        id: `${rx.patient}_prescription_${rx._id}`,
        text,
        metadata: {
            patientId: rx.patient.toString(),
            type: 'prescription',
            contentId: rx._id.toString()
        }
    };
}

function generateAppointmentDoc(patientName, appt) {
    const text = `Scheduled Appointment Details for Patient: ${patientName}.
Doctor Name: ${appt.doctorName}.
Specialization/Department: ${appt.department}.
Date: ${appt.date}.
Time: ${appt.time}.
Appointment Type: ${appt.type || 'Routine Checkup'}.
Current Status: ${appt.status}.
Appointment Doctor Notes: ${appt.notes || 'None'}.`;

    return {
        id: `${appt.patient}_appointment_${appt._id}`,
        text,
        metadata: {
            patientId: appt.patient.toString(),
            type: 'appointment',
            contentId: appt._id.toString()
        }
    };
}

function generateTaskDoc(patientName, task) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A';
    const text = `Daily Reminder/Task assigned to Patient: ${patientName}.
Task Title: ${task.title}.
Task Description: ${task.description || 'No extra description provided'}.
Category: ${task.category || 'Other'}.
Priority Level: ${task.priority || 'Medium'}.
Current Status: ${task.status || 'Pending'}.
Due Date and Time: ${dueDate}.`;

    return {
        id: `${task.patient}_task_${task._id}`,
        text,
        metadata: {
            patientId: task.patient.toString(),
            type: 'task',
            contentId: task._id.toString()
        }
    };
}

function generateChatDoc(patientName, chat) {
    const roleLabel = chat.role === 'user' ? 'Patient' : 'Assistant';
    const timeLabel = chat.createdAt ? new Date(chat.createdAt).toLocaleString() : 'N/A';
    const text = `Past conversation log for Patient: ${patientName}.
Role: ${roleLabel}.
Message statement: "${chat.message}".
Logged at time: ${timeLabel}.`;

    return {
        id: `${chat.patient}_chat_${chat._id}`,
        text,
        metadata: {
            patientId: chat.patient.toString(),
            type: 'chat',
            contentId: chat._id.toString()
        }
    };
}

/**
 * Helper to split long strings into overlapping semantic chunks
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text) return [];
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, i + chunkSize));
        i += (chunkSize - overlap);
        if (chunkSize <= overlap) break; // Prevent infinite loop
    }
    return chunks;
}

/**
 * Formats caregiver notes into a semantic chunk
 */
function generateCaregiverNoteDoc(patientName, note) {
    const dateStr = note.date ? new Date(note.date).toLocaleString() : 'N/A';
    const text = `Caregiver Observation/Note for Patient: ${patientName}.
Note content: "${note.note}".
Logged by Caregiver on: ${dateStr}.`;

    return {
        id: `${note.patient}_caregiver_note_${note._id}`,
        text,
        metadata: {
            patientId: note.patient.toString(),
            type: 'caregiver_note',
            contentId: note._id.toString()
        }
    };
}

/**
 * Formats medical reports and chunks their parsed PDF content
 */
function generateReportDoc(patientName, report) {
    const dateStr = report.date ? new Date(report.date).toLocaleDateString() : 'N/A';
    const baseHeader = `Medical Diagnostic Report for Patient: ${patientName}.
Report Title: "${report.title}".
Report Type: ${report.type || 'Diagnostic'}.
Report Priority: ${report.priority || 'Medium'}.
Date of Report: ${dateStr}.`;

    const extracted = (report.extractedText || '').trim();
    if (!extracted) {
        return [{
            id: `${report.patient}_report_${report._id}`,
            text: `${baseHeader}\nNo findings or text content extracted from this report.`,
            metadata: {
                patientId: report.patient.toString(),
                type: 'report',
                contentId: report._id.toString()
            }
        }];
    }

    const textChunks = chunkText(extracted, 1000, 200);
    return textChunks.map((chunk, idx) => ({
        id: `${report.patient}_report_${report._id}_chunk_${idx}`,
        text: `${baseHeader}\nReport Findings (Part ${idx + 1} of ${textChunks.length}):\n${chunk}`,
        metadata: {
            patientId: report.patient.toString(),
            type: 'report',
            contentId: report._id.toString()
        }
    }));
}

module.exports = {
    generateProfileDoc,
    generatePrescriptionDoc,
    generateAppointmentDoc,
    generateTaskDoc,
    generateChatDoc,
    generateCaregiverNoteDoc,
    generateReportDoc
};
