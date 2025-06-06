import Head from 'next/head';
import '../styles/globals.css'; // Import the global styles

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Link to Google Fonts for 'Inter'. Place this here for global font availability. */}
        <link
          href="[https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap)"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
