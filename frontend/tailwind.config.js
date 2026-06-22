/** @type {import('tailwindcss').Config} */
// Tailwind v4: design tokens (colors, fonts) live in the `@theme` block in
// src/index.css. This file only declares content sources for class scanning.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
}
