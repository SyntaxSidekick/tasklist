/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: '#A7D08C',
          hover: '#94C973',
          active: '#87BC5C',
        },
        // Background
        dark: '#000909',
        // Text
        text: {
          muted: '#777777',
          subtle: '#9A9A9A',
        },
        // Surface
        surface: {
          DEFAULT: '#F5F7F6',
          muted: '#ECEFEE',
        },
        border: '#D6DDDA',
        // Semantic
        success: '#A7D08C',
        warning: '#F4A623',
        error: '#E05565',
        info: '#4A90E2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'app': '12px',
        'app-lg': '16px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
