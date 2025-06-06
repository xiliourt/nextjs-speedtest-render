// speedtest-render/pages/index.js
// MODIFIED: Logic added to offer larger download tests based on performance.
import Head from 'next/head';
import { useState, useCallback } from 'react';

// Configuration for tests
const PING_ITERATIONS = 5;
const UPLOAD_SIZE_MB = 5;
const UPLOAD_SIZE_BYTES = UPLOAD_SIZE_MB * 1024 * 1024;
const INITIAL_DOWNLOAD_SIZE_MB = 10; 

export default function HomePage() {
  const [ping, setPing] = useState('-');
  const [downloadSpeed, setDownloadSpeed] = useState('-');
  const [uploadSpeed, setUploadSpeed] = useState('-');

  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingDownload, setIsTestingDownload] = useState(false);
  const [isTestingUpload, setIsTestingUpload] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  
  // State to hold the size for an optional larger download test
  const [largeTestSize, setLargeTestSize] = useState(null);

  const resetResults = () => {
    setPing('-');
    setDownloadSpeed('-');
    setUploadSpeed('-');
    setErrorMessage('');
    setLargeTestSize(null); // Also reset the large test option
  };

  const measureDownloadSpeed = useCallback(async (sizeMB = INITIAL_DOWNLOAD_SIZE_MB) => {
    if (isTestingDownload) return;
    setIsTestingDownload(true);
    setDownloadSpeed('Testing...');
    setErrorMessage('');

    // If this is an initial test, clear any previous large test options
    if (sizeMB === INITIAL_DOWNLOAD_SIZE_MB) {
        setLargeTestSize(null);
    }
    
    const startTime = performance.now();
    let receivedBytes = 0;

    try {
      const response = await fetch(`/api/download?size=${sizeMB}&r=${Math.random()}&ts=${Date.now()}`);
      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.length;
      }
      
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;

      if (durationSeconds === 0 || receivedBytes === 0) {
        setDownloadSpeed('Error');
        setErrorMessage('Download test resulted in zero duration or data.');
        setIsTestingDownload(false);
        return;
      }
      
      const speedMbps = (receivedBytes * 8) / (durationSeconds * 1000 * 1000);
      setDownloadSpeed(`${speedMbps.toFixed(2)} Mbps`);

      // After an initial test, check if we should offer a larger test
      if (sizeMB === INITIAL_DOWNLOAD_SIZE_MB) {
        if (speedMbps > 250) {
          setLargeTestSize(250);
        } else if (speedMbps > 100) {
          setLargeTestSize(50);
        } else {
          setLargeTestSize(null); // Clear if speed is low
        }
      }

    } catch (error) {
      console.error("Download test error:", error);
      setDownloadSpeed('Error');
      setErrorMessage(`Download test failed: ${error.message}`);
    } finally {
      setIsTestingDownload(false);
    }
  }, [isTestingDownload]);

  const measurePing = useCallback(async () => {
    // This function remains the same as before.
    if (isTestingPing) return;
    setIsTestingPing(true);
    setPing('Testing...');
    setErrorMessage('');
    let totalLatency = 0;
    let successfulPings = 0;
    for (let i = 0; i < PING_ITERATIONS; i++) {
      const startTime = performance.now();
      try {
        const response = await fetch(`/api/ping?r=${Math.random()}&ts=${Date.now()}`);
        if (!response.ok) continue; 
        await response.json();
        const endTime = performance.now();
        totalLatency += (endTime - startTime);
        successfulPings++;
      } catch (error) {
        console.error(`Ping attempt ${i + 1} error:`, error);
      }
      if (i < PING_ITERATIONS - 1) await new Promise(resolve => setTimeout(resolve, 300));
    }
    if (successfulPings > 0) setPing(`${(totalLatency / successfulPings).toFixed(2)} ms`);
    else {
      setPing('Error');
      setErrorMessage('Ping test failed. Check network or server.');
    }
    setIsTestingPing(false);
  }, [isTestingPing]);

  const measureUploadSpeed = useCallback(async () => {
    // This function remains the same as before.
    if (isTestingUpload) return;
    setIsTestingUpload(true);
    setUploadSpeed('Testing...');
    setErrorMessage('');
    try {
      const data = new Uint8Array(UPLOAD_SIZE_BYTES);
      for (let i = 0; i < UPLOAD_SIZE_BYTES; i++) data[i] = Math.floor(Math.random() * 256);
      const blob = new Blob([data]);
      const startTime = performance.now();
      const response = await fetch('/api/upload', { method: 'POST', body: blob });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown upload error' }));
        throw new Error(`Server error: ${response.status} - ${errorData.error}`);
      }
      await response.json();
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;
      if (durationSeconds === 0) {
        setUploadSpeed('Error');
        setErrorMessage('Upload test resulted in zero duration.');
        setIsTestingUpload(false);
        return;
      }
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
    await measureDownloadSpeed();
    await measureUploadSpeed();
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

  const anyTestRunning = isTestingPing || isTestingDownload || isTestingUpload;

  return (
    <>
      <Head>
        <title>Next.js Speed Test</title>
        <meta name="description" content="Self-hosted speed test application with Next.js" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </Head>
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-gray-800 shadow-2xl rounded-xl p-6 sm:p-10 w-full max-w-2xl">
          <header className="mb-8 text-center"><h1 className="text-4xl sm:text-5xl font-bold text-sky-400">Speed Test</h1><p className="text-gray-400 mt-2">Test your connection speed to this server.</p></header>
          {errorMessage && (<div className="mb-6 p-4 bg-red-700 bg-opacity-50 text-red-300 rounded-lg text-sm"><strong>Error:</strong> {errorMessage}</div>)}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
            <div className="bg-gray-700 p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-sky-300 mb-1">Ping</h2><p className={`text-3xl font-bold ${getResultClass(ping)}`}>{ping}</p></div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-sky-300 mb-1">Download</h2><p className={`text-3xl font-bold ${getResultClass(downloadSpeed)}`}>{downloadSpeed}</p></div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold text-sky-300 mb-1">Upload</h2><p className={`text-3xl font-bold ${getResultClass(uploadSpeed)}`}>{uploadSpeed}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button onClick={measurePing} disabled={anyTestRunning} className={getButtonClass(isTestingPing)}>{isTestingPing ? 'Pinging...' : 'Test Ping'}</button>
            <button onClick={() => measureDownloadSpeed()} disabled={anyTestRunning} className={getButtonClass(isTestingDownload)}>{isTestingDownload ? 'Downloading...' : `Test Download (${INITIAL_DOWNLOAD_SIZE_MB}MB)`}</button>
            <button onClick={measureUploadSpeed} disabled={anyTestRunning} className={getButtonClass(isTestingUpload)}>{isTestingUpload ? 'Uploading...' : `Test Upload (${UPLOAD_SIZE_MB}MB)`}</button>
            <button onClick={runAllTests} disabled={anyTestRunning} className={`${getButtonClass(anyTestRunning)} bg-green-500 hover:bg-green-600 active:bg-green-700 focus:ring-green-400`}>{anyTestRunning ? 'Testing All...' : 'Test All'}</button>
          </div>
          <div className="text-center">
            <button onClick={resetResults} disabled={anyTestRunning} className="text-sm text-gray-500 hover:text-sky-400 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed">Reset Results</button>
          </div>
          {largeTestSize && !anyTestRunning && (
            <div className="mt-8 text-center">
                <button
                    onClick={() => measureDownloadSpeed(largeTestSize)}
                    className="px-6 py-4 rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white focus:ring-purple-500 animate-pulseSlow transform hover:scale-105"
                >
                    High speed detected! Test with {largeTestSize}MB for more accuracy.
                </button>
            </div>
          )}
          <footer className="mt-10 text-center text-xs text-gray-500">
            <p>Initial download test sends {INITIAL_DOWNLOAD_SIZE_MB}MB from server. Upload test sends {UPLOAD_SIZE_MB}MB from client.</p>
            <p>Results may vary based on network conditions and server load.</p>
            <p>Built with Next.js & Tailwind CSS.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
