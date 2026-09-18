/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#050608',
          900: '#090B0F',
          850: '#0E1117',
          800: '#141822',
          700: '#1C2230',
        },
        gold: {
          50: '#FDFBF7',
          100: '#FAF4E8',
          200: '#F4E5C6',
          300: '#EAD19B',
          400: '#DEBA6C',
          500: '#D4AF37',
          600: '#B89328',
          700: '#8F711C',
          800: '#685117',
          champagne: '#F3E5AB',
          bronze: '#C5A880',
          metallic: '#E5C07B',
        },
        river: {
          deep: '#060B11',
          night: '#0A131F',
          surface: '#122030',
          reflection: '#1C314A',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(135deg, #FFE8B8 0%, #D4AF37 50%, #997C22 100%)',
      },
      animation: {
        'shimmer': 'shimmer 8s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'wave': 'wave 12s cubic-bezier(0.37, 0, 0.63, 1) infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wave: {
          '0%': { transform: 'translateX(0) translateZ(0) scaleY(1)' },
          '50%': { transform: 'translateX(-25%) translateZ(0) scaleY(0.8)' },
          '100%': { transform: 'translateX(-50%) translateZ(0) scaleY(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
}
