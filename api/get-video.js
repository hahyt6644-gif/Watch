import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const TERABOX_COOKIE = process.env.TERABOX_COOKIE;
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
    
    const video = await db.collection('videos').findOne({ video_id });
    
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    const videoUrl = video.video_url;

    // Check if Terabox link
    if (videoUrl.includes('terabox.com') || videoUrl.includes('1024terabox.com')) {
      // Call TeraSnap API
      const response = await fetch('https://terasnap.netlify.app/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: videoUrl,
          cookies: TERABOX_COOKIE
        })
      });

      const data = await response.json();

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        video: {
          video_url: data.proxy_url,
          title: video.title,
          thumbnail: data.thumbnail || null,
          file_size: data.file_size || null
        }
      });
    } else {
      // Direct video link
      return res.status(200).json({
        success: true,
        video: {
          video_url: videoUrl,
          title: video.title
        }
      });
    }

  } catch (error) {
    console.error('Get video error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
