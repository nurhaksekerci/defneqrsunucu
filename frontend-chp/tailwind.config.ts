import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        chp: {
          red: '#E30A17',
          redDark: '#B00812',
          redHover: '#C50914',
          muted: 'rgba(227, 10, 23, 0.09)',
          mutedStrong: 'rgba(227, 10, 23, 0.14)',
          ink: '#0c1222',
          inkMuted: '#3d4a5c',
          canvas: '#f4f6f9',
          surface: '#ffffff',
          border: '#e2e8f0',
          borderStrong: '#cbd5e1',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'chp-sm': '0 1px 2px rgba(12, 18, 34, 0.05)',
        chp: '0 4px 24px rgba(12, 18, 34, 0.06), 0 1px 3px rgba(12, 18, 34, 0.04)',
        'chp-lg': '0 12px 40px rgba(12, 18, 34, 0.08), 0 4px 12px rgba(12, 18, 34, 0.04)',
      },
      backgroundImage: {
        'chp-mesh':
          'radial-gradient(ellipse 120% 80% at 100% -20%, rgba(227, 10, 23, 0.07), transparent 50%), radial-gradient(ellipse 80% 60% at 0% 100%, rgba(12, 18, 34, 0.04), transparent 45%)',
        'chp-hero':
          'linear-gradient(145deg, #0c1222 0%, #1a2744 42%, #3d0a0e 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
