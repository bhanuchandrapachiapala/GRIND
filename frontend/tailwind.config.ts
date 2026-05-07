import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware (swap with `.light` class on <html>)
        'bg-base': 'rgb(var(--color-bg-base) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',

        // Neon accents — RGB triple form so /N opacity composes.
        'neon-cyan': 'rgb(var(--color-neon-cyan) / <alpha-value>)',
        'neon-purple': 'rgb(var(--color-neon-purple) / <alpha-value>)',
        'neon-green': 'rgb(var(--color-neon-green) / <alpha-value>)',
        'neon-amber': 'rgb(var(--color-neon-amber) / <alpha-value>)',
        'neon-red': 'rgb(var(--color-neon-red) / <alpha-value>)',
      },
      boxShadow: {
        neon: '0 0 12px rgba(0, 255, 255, 0.4)',
        'neon-lg': '0 0 24px rgba(0, 255, 255, 0.3)',
        'neon-sm': '0 0 6px rgba(0, 255, 255, 0.3)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;
