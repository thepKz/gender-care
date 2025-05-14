/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "Pro-Rounded": ["Pro-Rounded", "sans-serif"],
      },
      colors: {
        primary: "#000000",
        secondary: "#1a1a1a",
        accent: "#333333",
        text: {
          primary: "#ffffff",
          secondary: "#cccccc"
        },
        'disabled-text': '#9CA3AF',
        'disabled-bg': '#374151',
        'disabled-border': '#4B5563'
      },
    },
  },
  plugins: [],
};
