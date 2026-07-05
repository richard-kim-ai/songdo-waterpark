import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-tide': '#073B4C',
        lagoon: '#118AB2',
        'sun-flare': '#FFD23F',
        coral: '#FF6B6B',
        foam: '#F4FBFC',
        seafoam: '#06D6A0',
        santorini: '#5B6EE1',
        ink: '#06222C',
      },
      fontFamily: {
        display: ['var(--font-jost)'],
        body: ['var(--font-noto)'],
      },
      borderRadius: {
        xl2: '22px',
      },
    },
  },
  plugins: [],
};

export default config;
