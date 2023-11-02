import has from 'has';

async function main() {
  return [require('ansi-regex'), import('ansi-regex')];
}

export const program = main();

export default has(Object.prototype, 'hasOwnProperty');
