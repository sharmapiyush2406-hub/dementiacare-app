const User = require('../models/User');
const Caregiver = require('../models/Caregiver');

const ensureDefaultCaregiver = async () => {
    try {
        const email = 'caregiver@hc.com';
        const caregiverExists = await User.findOne({ email });

        if (!caregiverExists) {
            console.log('🌱 Creating default caregiver account...');
            const user = await User.create({
                email: email,
                password: 'caregiver123',
                role: 'caregiver',
                firstName: 'Default',
                lastName: 'Caregiver'
            });

            await Caregiver.create({ user: user._id });
            console.log('✅ Default caregiver created: caregiver@hc.com / caregiver123');
        }
    } catch (error) {
        console.error('❌ Auto-seed error:', error.message);
    }
};

module.exports = ensureDefaultCaregiver;
