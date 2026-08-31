/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        cerulean: {
          50: "#e9f5fb",
          100: "#d3ebf8",
          200: "#a8d7f0",
          300: "#7cc3e9",
          400: "#51afe1",
          500: "#259bda",
          600: "#1e7cae",
          700: "#165d83",
          800: "#0f3e57",
          900: "#071f2c",
          950: "#05161f",
        },
        "azure-mist": {
          50: "#ebf5f9",
          100: "#d8ecf3",
          200: "#b0d9e8",
          300: "#89c6dc",
          400: "#62b3d0",
          500: "#3ba0c4",
          600: "#2f809d",
          700: "#236076",
          800: "#17404f",
          900: "#0c2027",
          950: "#08161b",
        },
        black: {
          50: "#ede9fb",
          100: "#dbd3f8",
          200: "#b6a8f0",
          300: "#927ce9",
          400: "#6e51e1",
          500: "#4925da",
          600: "#3b1eae",
          700: "#2c1683",
          800: "#1d0f57",
          900: "#0f072c",
          950: "#0a051f",
        },
        "dark-goldenrod": {
          50: "#f8f4ec",
          100: "#f2e9d9",
          200: "#e4d3b4",
          300: "#d7be8e",
          400: "#caa868",
          500: "#bd9242",
          600: "#977535",
          700: "#715828",
          800: "#4b3a1b",
          900: "#261d0d",
          950: "#1a1409",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "typewriter-reveal": {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0 0 0 0)" },
        },
        "typewriter-reveal-rtl": {
          from: { clipPath: "inset(0 0 0 100%)" },
          to: { clipPath: "inset(0 0 0 0)" },
        },
        "typewriter-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        scroll: "scroll 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
        "spin-slow": "spin-slow 4s linear infinite",
        "spin-slow-fast": "spin-slow 1.5s linear infinite",
        "typewriter-reveal": "typewriter-reveal 2s linear 1s both",
        "typewriter-reveal-rtl": "typewriter-reveal-rtl 2s linear 1s both",
        "typewriter-cursor": "typewriter-cursor 0.8s ease-in-out infinite",
      },
    },
  },
}

