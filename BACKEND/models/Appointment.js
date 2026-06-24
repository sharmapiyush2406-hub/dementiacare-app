const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
    doctorName: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Cancelled', 'Completed'],
        default: 'Upcoming',
    },
    type: {
        type: String,
        default: 'Routine Checkup',
    },
    notes: {
        type: String,
        default: '',
    },
}, { timestamps: true });

const { triggerReindex } = require('../utils/autoIndex');

appointmentSchema.post('save', function(doc) {
    triggerReindex(doc.patient);
});

appointmentSchema.post('remove', function(doc) {
    triggerReindex(doc.patient);
});

appointmentSchema.post('deleteOne', { document: true, query: false }, function(doc) {
    triggerReindex(doc.patient);
});

appointmentSchema.post('findOneAndDelete', function(doc) {
    if (doc) {
        triggerReindex(doc.patient);
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
