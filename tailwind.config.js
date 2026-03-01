/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#1e1e1e',
        'vscode-sidebar': '#252526',
        'vscode-activity': '#333333',
        'vscode-status': '#007acc',
        'vscode-tab': '#1e1e1e',
        'vscode-tab-active': '#1e1e1e',
        'vscode-border': '#2b2b2b',
      }
    },
  },
  plugins: [],
}