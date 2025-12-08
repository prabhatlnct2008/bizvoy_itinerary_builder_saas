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
          100: '#E0EDFF',
          500: '#3B82F6',
          600: '#2563EB',
        },
        secondary: {
          100: '#D1FAE5',
          500: '#10B981',
        },
        success: '#16A34A',
        warning: '#F97316',
        neutral: '#94A3B8',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        error: '#EF4444',
        info: '#3B82F6',
        game: {
          bg: '#1a1a1a',
          card: '#2d2d2d',
          'accent-green': '#00E676',
          'accent-coral': '#FF4081',
          discard: '#FF5252',
          save: '#FFC107',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'Inter var', 'Nunito', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
      },
      borderRadius: {
        'DEFAULT': '8px',
        'modal': '12px',
      },
      boxShadow: {
        'card': '0 10px 15px -10px rgba(0,0,0,0.1)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(0, 230, 118, 0.5)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(0, 230, 118, 0.8)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
