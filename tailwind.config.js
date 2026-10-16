/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      // Touch-target minimums (used as min-h-touch / min-w-touch); mirrors --touch-min in styles.css
      minHeight: { touch: 'var(--touch-min, 44px)' },
      minWidth: { touch: 'var(--touch-min, 44px)' },
    },
  },
  plugins: [],
};
