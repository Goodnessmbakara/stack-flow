/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lato: ["Lato", "sans-serif"],
      },

      keyframes: {
        flash: {
          "0%": {
            backgroundColor: "rgba(255,255,255,0.2)",
            boxShadow:
              "32px 0 rgba(255,255,255,0.2), -32px 0 rgba(255,255,255,1)",
          },
          "50%": {
            backgroundColor: "rgba(255,255,255,1)",
            boxShadow:
              "32px 0 rgba(255,255,255,0.2), -32px 0 rgba(255,255,255,0.2)",
          },
          "100%": {
            backgroundColor: "rgba(255,255,255,0.2)",
            boxShadow:
              "32px 0 rgba(255,255,255,1), -32px 0 rgba(255,255,255,0.2)",
          },
        },
        scaleUp: {
          "0%": { transform: "translate(-50%, -50%) scale(0)" },
          "60%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
        },
        pulse: {
          "0%, 60%, 100%": { transform: "scale(1)" },
          "80%": { transform: "scale(1.2)" },
        },
      },

      animation: {
        flash: "flash 1.5s linear infinite",
        scaleUp: "scaleUp 1s linear infinite",
        pulse: "pulse 1s linear infinite",
      },
    },
  },
  plugins: [],
};
