// File: functions/api/upload.js
// Receives data uploaded by the client for upload speed testing.
// Accessed via /api/upload

// Handler for POST requests
export async function onRequestPost(context) {
  const { request } = context; // Get the request from the context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Or specify your frontend domain
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!request.body) {
    return new Response(JSON.stringify({ message: 'Request body is missing.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    let byteCount = 0;
    // Use the new way to get a reader from the request body if available,
    // or fall back to the older way for broader compatibility if needed.
    const reader = request.body.getReader();

    // Consume the stream to count the bytes.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break; // Stream finished.
      }
      if (value) {
        byteCount += value.length;
      }
    }
    
    return new Response(JSON.stringify({ message: 'Upload received successfully.', bytesReceived: byteCount }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error processing upload stream:', error);
    return new Response(JSON.stringify({ message: 'Failed to process upload stream.', error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handler for OPTIONS preflight requests
export async function onRequestOptions(context) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Or specify your frontend domain
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Add GET if you also have a GET handler
      'Access-Control-Allow-Headers': 'Content-Type', // Or be more specific if needed
    };
    return new Response(null, { headers: corsHeaders });
}

// If you need to handle other methods like GET for the same /api/upload path:
// export async function onRequestGet(context) {
//   // ... your GET logic ...
//   return new Response('This is GET /api/upload', { status: 200 });
// }

// A general handler if you want one function to handle all methods for this path
// export async function onRequest(context) {
//   if (context.request.method === "POST") {
//     return await onRequestPost(context);
//   }
//   if (context.request.method === "OPTIONS") {
//     return await onRequestOptions(context);
//   }
//   // Handle other methods or return 405
//   return new Response("Method not allowed", { status: 405 });
// }
