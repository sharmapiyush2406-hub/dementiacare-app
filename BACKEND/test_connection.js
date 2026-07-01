const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); // Fix: Windows loopback DNS stub not reachable from Node libuv

const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  console.log(process.version);
  console.log(process.env.MONGO_URI);

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("CONNECTED");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();