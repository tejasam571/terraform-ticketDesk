/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f2f1ff',
          100: '#e6e4ff',
          200: '#cdc9ff',
          300: '#aca4ff',
          400: '#8b7bff',
          500: '#6f56fb',
          600: '#5b3ce8',
          700: '#4b2ec4',
          800: '#3d269d',
          900: '#33217e',
        },
        ink: '#14132b',
      },
      boxShadow: {
        glow: '0 20px 60px -20px rgba(111, 86, 251, 0.45)',
        card: '0 1px 2px rgba(20,19,43,0.04), 0 8px 24px -12px rgba(20,19,43,0.10)',
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pop': { '0%': { transform: 'scale(0.96)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pop': 'pop 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
