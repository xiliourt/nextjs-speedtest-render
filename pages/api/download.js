// speedtest-render/pages/api/download.js
// MODIFIED: Now accepts a 'size' query parameter to determine download size.
import { Readable } from 'stream';
import crypto from 'crypto';

const DEFAULT_DOWNLOAD_SIZE_MB = 10; // Default size if not specified or invalid
const MAX_DOWNLOAD_SIZE_MB = 500;   // A reasonable safety limit
const BYTES_PER_MB = 1024 * 1024;
const CHUNK_SIZE_BYTES = 128 * 1024;

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Determine download size from the query parameter
    let requestedSizeMB = parseInt(req.query.size, 10);

    // Validate the requested size, fallback to default if invalid
    if (isNaN(requestedSizeMB) || requestedSizeMB <= 0 || requestedSizeMB > MAX_DOWNLOAD_SIZE_MB) {
      requestedSizeMB = DEFAULT_DOWNLOAD_SIZE_MB;
    }
    
    const TOTAL_BYTES = requestedSizeMB * BYTES_PER_MB;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', TOTAL_BYTES.toString());
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let bytesSent = 0;

    const readableStream = new Readable({
      read() {
        if (bytesSent >= TOTAL_BYTES) {
          this.push(null); // Signal end of stream
          return;
        }
        
        const remainingBytes = TOTAL_BYTES - bytesSent;
        const currentChunkSize = Math.min(CHUNK_SIZE_BYTES, remainingBytes);
        
        // Generate random bytes for the chunk
        const chunk = crypto.randomBytes(currentChunkSize);
        
        if (this.push(chunk)) {
          bytesSent += currentChunkSize;
        } else {
          bytesSent += currentChunkSize;
        }
      }
    });

    readableStream.pipe(res);

    req.on('close', () => {
      readableStream.destroy();
    });

  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
