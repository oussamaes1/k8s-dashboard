/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        k8s: {
          blue: '#326CE5',
          dark: '#1a1a2e',
          darker: '#0f0f1e',
          card: '#16213e',
          border: '#0f3460',
        }
      }
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        'input::placeholder': {
          color: theme('colors.gray.500'),
          opacity: '1',
        },
        'textarea::placeholder': {
          color: theme('colors.gray.500'),
          opacity: '1',
        },
      })
    },
  ],
}
