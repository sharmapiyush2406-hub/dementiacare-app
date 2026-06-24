const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Patient = require('./models/Patient');
const Caregiver = require('./models/Caregiver');
const User = require('./models/User');

dotenv.config();

const checkIntegrity = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const patients = await Patient.find().populate('user');
        const caregivers = await Caregiver.find().populate('user');

        console.log(`Found ${patients.length} patients`);
        console.log(`Found ${caregivers.length} caregivers`);

        let issuesFound = false;

        patients.forEach(p => {
            if (!p.user) {
                console.log(`ISSUE: Patient ${p._id} has null user`);
                issuesFound = true;
            }
        });

        caregivers.forEach(c => {
            if (!c.user) {
                console.log(`ISSUE: Caregiver ${c._id} has null user`);
                issuesFound = true;
            }
        });

        if (!issuesFound) {
            console.log('No integrity issues found (all patients/caregivers have valid users).');
        } else {
            console.log('Integrity issues found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkIntegrity();
