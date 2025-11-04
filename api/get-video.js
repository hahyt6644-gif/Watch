import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://videobot_admin:SVMT24NlLWZV1PdY@cluster0.ggemqlz.mongodb.net/video_bot?retryWrites=true&w=majority";

// Get fresh NDUS cookie from your Terabox account
const TERABOX_COOKIE = " ndus=YQvEpgEteHui67i_O9F6k9TN_c5LVBAv51DyX-tw";

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

    // Check if it's a Terabox link that needs processing
    if (videoUrl.includes('terabox.com') || videoUrl.includes('1024terabox.com') || videoUrl.includes('teraboxurl.com')) {
      
      console.log('Processing Terabox link:', videoUrl);
      
      // Call TeraSnap API to get direct/proxy video URL
      const terasnapResponse = await fetch('https://terasnap.netlify.app/api/download', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          link: videoUrl,
          cookies: TERABOX_COOKIE
        })
      });

      if (!terasnapResponse.ok) {
        console.error('TeraSnap API error:', terasnapResponse.status);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to process Terabox link. Status: ' + terasnapResponse.status 
        });
      }

      const terasnapData = await terasnapResponse.json();
      
      console.log('TeraSnap response:', terasnapData);

      if (terasnapData.error) {
        return res.status(500).json({ 
          success: false, 
          error: 'TeraSnap error: ' + terasnapData.error 
        });
      }

      // Return the proxied video URL
      return res.status(200).json({
        success: true,
        video: {
          video_url: terasnapData.proxy_url || terasnapData.direct_url,
          title: video.title,
          thumbnail: terasnapData.thumbnail || null,
          file_size: terasnapData.file_size || null
        }
      });
      
    } else {
      // Direct video link (MP4, etc.)
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
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
