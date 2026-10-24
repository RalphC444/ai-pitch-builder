/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexus Design System - Color Tokens
        'cool-grey': {
          100: '#f0f4f8',
          700: '#8b8d98',
          1000: '#1c2024',
        },
        'grey-scale': {
          200: '#ebebeb',
          600: '#5c5c5c',
          700: '#333333',
        },
        'blue': {
          400: '#339bef',
          600: '#0068bc',
        },
        'purple': {
          25: '#f6f1ff',
          200: '#d3bbff',
          600: '#7445cc',
        },
        'lilac': {
          300: '#8d98ff',
        },
        'orange': {
          50: '#ffebd8',
          500: '#ff820e',
        },
        'white': '#ffffff',
        'crm-gray': {
          100: '#F0F4F8',
        },
      },
      fontFamily: {
        // Add font families as needed from Nexus Design System
        'sans': ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '30px' }],
      },
      borderRadius: {
        'square': '6px',
        'round': '1000px',
      },
      spacing: {
        'button-gutter': '4px',
      },
    },
  },
  plugins: [],
}
