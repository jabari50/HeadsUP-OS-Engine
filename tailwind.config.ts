import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#112240',
        'navy-light': '#1E3A5F',
        teal: '#00c896',
        gold: '#F5C518',
        cream: '#F4F4F0',
        'vgm-gray': '#8A8F99',
        'dark-bg': '#0a1628',
        'card-bg': '#162032',
        'border-subtle': '#1e3a5f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Impact', 'sans-serif'],
      },
      animation: {
        'fill-bar': 'fillBar 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fillBar: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--fill-width)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
