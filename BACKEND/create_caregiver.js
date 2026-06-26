const mongoose = require('mongoose');
const User = require('./models/User');
const Caregiver = require('./models/Caregiver');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Validate that MONGO_URI is defined
if (!process.env.MONGO_URI) {
    console.error('\n❌ Error: MONGO_URI is not defined in the environment variables.');
    console.error('Please configure MONGO_URI in your BACKEND/.env file.\n');
    process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;

async function createCaregiver() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'caregiver@hc.com';
        const password = 'caregiver123';
        const role = 'caregiver';

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User already exists. Updating role and ensuring caregiver profile...');
            existing.role = 'caregiver';
            await existing.save();

            const caregiverProfile = await Caregiver.findOne({ user: existing._id });
            if (!caregiverProfile) {
                await Caregiver.create({ user: existing._id });
            }
            console.log('Updated existing user to Caregiver.');
        } else {
            const user = await User.create({
                email,
                password,
                role,
                firstName: 'Sandeep',
                lastName: 'Kumar',
            });
            await Caregiver.create({ user: user._id });
            console.log(`Caregiver created: ${email} / ${password}`);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

createCaregiver();
