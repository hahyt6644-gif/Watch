import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://amitkr545545_db_user:05jVaRYWKUvlyGK2@cluster0.ggemqlz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testAndAddData() {
  const client = new MongoClient(uri);

  try {
    // Connect
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db('video_bot');

    // Add ad config
    await db.collection('ad_config').insertOne({
      block_id: "15810",
      ad_type: "reward",
      is_active: true
    });
    console.log("✅ Ad config added!");

    // Add videos
    await db.collection('videos').insertMany([
      {
        video_id: "vid_1",
        video_url: "https://teraboxurl.com/s/1oAxQ_HGVC1zkj_1qJAsc9g",
        title: "Garam Bhabhi Secret Video - Viral Video",
        created_at: new Date()
      },
      {
        video_id: "vid_2",
        video_url: "https://1024terabox.com/s/1Y-ZF-Rn4XFsvtjqUQ9iQ8A",
        title: "Hot Desi Girl Private Moment - HD Video",
        created_at: new Date()
      }
    ]);
    console.log("✅ Videos added!");

    // Check data
    const videoCount = await db.collection('videos').countDocuments();
    console.log(`✅ Total videos: ${videoCount}`);

    const adConfig = await db.collection('ad_config').findOne({});
    console.log("✅ Ad config:", adConfig);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

testAndAddData();