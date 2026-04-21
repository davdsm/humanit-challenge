/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#f8fafc',
        surface: '#ffffff',
        'surface-muted': '#f1f5f9',
        ink: {
          950: '#070a12',
          900: '#0b1020',
          800: '#121a33',
        },
        mist: '#9be5f0',
        accent: '#9be5f0',
        accent2: '#9be5f0',
      },
    },
  },
  plugins: [],
}
