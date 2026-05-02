import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn CSS variable mappings
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        // Brand terracotta #C4622D = hearth-orange-600.
        'hearth-cream': {
          50: 'oklch(0.985 0.012 90)',
          100: 'oklch(0.965 0.020 88)',
          200: 'oklch(0.930 0.030 85)',
          300: 'oklch(0.880 0.040 80)',
          400: 'oklch(0.810 0.050 75)',
          500: 'oklch(0.720 0.055 70)',
          600: 'oklch(0.620 0.055 65)',
          700: 'oklch(0.520 0.050 62)',
          800: 'oklch(0.420 0.045 58)',
          900: 'oklch(0.320 0.035 55)',
        },
        'hearth-orange': {
          50: 'oklch(0.970 0.015 47)',
          100: 'oklch(0.930 0.035 47)',
          200: 'oklch(0.860 0.065 47)',
          300: 'oklch(0.780 0.095 47)',
          400: 'oklch(0.690 0.118 47)',
          500: 'oklch(0.620 0.132 47)',
          600: 'oklch(0.575 0.135 47)', // #C4622D — brand terracotta
          700: 'oklch(0.500 0.115 45)',
          800: 'oklch(0.420 0.090 42)',
          900: 'oklch(0.350 0.065 40)',
        },
        'hearth-brown': {
          50: 'oklch(0.960 0.012 60)',
          100: 'oklch(0.910 0.020 58)',
          200: 'oklch(0.820 0.035 55)',
          300: 'oklch(0.710 0.045 52)',
          400: 'oklch(0.600 0.050 50)',
          500: 'oklch(0.500 0.050 50)',
          600: 'oklch(0.420 0.045 50)',
          700: 'oklch(0.350 0.040 50)',
          800: 'oklch(0.280 0.035 50)', // foreground — dark brown header text
          900: 'oklch(0.200 0.025 50)',
        },
        'hearth-muted': {
          50: 'oklch(0.970 0.008 80)',
          100: 'oklch(0.940 0.012 78)',
          200: 'oklch(0.900 0.018 75)',
          300: 'oklch(0.830 0.022 75)',
          400: 'oklch(0.740 0.024 72)',
          500: 'oklch(0.650 0.024 70)',
          600: 'oklch(0.550 0.022 68)',
          700: 'oklch(0.450 0.020 65)',
          800: 'oklch(0.350 0.018 60)',
          900: 'oklch(0.260 0.015 58)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      fontSize: {
        // 18px body as per design spec
        base: ['18px', { lineHeight: '1.7' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
