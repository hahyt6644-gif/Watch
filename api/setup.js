import { MongoClient } from 'mongodb';

// Properly URL-encoded password
const MONGODB_URI = "mongodb+srv://videobot_admin:SVMT24NlLWZV1PdY@cluster0.ggemqlz.mongodb.net/video_bot?retryWrites=true&w=majority";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const results = {
    success: false,
    steps: [],
    error: null
  };

  let client;

  try {
    results.steps.push('Attempting to connect to MongoDB...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    results.steps.push('✅ Connected to MongoDB!');

    const db = client.db('video_bot');

    results.steps.push('Clearing old data...');
    await db.collection('ad_config').deleteMany({});
    await db.collection('videos').deleteMany({});
    results.steps.push('✅ Old data cleared');

    results.steps.push('Adding ad configuration...');
    await db.collection('ad_config').insertOne({
      block_id: "15810",
      ad_type: "reward",
      is_active: true
    });
    results.steps.push('✅ Ad config added');

    results.steps.push('Adding videos...');
    const videosInserted = await db.collection('videos').insertMany([
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
      },
      {
        video_id: "vid_3",
        video_url: "https://1024terabox.com/s/1F7WU19zIUjjYxDrc8uR1Qw",
        title: "Sexy College Girl Romance - Must Watch",
        created_at: new Date()
      }
    ]);
    results.steps.push('✅ ' + videosInserted.insertedCount + ' videos added');

    const videoCount = await db.collection('videos').countDocuments();
    const adConfigCount = await db.collection('ad_config').countDocuments();
    const allVideos = await db.collection('videos').find().toArray();
    const adConfig = await db.collection('ad_config').findOne();

    results.steps.push('✅ Found ' + videoCount + ' videos and ' + adConfigCount + ' ad configs');

    results.success = true;
    results.data = {
      videos: allVideos.map(v => ({
        video_id: v.video_id,
        title: v.title,
        url: v.video_url
      })),
      ad_config: adConfig,
      stats: {
        total_videos: videoCount,
        total_ad_configs: adConfigCount
      }
    };

    res.status(200).json(results);

  } catch (error) {
    results.error = error.message;
    results.steps.push('❌ Error: ' + error.message);
    res.status(500).json(results);
  } finally {
    if (client) {
      await client.close();
    }
  }
}
