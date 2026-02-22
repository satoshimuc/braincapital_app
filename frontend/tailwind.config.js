/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brain: {
          navy: '#1e3a5f',
          blue: '#2563eb',
          teal: '#0d9488',
          purple: '#7c3aed',
          gold: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          light: '#f0f4f8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
