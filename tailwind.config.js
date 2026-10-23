/** @type {import('tailwindcss').Config} */
module.exports = {
   important: true,
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        'ink-teal': '#12302E',
        'cool-paper': '#EDF2F0',
        'warm-brass': '#C08A3E',
        'warm-brass-dark': '#A87730',
        'status-sage': '#5F8768',
        'status-ochre': '#D9A441',
        'status-brick': '#B8514A',
      },
    },
  },
  plugins: [],
}