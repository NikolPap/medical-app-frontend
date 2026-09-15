/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'ink-teal': '#12302E',
        'cool-paper': '#EDF2F0',
        'warm-brass': '#C08A3E',
        'warm-brass-dark': '#A67332', // Für Hover-Effekte
'status-sage': '#5F8768', // Confirmed
'status-ochre': '#D9A441', // Pending
'status-brick': '#B8514A' // Cancelled
},
fontFamily: {
sans: ['Inter', 'sans-serif'],
serif: ['Fraunces', 'serif'], // Die neue Serif-Schrift für Headings!
}
},
},
plugins: [],
}