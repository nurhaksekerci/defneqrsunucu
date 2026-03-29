import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        chp: {
          red: '#E30A17',
          redDark: '#B00812',
          muted: 'rgba(227, 10, 23, 0.08)',
          ink: '#0c1929',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        header: '0 1px 0 rgba(15, 23, 42, 0.06)',
        lift: '0 12px 40px -12px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
