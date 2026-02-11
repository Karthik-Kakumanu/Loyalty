import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Renamed 'primary' to 'brand' to match your PhonePe/Cred theme
        brand: {
          DEFAULT: "#C72C48", 
          dark: "#A61F38",
          light: "#FFF0F3",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F4F6F8",
          glass: "rgba(255, 255, 255, 0.9)",
        },
      },
      borderRadius: {
        '4xl': '2.5rem', // For those smooth bottom-sheet corners
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'nav': '0 -4px 20px rgba(0,0,0,0.05)',
        'float': '0 10px 40px -10px rgba(199, 44, 72, 0.4)',
      },
      animation: {
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;