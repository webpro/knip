const ignorePatterns = [];

/** @type {import('some-types').Module} */
const obj = {};

/** @type {string | null} */
const str = 'str';

function fn() {
  /** @type {import('more-types')} */
  const obj = {};
}

/** @type {import('@jest/types')} */
module.exports = {};
