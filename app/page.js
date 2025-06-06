'use client';

import { useState } from 'react';
import Speedtest from 'fast-speedtest-api';

export default function Home() {
  const [speed, setSpeed] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const testSpeed = () => {
    setIsTesting(true);
    const speedtest = new Speedtest({
      token: "YOUR_API_TOKEN", // Get a free token at fast.com
      verbose: false,
      timeout: 10000,
      https: true,
      urlCount: 5,
      bufferSize: 8,
      unit: Speedtest.UNITS.Mbps,
    });

    speedtest.getSpeed().then(s => {
      setSpeed(s.toFixed(2));
      setIsTesting(false);
    }).catch(e => {
      console.error(e);
      setIsTesting(false);
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-5xl font-bold mb-8">Next.js Speedtest</h1>
      <div className="text-center">
        {isTesting ? (
          <div className="text-2xl">Testing...</div>
        ) : (
          speed && <div className="text-6xl font-bold">{speed} <span className="text-2xl">Mbps</span></div>
        )}
      </div>
      <button
        onClick={testSpeed}
        disabled={isTesting}
        className="mt-8 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isTesting ? 'Testing...' : 'Run Speed Test'}
      </button>
    </main>
  );
}
