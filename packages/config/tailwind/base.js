/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#F4F4F4',
        'surface-2': '#EBEBEB',
        ink: '#0D0D0D',
        'ink-2': '#6B6B6B',
        'ink-3': '#A3A3A3',
        line: '#E5E5E5',
        'on-ink': '#FFFFFF',
        rec: '#EF4A3C',
        success: '#1B8A4B',
        warn: '#C27A00',
        danger: '#C62828',
      },
      borderRadius: {
        'r-sm': '12px',
        'r-md': '20px',
        'r-full': '9999px',
      },
      boxShadow: {
        'dock': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'sheet': '0 -8px 32px rgba(0, 0, 0, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Malayalam', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
