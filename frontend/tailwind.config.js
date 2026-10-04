/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(14, 165, 233, 0.4), 0 20px 40px rgba(14, 165, 233, 0.15)',
      },
    },
  },
  plugins: [],
}

