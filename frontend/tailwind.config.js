/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          navy: '#001f3f',
          panel: '#f4f7fb',
          accent: '#007bff',
          teal: '#0d9488',
          purple: '#7c3aed',
          orange: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        admin: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(37, 99, 235, 0.10)',
      },
    },
  },
  plugins: [],
};
