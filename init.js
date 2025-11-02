import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { video_id } = req.query;

  if (!video_id) {
    return res.status(400).json({ success: false, error: 'Video ID missing' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('video_bot');
    
    // Get video info
    const video = await db.collection('videos').findOne({ video_id });
    
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Get ad config
    const adConfig = await db.collection('ad_config').findOne({ is_active: true });
    
    if (!adConfig) {
      return res.status(404).json({ success: false, error: 'Ad configuration missing' });
    }

    return res.status(200).json({
      success: true,
      blockId: adConfig.block_id,
      video: {
        title: video.title
      }
    });

  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}