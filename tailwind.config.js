import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...defaultTheme,
    extend: {
      colors: {
        // Token-based palette (CSS variables)
        text1: 'rgb(var(--color-text-1) / <alpha-value>)',
        text2: 'rgb(var(--color-text-2) / <alpha-value>)',
        text3: 'rgb(var(--color-text-3) / <alpha-value>)',

        surface1: 'rgb(var(--color-surface-1) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        surface3: 'rgb(var(--color-surface-3) / <alpha-value>)',

        border1: 'rgb(var(--color-border-1) / <alpha-value>)',
        border2: 'rgb(var(--color-border-2) / <alpha-value>)',
        border3: 'rgb(var(--color-border-3) / <alpha-value>)',

        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryContrast: 'rgb(var(--color-primary-contrast) / <alpha-value>)',
        primarySoft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
        highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
        highlightContrast: 'rgb(var(--color-highlight-contrast) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        dangerContrast: 'rgb(var(--color-danger-contrast) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)',

        successFg: 'rgb(var(--status-success-fg) / <alpha-value>)',
        successBg: 'rgb(var(--status-success-fg) / 0.12)',
        dangerFg: 'rgb(var(--status-danger-fg) / <alpha-value>)',
        dangerBg: 'rgb(var(--status-danger-fg) / 0.12)',
        warningFg: 'rgb(var(--status-warning-fg) / <alpha-value>)',
        warningBg: 'rgb(var(--status-warning-fg) / 0.14)',
        infoFg: 'rgb(var(--status-info-fg) / <alpha-value>)',
        infoBg: 'rgb(var(--status-info-fg) / 0.12)',

        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-1) / <alpha-value>)',
        surfaceAlt: 'rgb(var(--color-surface-2) / <alpha-value>)',
        text: 'rgb(var(--color-text-1) / <alpha-value>)',
        muted: 'rgb(var(--color-text-3) / <alpha-value>)',
        border: 'rgb(var(--color-border-1) / <alpha-value>)',

        // Back-compat aliases (legacy class names)
        'bg-primary': 'rgb(var(--color-bg) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--color-surface-1) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-1) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-3) / <alpha-value>)',
        'success': 'rgb(var(--status-success-fg) / <alpha-value>)',
        'warning': 'rgb(var(--status-warning-fg) / <alpha-value>)',
        'danger': 'rgb(var(--status-danger-fg) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
        card: 'var(--radius-card)',
        'card-inner': 'var(--radius-card-inner)',
        modal: 'var(--radius-modal)',
        sheet: 'var(--radius-sheet)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
        badge: 'var(--radius-badge)',
        avatar: 'var(--radius-avatar)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        sheet: 'var(--shadow-sheet)',
        popover: 'var(--shadow-popover)',
        focus: 'var(--shadow-focus)',
        elevated: 'var(--shadow-elevated)',
        none: 'none',
      },
      spacing: {
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-5': 'var(--space-5)',
        'space-6': 'var(--space-6)',
        'space-8': 'var(--space-8)',
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          ...defaultTheme.fontFamily.sans,
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
        scaleIn: 'scaleIn 200ms ease-out',
      },
    },
  },
  safelist: [
    'animate-fadeIn',
    'animate-scaleIn',
  ],
  plugins: [],
};
