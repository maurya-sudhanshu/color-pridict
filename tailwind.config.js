/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          dark: "#07090e",
          slate: "#0d111d",
          card: "#131b2e",
          border: "#1e293b",
          red: "#f43f5e",
          green: "#10b981",
          violet: "#a855f7",
          gold: "#f59e0b",
        },
      },
      boxShadow: {
        "glow-green": "0 0 25px -5px rgba(16, 185, 129, 0.4)",
        "glow-red": "0 0 25px -5px rgba(244, 63, 94, 0.4)",
        "glow-violet": "0 0 25px -5px rgba(168, 85, 247, 0.4)",
        "glow-gold": "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        "glow-indigo": "0 0 25px -5px rgba(99, 102, 241, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s infinite alternate",
        "float": "float 4s ease-in-out infinite",
      },
      keyframes: {
        glowPulse: {
          "0%": { boxShadow: "0 0 15px rgba(168, 85, 247, 0.2)" },
          "100%": { boxShadow: "0 0 35px rgba(168, 85, 247, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
