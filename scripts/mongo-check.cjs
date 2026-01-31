const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('<db_username>')) {
  console.error('❌ Error: MONGODB_URI is not correctly configured in .env');
  console.log('Please update your .env file with your actual MongoDB username and password.');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("goodness").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    const dbName = process.env.VITE_MONGODB_DATABASE || 'stackflow';
    const db = client.db(dbName);
    console.log(`📂 Using database: ${dbName}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
