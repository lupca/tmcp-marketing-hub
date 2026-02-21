/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    DEFAULT: "rgba(255, 255, 255, 0.05)",
                    hover: "rgba(255, 255, 255, 0.1)",
                    border: "rgba(255, 255, 255, 0.1)",
                },
                dark: {
                    bg: "#080812",
                    panel: "rgba(18, 18, 32, 0.6)",
                },
            },
            animation: {
                "blob": "blob 7s infinite",
            },
            keyframes: {
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                }
            }
        },
    },
    plugins: [],
}
