const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    medicineName: {
        type: String,
        required: true,
    },
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
    },
    dosage: {
        type: String,
        required: true,
    },
    frequency: {
        type: String,
        required: true,
    },
    instructions: {
        type: String,
        default: '',
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver',
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
}, { timestamps: true });

const { triggerReindex } = require('../utils/autoIndex');

prescriptionSchema.post('save', function(doc) {
    triggerReindex(doc.patient);
});

prescriptionSchema.post('remove', function(doc) {
    triggerReindex(doc.patient);
});

prescriptionSchema.post('deleteOne', { document: true, query: false }, function(doc) {
    triggerReindex(doc.patient);
});

prescriptionSchema.post('findOneAndDelete', function(doc) {
    if (doc) {
        triggerReindex(doc.patient);
    }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
