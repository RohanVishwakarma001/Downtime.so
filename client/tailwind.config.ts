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
        background: '#09090b',
        surface: '#111113',
        'surface-2': '#18181b',
        border: '#27272a',
        'border-2': '#3f3f46',
        muted: '#71717a',
        'muted-foreground': '#a1a1aa',
        foreground: '#fafafa',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        'primary-muted': '#1e1b4b',
        status: {
          operational: '#22c55e',
          degraded: '#eab308',
          partial: '#f97316',
          major: '#ef4444',
          maintenance: '#3b82f6',
        },
        incident: {
          investigating: '#f97316',
          identified: '#eab308',
          monitoring: '#3b82f6',
          resolved: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
