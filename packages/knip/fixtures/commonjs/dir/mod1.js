function identifier() {}
module.exports = function fn() {};
module.exports.identifier = identifier;
module.exports['identifier2'] = identifier;
