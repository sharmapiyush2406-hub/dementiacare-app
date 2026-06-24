const mongoose = require('mongoose');

const caregiverNoteSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    note: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const { triggerReindex } = require('../utils/autoIndex');

caregiverNoteSchema.post('save', function(doc) {
    triggerReindex(doc.patient);
});

caregiverNoteSchema.post('remove', function(doc) {
    triggerReindex(doc.patient);
});

caregiverNoteSchema.post('deleteOne', { document: true, query: false }, function(doc) {
    triggerReindex(doc.patient);
});

caregiverNoteSchema.post('findOneAndDelete', function(doc) {
    if (doc) {
        triggerReindex(doc.patient);
    }
});

module.exports = mongoose.model('CaregiverNote', caregiverNoteSchema);
