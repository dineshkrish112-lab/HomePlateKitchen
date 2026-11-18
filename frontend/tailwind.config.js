/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#FFFDF8', 100: '#FBF7EF', 200: '#F4EDE0', 300: '#E9DFCC' },
        brand: { 50: '#EEF8F1', 100: '#D6EFDD', 200: '#ADDFBC', 300: '#7CC995', 400: '#4BAF6E', 500: '#2E9455', 600: '#217844', 700: '#1C5F38', 800: '#194C2F', 900: '#153F28' },
        saffron: { 50: '#FFF5EB', 100: '#FFE6CC', 200: '#FFCB99', 300: '#FFAB5E', 400: '#FB8C2E', 500: '#F07315', 600: '#D4590C', 700: '#AF430E' },
        charcoal: { 400: '#6B6F76', 500: '#4B4F56', 600: '#373A40', 700: '#26282C', 800: '#1A1B1E', 900: '#111214' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,27,30,.04), 0 4px 16px rgba(26,27,30,.06)',
        lift: '0 8px 30px rgba(26,27,30,.12)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fadeUp .35s ease-out both' },
    },
  },
  plugins: [],
};
