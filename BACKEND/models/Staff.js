const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['Doctor', 'Nurse', 'Psychologist', 'Psychiatric Social Worker'],
        required: true,
    },
    designation: { type: String, default: '' },
    department: { type: String, default: '' },
    license: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '', unique: true },
    experience: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Active', 'On Leave'],
        default: 'Active',
    },
    avatar: { type: String, default: '👤' },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
