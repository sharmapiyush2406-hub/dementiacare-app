const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
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
