import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cti: {
          bg: '#0d1117',
          surface: '#161b22',
          'surface-hover': '#1c2129',
          border: '#30363d',
          text: '#e6edf3',
          muted: '#8b949e',
          sdo: '#f85149',
          sco: '#58a6ff',
          sro: '#bc8cff',
          meta: '#3fb950',
          accent: '#39d2c0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
