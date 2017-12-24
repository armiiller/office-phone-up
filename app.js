var config = require('./config');
var app = require('./routes');

if(config.runtime.server){
  var port = config.runtime.port;
  app.listen(port, () => console.log(`init: app listening on port ${port}!`));
}
