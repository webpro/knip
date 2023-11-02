import 'another-unlisted'; // insane

const staticResolve = () => {
  return require('string-literal');
};

module.exports.staticResolve = staticResolve;
