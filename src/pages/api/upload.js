// File: functions/api/download.js
// Streams a configurable amount of data for download speed testing.
// Accessed via /api/download?size=<bytes>

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const requestedSize = url.searchParams.get('size');

  // --- Configuration ---
  // Default size if no 'size' parameter is provided or if it's invalid
  const DEFAULT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  const MIN_FILE_SIZE_BYTES = 1 * 1024; // 1 KB
  const MAX_FILE_SIZE_BYTES = 1000 * 1024 * 1024; // 50 MB (Adjust as needed for your limits)

  let fileSize = DEFAULT_FILE_SIZE_BYTES;

  if (requestedSize) {
    const parsedSize = parseInt(requestedSize, 10);
    if (!isNaN(parsedSize) && parsedSize >= MIN_FILE_SIZE_BYTES && parsedSize <= MAX_FILE_SIZE_BYTES) {
      fileSize = parsedSize;
    } else {
      // Optionally, you could return an error for invalid size parameter
      // For now, it falls back to default.
      console.log(`Invalid or out-of-range size parameter received: ${requestedSize}. Using default size.`);
    }
  }

  // --- End Configuration ---

  let bytesSent = 0;
  const chunkSize = 64 * 1024; // 64KB

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Or specify your frontend domain
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const readableStream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= fileSize) {
        controller.close();
        return;
      }
      const bytesToSend = Math.min(chunkSize, fileSize - bytesSent);
      const chunk = new Uint8Array(bytesToSend);
      // Fill the chunk with some dummy data (e.g., character 'a')
      for (let i = 0; i < bytesToSend; i++) {
        chunk[i] = 97; // ASCII for 'a'
      }
      controller.enqueue(chunk);
      bytesSent += bytesToSend;
    },
    cancel(reason) {
      console.log('Download stream cancelled:', reason);
    }
  });

  return new Response(readableStream, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize.toString(), // Crucial: Reflects the actual size being sent
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}

export async function onRequestOptions(context) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Or specify your frontend domain
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(null, { headers: corsHeaders });
}
