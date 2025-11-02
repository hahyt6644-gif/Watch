import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const results = {
    success: false,
    steps: [],
    error: null
  };

  let client;

  try {
    // Step 1: Test connection
    results.steps.push('Attempting to connect to MongoDB...');
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    results.steps.push('✅ Connected to MongoDB!');

    const db = client.db('video_bot');

    // Step 2: Clear old data (optional)
    results.steps.push('Clearing old data...');
    await db.collection('ad_config').deleteMany({});
    await db.collection('videos').deleteMany({});
    results.steps.push('✅ Old data cleared');

    // Step 3: Add ad config
    results.steps.push('Adding ad configuration...');
    await db.collection('ad_config').insertOne({
      block_id: "15810",
      ad_type: "reward",
      is_active: true
    });
    results.steps.push('✅ Ad config added');

    // Step 4: Add videos
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
    results.steps.push(`✅ ${videosInserted.insertedCount} videos added`);

    // Step 5: Verify data
    results.steps.push('Verifying data...');
    const videoCount = await db.collection('videos').countDocuments();
    const adConfigCount = await db.collection('ad_config').countDocuments();
    
    const allVideos = await db.collection('videos').find().toArray();
    const adConfig = await db.collection('ad_config').findOne();

    results.steps.push(`✅ Found ${videoCount} videos and ${adConfigCount} ad configs`);

    // Success response
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
    results.steps.push(`❌ Error: ${error.message}`);
    
    res.status(500).json(results);
  } finally {
    if (client) {
      await client.close();
    }
  }
}
