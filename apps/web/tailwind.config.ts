import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0C1A22',
          1: '#0C1A22',
          2: '#2F4550',
          3: '#586F7C',
        },
        mute: '#8FA0AB',
        line: 'rgba(47, 69, 80, 0.10)',
        line2: 'rgba(47, 69, 80, 0.16)',
        bg: '#F4F4F9',
        surface: '#FFFFFF',
        accent: {
          DEFAULT: '#B8DBD9',
          2: '#9CC9C5',
          ink: '#1F3E3A',
        },
        pos: '#2F7A6A',
        neg: '#A0496B',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'h1-screen': ['26px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1-onb': ['30px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2-card': ['18px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      borderRadius: {
        card: '20px',
        'card-lg': '24px',
        input: '14px',
        btn: '12px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(47,69,80,0.04), 0 1px 2px rgba(47,69,80,0.04)',
        'card-lg': '0 1px 0 rgba(47,69,80,0.04), 0 8px 20px rgba(47,69,80,0.06)',
        fab: '0 10px 22px rgba(12,26,34,0.30), 0 0 0 5px rgba(244,244,249,0.95)',
        sheet: '0 -10px 30px rgba(12,26,34,0.20)',
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};

export default config;
