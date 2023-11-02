const plugin = require('tailwindcss/plugin');

module.exports = {
  plugins: [plugin(function () {}), require('@tailwindcss/typography'), require('@tailwindcss/forms')],
  presets: [require('@acmecorp/tailwind-base')],
};
