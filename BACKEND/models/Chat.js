const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },

        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        message: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const { triggerReindex } = require('../utils/autoIndex');

chatSchema.post('save', function(doc) {
    triggerReindex(doc.patient);
});

module.exports = mongoose.model("Chat", chatSchema);