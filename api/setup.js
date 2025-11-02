import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://videobot_admin:SVMT24NlLWZV1PdY@cluster0.ggemqlz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected!");

    await client.db('admin').command({ ping: 1 });
    console.log("✅ Ping successful!");

    const db = client.db('video_bot');
    await db.collection('test').insertOne({ test: true, timestamp: new Date() });
    console.log("✅ Write successful!");
    const doc = await db.collection('test').findOne({ test: true });
    console.log("✅ Read successful!", doc);

    await client.close();
    console.log("✅ All done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
