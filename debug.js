var config = require('./config');
module.exports = function(name){
  return require('debug')(`${config.runtime.debugprefix}:${name}`);
}
