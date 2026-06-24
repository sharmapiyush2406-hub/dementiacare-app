const Patient = require('../models/Patient');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Task = require('../models/Task');
const Chat = require('../models/Chat');
const CaregiverNote = require('../models/CaregiverNote');
const Report = require('../models/Report');
const { getEmbedding } = require('../utils/embeddings');
const { index } = require('../utils/pinecone');
const {
    generateProfileDoc,
    generatePrescriptionDoc,
    generateAppointmentDoc,
    generateTaskDoc,
    generateChatDoc,
    generateCaregiverNoteDoc,
    generateReportDoc
} = require('./documentService');

/**
 * Indexes all data for a single patient in Pinecone.
 * Generates semantic chunks, computes embeddings via Gemini, and upserts to Pinecone.
 * @param {string} patientId - MongoDB Patient ID
 * @returns {Promise<number>} Number of vectors created and upserted
 */
async function indexPatient(patientId) {
    try {
        const patient = await Patient.findById(patientId).populate({ path: 'user', select: 'email' });
        if (!patient) {
            throw new Error(`Patient not found: ${patientId}`);
        }

        const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';

        // Fetch all patient items
        const prescriptions = await Prescription.find({ patient: patientId });
        const appointments = await Appointment.find({ patient: patientId });
        // Retrieve non-deleted tasks
        const tasks = await Task.find({ patient: patientId });
        const chats = await Chat.find({ patient: patientId });
        const caregiverNotes = await CaregiverNote.find({ patient: patientId });
        const reports = await Report.find({ patient: patientId });

        // 1. Generate text documents
        const docs = [];
        docs.push(generateProfileDoc(patient));

        prescriptions.forEach(rx => {
            docs.push(generatePrescriptionDoc(patientName, rx));
        });

        appointments.forEach(appt => {
            docs.push(generateAppointmentDoc(patientName, appt));
        });

        tasks.forEach(task => {
            docs.push(generateTaskDoc(patientName, task));
        });

        chats.forEach(chat => {
            docs.push(generateChatDoc(patientName, chat));
        });

        caregiverNotes.forEach(note => {
            docs.push(generateCaregiverNoteDoc(patientName, note));
        });

        reports.forEach(report => {
            const reportChunks = generateReportDoc(patientName, report);
            docs.push(...reportChunks);
        });

        console.log(`Generated ${docs.length} document chunks for patient ${patientName} (${patientId}). Generating embeddings...`);

        // 2. Compute embeddings and map to Pinecone vector objects
        const vectors = [];
        
        // Generate embeddings sequentially to avoid Gemini API rate limits
        for (const doc of docs) {
            try {
                const values = await getEmbedding(doc.text);
                vectors.push({
                    id: doc.id,
                    values: values,
                    metadata: {
                        patientId: doc.metadata.patientId,
                        type: doc.metadata.type,
                        contentId: doc.metadata.contentId,
                        text: doc.text
                    }
                });
            } catch (err) {
                console.error(`Skipping doc ${doc.id} due to embedding generation failure:`, err.message);
            }
        }

        // 3. Upsert to Pinecone index
        if (vectors.length > 0) {
            // Pinecone upsert takes array of objects: { id, values, metadata }
            await index.upsert(vectors);
            console.log(`Successfully upserted ${vectors.length} vectors to Pinecone for patient ${patientName}.`);
        }

        return vectors.length;
    } catch (error) {
        console.error(`Error indexing patient ${patientId}:`, error.message);
        throw error;
    }
}

/**
 * Clears old vectors for a patient and re-indexes their records.
 * @param {string} patientId - MongoDB Patient ID
 * @returns {Promise<number>} Number of vectors created
 */
async function reindexPatient(patientId) {
    try {
        console.log(`Clearing existing Pinecone index vectors for patient ${patientId}...`);
        
        // Delete all vectors matching patientId metadata property
        try {
            await index.deleteMany({
                filter: { patientId: { $eq: patientId.toString() } }
            });
        } catch (delError) {
            // Pinecone index might be empty, ignore delete failures in this context
            console.warn(`Pinecone delete stats warning for patient ${patientId}:`, delError.message);
        }

        // Generate and upsert new vectors
        return await indexPatient(patientId);
    } catch (error) {
        console.error(`Error re-indexing patient ${patientId}:`, error.message);
        throw error;
    }
}

/**
 * Re-indexes all patients stored in MongoDB.
 * @returns {Promise<{patientsIndexedCount: number, totalVectorsCreated: number}>} Results summary
 */
async function reindexAllPatients() {
    try {
        const patients = await Patient.find({});
        console.log(`Re-indexing all ${patients.length} patients in Pinecone...`);

        let patientsIndexedCount = 0;
        let totalVectorsCreated = 0;

        for (const patient of patients) {
            try {
                const count = await reindexPatient(patient._id);
                patientsIndexedCount++;
                totalVectorsCreated += count;
            } catch (pErr) {
                console.error(`Failed to re-index patient ${patient._id}:`, pErr.message);
            }
        }

        return {
            patientsIndexedCount,
            totalVectorsCreated
        };
    } catch (error) {
        console.error('Error re-indexing all patients:', error.message);
        throw error;
    }
}

module.exports = {
    indexPatient,
    reindexPatient,
    reindexAllPatients
};
