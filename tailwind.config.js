/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbe6',
          100: '#fff3b3',
          400: '#fadb14',
          500: '#e6f7ff',
          600: '#1890ff',
          800: '#002766',
          900: '#001529',
        },
        auction: {
          dark: '#0a0f1d',
          card: '#131b2e',
          accent: '#00f2fe',
          gold: '#ffd700',
          danger: '#ff4d4f',
          success: '#52c41a',
        },
      },
    },
  },
  plugins: [],
};
