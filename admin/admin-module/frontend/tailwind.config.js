/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2d2d2d',        // Dark charcoal (sidebar)
        accent: '#5D0D18',     // Bloodstone (buttons/links)
        accentSoft: '#9FB2AC', // Misty Sage
        canvas: '#FFF9EB',     // Vanilla Custard
        red: {
           600: '#5D0D18'
        },
        indigo: {
           700: '#420810'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
