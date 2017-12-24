var fs = require('fs');

var hash = {};
fs.readdirSync(__dirname).forEach(function(file) {
    if (file === "index.js" || file.substr(file.lastIndexOf('.') + 1) !== 'js')
        return;
    var name = file.substr(0, file.indexOf('.'));
    hash[name] = require('./' + name);
});

module.exports = hash;
