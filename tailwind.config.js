/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f0f14',
        'bg-secondary': '#1a1a24',
        'bg-elevated': '#242430',
        'text-primary': '#e4e4e7',
        'text-secondary': '#71717a',
        'accent': '#6366f1',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'border': '#27272a',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
