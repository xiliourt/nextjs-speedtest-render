import { Readable } from 'stream';
import crypto from 'crypto';

const DOWNLOAD_SIZE_MB = 10; // Size of data to send in MB
const BYTES_PER_MB = 1024 * 1024;
const TOTAL_BYTES = DOWNLOAD_SIZE_MB * BYTES_PER_MB;
const CHUNK_SIZE_BYTES = 128 * 1024; // 128KB chunks - adjust as needed

export default function handler(req, res) {
  if (req.method === 'GET') {
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
        
        // Push the chunk to the stream
        if (this.push(chunk)) {
          bytesSent += currentChunkSize;
        } else {
          // If push returns false, it means the internal buffer is full.
          // The stream will pause until it's consumed.
          // For this basic implementation, we continue adding bytesSent
          // as the piping mechanism handles backpressure.
          bytesSent += currentChunkSize;
        }
      }
    });

    // Pipe the readable stream to the response
    readableStream.pipe(res);

    // Handle client closing connection prematurely
    req.on('close', () => {
      readableStream.destroy();
      // console.log('Download stream destroyed due to client disconnect.');
    });

  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
