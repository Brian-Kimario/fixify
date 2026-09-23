import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        mint: '#5FE3B0',
        dark: '#0A0B0D',
        ink: '#F4F5F3',
        panel: '#15171C',
        line: '#262A31',

        // Semantic Colors
        primary: {
          DEFAULT: '#5FE3B0',
          50: '#f0fdf8',
          100: '#d1fce8',
          200: '#a3f8d5',
          300: '#5FE3B0',
          400: '#2dd489',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#1a4731',
          900: '#0f2818',
        },
        background: '#0A0B0D',
        surface: '#15171C',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.2' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5625rem', { lineHeight: '1.2' }],
        '3xl': ['1.953rem', { lineHeight: '1.2' }],
        '4xl': ['2.441rem', { lineHeight: '1.2' }],
        '5xl': ['3.052rem', { lineHeight: '1.2' }],
        '6xl': ['3.815rem', { lineHeight: '1.2' }],
      },
      spacing: {
        0: '0',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },
      borderRadius: {
        none: '0',
        xs: '0.125rem',
        sm: '0.25rem',
        base: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        base: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        md: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        lg: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
};
export default config;
