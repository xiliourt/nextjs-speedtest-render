// speedtest-render/pages/api/ping.js
// API route for PING test
// This endpoint simply returns a success message.
// The client measures the round-trip time.

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).json({ message: 'pong' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
