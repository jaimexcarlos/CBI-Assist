/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0EA5E9', // Sky blue
          DEFAULT: '#0EA5E9'
        },
        secondary: {
          green: '#10B981', // Vibrant green
          DEFAULT: '#10B981'
        },
        bg: {
          main: '#FFFFFF',
          offset: '#F4F6F8'
        },
        urgent: {
          red: '#EF4444'
        },
        pending: {
          yellow: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
