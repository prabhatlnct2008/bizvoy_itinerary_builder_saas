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
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
        secondary: {
          100: '#D1FAE5',
          500: '#10B981',
        },
        background: '#F3F4F6',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'Roboto', 'sans-serif'],
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
    },
  },
  plugins: [],
}
