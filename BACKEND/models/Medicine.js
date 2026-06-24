const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    generic: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Antipsychotic', 'Antidepressant', 'Mood Stabiliser', 'Benzodiazepine', 'Hypnotic', 'Anti-Dementia'],
    },
    schedule: {
        type: String,
        required: true,
    },
    dosage: {
        type: String,
        required: true,
    },
    indication: {
        type: String,
        required: true,
    },
    // true = requires special licence (Schedule H1 / Schedule X)
    licensed: {
        type: Boolean,
        default: false,
    },
    form: {
        type: String,
        required: true,
    },
    monitor: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
