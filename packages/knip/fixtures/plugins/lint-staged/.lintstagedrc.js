module.exports = {
  '*.(js|ts|tsx)': async files => {
    return ['eslint --max-warnings=0 --cache --fix .', 'prettier --write .'];
  },
  '*.!(js|ts|tsx)': files => {
    return files.map(filename => `prettier --write --ignore-unknown '${filename}'`);
  },
};
