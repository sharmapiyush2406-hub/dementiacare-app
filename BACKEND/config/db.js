const mongoose = require('mongoose');
const dns = require('dns');

// ──────────────────────────────────────────────────────────────────────────────
// CRITICAL FIX — Windows DNS Stub Resolver Bug
// ──────────────────────────────────────────────────────────────────────────────
// Node.js (libuv) reads its DNS servers from the OS and gets "127.0.0.1"
// (Windows's DNS Client stub resolver). However, libuv communicates with DNS
// via raw UDP sockets and cannot reach the Windows loopback DNS stub the same
// way nslookup/Resolve-DnsName can (they use the Windows DNS API, not raw UDP).
// This causes: querySrv ECONNREFUSED _mongodb._tcp.cluster0.*.mongodb.net
// Fix: override the DNS servers list to point directly at Google Public DNS
// BEFORE mongoose.connect() is ever called. This applies to the entire process.
// ──────────────────────────────────────────────────────────────────────────────
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
    try {
        // Append DB name and recommended Atlas query params if not already present
        let uri = process.env.MONGO_URI;
        if (uri && !uri.includes('?')) {
            if (!uri.endsWith('/')) uri += '/';
            if (!uri.includes('dementiacare')) uri += 'dementiacare';
            uri += '?retryWrites=true&w=majority&appName=DementiaCare';
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
