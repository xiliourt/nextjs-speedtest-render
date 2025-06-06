import Head from 'next/head';
import { useState, useCallback } from 'react';

// Configuration for tests
const PING_ITERATIONS = 5;
const UPLOAD_SIZE_MB = 5; // Megabytes
const UPLOAD_SIZE_BYTES = UPLOAD_SIZE_MB * 1024 * 1024;
// This constant is for display on the button/footer.
// The actual download size is controlled by `/api/download.js`.
const DOWNLOAD_SIZE_MB = 10; 

export default function HomePage() {
  const [ping, setPing] = useState('-');
  const [downloadSpeed, setDownloadSpeed] = useState('-');
  const [uploadSpeed, setUploadSpeed] = useState('-');

  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingDownload, setIsTestingDownload] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const resetResults = () => {
    setPing('-');
    setDownloadSpeed('-');
    setUploadSpeed('-');
    setErrorMessage('');
  };

  const measurePing = useCallback(async () => {
    if (isTestingPing) return;
    setIsTestingPing(true);
    setPing('Testing...');
    setErrorMessage('');

    let totalLatency = 0;
    let successfulPings = 0;

    for (let i = 0; i < PING_ITERATIONS; i++) {
      const startTime = performance.now();
      try {
        // Adding a cache-busting query parameter
        const response = await fetch(`/api/ping?r=${Math.random()}&ts=${Date.now()}`);
        if (!response.ok) {
          console.error(`Ping attempt ${i + 1} failed: ${response.statusText}`);
          continue; 
        }
        await response.json(); // Ensure body is read and connection closes
        const endTime = performance.now();
        totalLatency += (endTime - startTime);
        successfulPings++;
      } catch (error) {
        console.error(`Ping attempt ${i + 1} error:`, error);
        // If a ping fails, we skip it for average calculation
      }
      // Small delay between pings to avoid overwhelming the server/network
      if (i < PING_ITERATIONS - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    if (successfulPings > 0) {
      const avgLatency = totalLatency / successfulPings;
      setPing(`${avgLatency.toFixed(2)} ms`);
    } else {
      setPing('Error');
      setErrorMessage('Ping test failed. Check network or server.');
    }
    setIsTestingPing(false);
  }, [isTestingPing]);

  const measureDownloadSpeed = useCallback(async () => {
    if (isTestingDownload) return;
    setIsTestingDownload(true);
    setDownloadSpeed('Testing...');
    setErrorMessage('');

    const startTime = performance.now();
    let receivedBytes = 0;

    try {
      // Adding a cache-busting query parameter
      const response = await fetch(`/api/download?r=${Math.random()}&ts=${Date.now()}`);
      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.length;
         // Optional: Update UI with progress here if needed
      }
      
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;

      if (durationSeconds === 0 || receivedBytes === 0) {
        setDownloadSpeed('Error');
        setErrorMessage('Download test resulted in zero duration or data.');
        setIsTestingDownload(false);
        return;
      }
      
      // Speed in Mbps
      const speedMbps = (receivedBytes * 8) / (durationSeconds * 1000 * 1000);
      setDownloadSpeed(`${speedMbps.toFixed(2)} Mbps`);

    } catch (error) {
      console.error("Download test error:", error);
      setDownloadSpeed('Error');
      setErrorMessage(`Download test failed: ${error.message}`);
    } finally {
      setIsTestingDownload(false);
    }
  }, [isTestingDownload]);


  const measureUploadSpeed = useCallback(async () => {
    if (isTestingUpload) return;
    setIsTestingUpload(true);
    setUploadSpeed('Testing...');
    setErrorMessage('');

    try {
      // Generate random data on the client side
      // Using Uint8Array is more memory efficient for large data
      const data = new Uint8Array(UPLOAD_SIZE_BYTES);
      // A simple way to fill buffer with some data. For truly random, use crypto.getRandomValues if available in browser context for service workers/secure contexts.
      // For this purpose, pseudo-random is fine.
      for (let i = 0; i < UPLOAD_SIZE_BYTES; i++) {
        data[i] = Math.floor(Math.random() * 256);
      }
      const blob = new Blob([data]);

      const startTime = performance.now();
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: blob,
        // 'Content-Type' will be set automatically by browser for Blob
        // Or you can set: headers: { 'Content-Type': 'application/octet-stream' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown upload error reason' }));
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }
      
      await response.json(); // Ensure we read the server's response
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;

      if (durationSeconds === 0) {
        setUploadSpeed('Error');
        setErrorMessage('Upload test resulted in zero duration.');
        setIsTestingUpload(false);
        return;
      }

      // Speed in Mbps
      const speedMbps = (UPLOAD_SIZE_BYTES * 8) / (durationSeconds * 1000 * 1000);
      setUploadSpeed(`${speedMbps.toFixed(2)} Mbps`);

    } catch (error) {
      console.error("Upload test error:", error);
      setUploadSpeed('Error');
      setErrorMessage(`Upload test failed: ${error.message}`);
    } finally {
      setIsTestingUpload(false);
    }
  }, [isTestingUpload]);

  const runAllTests = async () => {
    if (isTestingPing || isTestingDownload || isTestingUpload) return;
    resetResults();
    await measurePing();
    // Only proceed if ping was successful or not in error state (basic check)
    if (ping !== 'Error' && ping !== 'Testing...') { // This check relies on state, which might not update immediately after await.
        await measureDownloadSpeed();
    } else if (ping === 'Error') { // Check if ping itself resulted in an error.
        setDownloadSpeed('Skipped');
        // Set a general error message if ping failed, or let ping's own error message persist.
        if (!errorMessage) setErrorMessage("Download skipped due to ping error.");
    }

    // Similar check for download before running upload
    if (downloadSpeed !== 'Error' && downloadSpeed !== 'Testing...' && downloadSpeed !== 'Skipped') {
        await measureUploadSpeed();
    } else if (downloadSpeed === 'Error' || downloadSpeed === 'Skipped') {
        setUploadSpeed('Skipped');
        if (!errorMessage && (downloadSpeed === 'Error' || downloadSpeed === 'Skipped')) setErrorMessage("Upload skipped due to download error/skip.");
    }
  };
  
  const getButtonClass = (isLoading) => 
    `px-6 py-3 rounded-lg font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50
    ${isLoading 
      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
      : 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white focus:ring-sky-400'
    }`;
  
  const getResultClass = (value) => {
    if (value === 'Testing...') return 'text-yellow-400 animate-pulseSlow';
    if (value === 'Error' || value === 'Skipped') return 'text-red-400';
    if (value === '-') return 'text-gray-400';
    return 'text-green-400';
  }

  return (
    <>
      <Head>
        <title>Next.js Speed Test</title>
        <meta name="description" content="Self-hosted speed test application with Next.js" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-gray-800 shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-2xl">
          <header className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">
              Speed Test
            </h1>
            <p className="text-gray-400 mt-2">
              Test your connection speed to this server.
            </p>
          </header>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-700 bg-opacity-50 text-red-300 rounded-lg text-sm">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
            <div className="bg-gray-700 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-sky-300 mb-1">Ping</h2>
              <p className={`text-3xl font-bold ${getResultClass(ping)}`}>{ping}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-sky-300 mb-1">Download</h2>
              <p className={`text-3xl font-bold ${getResultClass(downloadSpeed)}`}>{downloadSpeed}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-sky-300 mb-1">Upload</h2>
              <p className={`text-3xl font-bold ${getResultClass(uploadSpeed)}`}>{uploadSpeed}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={measurePing}
              disabled={isTestingPing || isTestingDownload || isTestingUpload}
              className={getButtonClass(isTestingPing)}
            >
              {isTestingPing ? 'Pinging...' : 'Test Ping'}
            </button>
            <button
              onClick={measureDownloadSpeed}
              disabled={isTestingPing || isTestingDownload || isTestingUpload}
              className={getButtonClass(isTestingDownload)}
            >
              {isTestingDownload ? 'Downloading...' : `Test Download (${DOWNLOAD_SIZE_MB}MB)`}
            </button>
            <button
              onClick={measureUploadSpeed}
              disabled={isTestingPing || isTestingDownload || isTestingUpload}
              className={getButtonClass(isTestingUpload)}
            >
              {isTestingUpload ? 'Uploading...' : `Test Upload (${UPLOAD_SIZE_MB}MB)`}
            </button>
            <button
              onClick={runAllTests}
              disabled={isTestingPing || isTestingDownload || isTestingUpload}
              className={`${getButtonClass(isTestingPing || isTestingDownload || isTestingUpload)} bg-green-500 hover:bg-green-600 active:bg-green-700 focus:ring-green-400`}
            >
              { (isTestingPing || isTestingDownload || isTestingUpload) ? 'Testing All...' : 'Test All'}
            </button>
          </div>
          <div className="text-center">
            <button
                onClick={resetResults}
                disabled={isTestingPing || isTestingDownload || isTestingUpload}
                className="text-sm text-gray-500 hover:text-sky-400 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
            >
                Reset Results
            </button>
          </div>

          <footer className="mt-10 text-center text-xs text-gray-500">
            <p>Download test sends {DOWNLOAD_SIZE_MB}MB from server. Upload test sends {UPLOAD_SIZE_MB}MB from client.</p>
            <p>Results may vary based on network conditions and server load.</p>
            <p>Built with Next.js & Tailwind CSS.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
