const baseConfig = require('../../packages/config/tailwind/base');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
