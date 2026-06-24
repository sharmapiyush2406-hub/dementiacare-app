const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Assigned patients (populated by admin)
    assignedPatients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
