
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });
console.log("MONGO_URI =", process.env.MONGO_URI);

const connectDB = async () => {
    // Validate that MONGO_URI is defined
    if (!process.env.MONGO_URI) {
        console.error('\n❌ Error: MONGO_URI is not defined in the environment variables.');
        console.error('Please configure MONGO_URI in your BACKEND/.env file.\n');
        process.exit(1);
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const checkUsers = async () => {
    await connectDB();
    try {
        const users = await User.find({});
        console.log('Users found:', users.length);
        if (users.length > 0) {
            users.forEach(user => {
                console.log(`Email: ${user.email}, Role: ${user.role}, Password (hashed): ${user.password.substring(0, 10)}...`);
            });
        } else {
            console.log('No users found in database.');
        }
    } catch (err) {
        console.error(err);
    }
    process.exit();
};

checkUsers();
