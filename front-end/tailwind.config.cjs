/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        "wiggle": 'wiggle 1s ease-in-out infinite',
        "slide-out": "slideOutToRight 1s ease-out 3s",
        "slide-in": "slideInFromRight 500ms ease-in",
      },
      keyframes: {
        slideInFromRight: {
          "0%": {
            transform: "translateX(200%)",
          },
          "100%": {
            transform: "translateX(0%)",
          },
        },
        slideOutToRight: {
          "0%": {
            opacity: "1",
            transform: "translateX(0%)",
          },
          "100%": {
            transform: "translateX(200%)",
            opacity: "0",
          },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        }
      },
    },
  },
  daisyui: {
    themes: [
      {
        fire: {
          primary: "#9BA2FF", // "#989FCE",

          secondary: "#AFD0BF", // amnethsyt "#9D5EF1", red crayola "#EF2D56", thulian pink "#E56399", cool green #AFD0BF

          accent: "#fdba74",

          neutral: "#191D24",

          "base-100": "#2A303C",

          info: "#3ABFF8",

          success: "#36D399",

          warning: "#FBBD23",

          error: "#F87272",
        },
      },
      {
        simple: {
          primary: "#2F2F2F",

          secondary: "#CE2D4F",

          accent: "#1FB2A5",

          neutral: "wheat",

          "base-100": "#DAD6D6",

          info: "#3ABFF8",

          success: "#36D399",

          warning: "#FBBD23",

          error: "#F87272",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};
