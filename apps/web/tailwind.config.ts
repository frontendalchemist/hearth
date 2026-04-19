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
        // Brand palette
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cddcce',
          300: '#a9c2ab',
          400: '#7ea182',
          500: '#5a8260',
          600: '#456750',
          700: '#385341',
          800: '#2e4336',
          900: '#26382d',
        },
        cream: {
          50: '#fefdf8',
          100: '#fdf9ec',
          200: '#faf2d3',
          300: '#f5e7ad',
          400: '#eed77e',
          500: '#e5c355',
          600: '#d4aa34',
          700: '#b28b28',
          800: '#906e26',
          900: '#775b22',
        },
        walnut: {
          50: '#f8f5f0',
          100: '#efe8dd',
          200: '#ddd0bc',
          300: '#c7b193',
          400: '#b0916b',
          500: '#a07a53',
          600: '#936748',
          700: '#7a523c',
          800: '#644436',
          900: '#533a2f',
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
