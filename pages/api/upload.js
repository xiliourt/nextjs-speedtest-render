export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to handle the stream
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let receivedBytes = 0;
    try {
      await new Promise((resolve, reject) => {
        req.on('data', (chunk) => {
          receivedBytes += chunk.length;
        });
        req.on('end', () => {
          resolve();
        });
        req.on('error', (err) => {
          console.error('Upload stream error:', err);
          reject(err);
        });
      });
      res.status(200).json({ message: 'Upload successful', receivedBytes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process upload stream.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
