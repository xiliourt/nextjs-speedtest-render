/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // If you create a components folder
    // "./app/**/*.{js,ts,jsx,tsx,mdx}", // Uncomment if using App Router
  ],
  theme: {
    extend: {
      // You can extend your theme here if needed
      // For example, adding the 'Inter' font if you self-host it
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'],
      // },
    },
  },
  plugins: [],
};
