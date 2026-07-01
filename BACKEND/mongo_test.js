require('dotenv').config();

const { MongoClient } = require('mongodb');

(async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log("✅ Connected");
    await client.close();
  } catch (err) {
    console.error(err);
  }
})();