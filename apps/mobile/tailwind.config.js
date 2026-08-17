const plugin = require('tailwindcss/plugin')
const { hairlineWidth } = require('nativewind/theme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.tsx',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
        mono: ["Menlo", "monospace"],
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.font-thin': { fontFamily: 'Manrope_200ExtraLight' },
        '.font-extralight': { fontFamily: 'Manrope_200ExtraLight' },
        '.font-light': { fontFamily: 'Manrope_300Light' },
        '.font-normal': { fontFamily: 'Manrope_400Regular' },
        '.font-medium': { fontFamily: 'Manrope_500Medium' },
        '.font-semibold': { fontFamily: 'Manrope_600SemiBold' },
        '.font-bold': { fontFamily: 'Manrope_700Bold' },
        '.font-extrabold': { fontFamily: 'Manrope_800ExtraBold' },
        '.font-black': { fontFamily: 'Manrope_800ExtraBold' },
      })
    }),
  ],
}
