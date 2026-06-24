const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // Reference to the patient this report belongs to
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    patientName: { type: String, default: '' }, // Denormalized for fast reads
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Assessment', 'Medication', 'Progress', 'Incident', 'Diagnostic'],
        default: 'Assessment',
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Completed', 'Pending', 'In Review'],
        default: 'Pending',
    },
    date: { type: Date, default: Date.now },
    filePath: { type: String, default: '' },
    extractedText: { type: String, default: '' },
}, { timestamps: true });

const { triggerReindex } = require('../utils/autoIndex');

reportSchema.post('save', function(doc) {
    triggerReindex(doc.patient);
});

reportSchema.post('remove', function(doc) {
    triggerReindex(doc.patient);
});

reportSchema.post('deleteOne', { document: true, query: false }, function(doc) {
    triggerReindex(doc.patient);
});

reportSchema.post('findOneAndDelete', function(doc) {
    if (doc) {
        triggerReindex(doc.patient);
    }
});

module.exports = mongoose.model('Report', reportSchema);
