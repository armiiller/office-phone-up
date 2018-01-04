var debug = require('debug')('routes');
const config = require('./config');
const controllers = require('./controllers');

const express = require('express');
const helmet = require('helmet');
const bodyparser = require('body-parser');
const cors = require('cors');

const UrlJoin = require('url-join');
const twilio = require('twilio');
const twilio_validate = function(path){
  return twilio.webhook(
    config.twilio.authtoken,
    {
      validate: config.twilio.authtoken && config.runtime.apibaseurl ? true : false,
      url: UrlJoin(config.runtime.apibaseurl, path)
    }
  );
};

const workphone_controller = new controllers.workphone();

var middleware_print_path = function(req, res, next){
  //debug(req.headers);
  debug(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  next();
}

const app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(helmet());
app.disable('Server');
app.use(cors());

app.use(middleware_print_path);

app.post(config.incomingcallurl, twilio_validate(config.incomingcallurl), (req, res, next) => { workphone_controller.incomingcall(req, res, next); });
app.post(config.recordurl, twilio_validate(config.recordurl), (req, res, next) => { workphone_controller.record(req, res, next); });
app.post(config.recordingstatuscallback, twilio_validate(config.recordingstatuscallback), (req, res, next) => { workphone_controller.recordstatus(req, res, next); });

app.use(function(req, res, next){
  res.status(404).send();
});

module.exports = app;
