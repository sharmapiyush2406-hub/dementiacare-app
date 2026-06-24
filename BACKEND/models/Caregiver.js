const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedPatients: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
        },
    ],
});

module.exports = mongoose.model('Caregiver', caregiverSchema);
