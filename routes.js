const config = require('./config');
const controllers = require('./controllers');

const express = require('express');
const helmet = require('helmet');
const bodyparser = require('body-parser');
const cors = require('cors');

const workphone_controller = new controllers.workphone();

var middleware_print_path = function(req, res, next){
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

const app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(helmet());
app.disable('Server');
app.use(cors());

app.use(middleware_print_path);

app.post(config.incomingcallurl, (req, res, next) => { workphone_controller.incomingcall(req, res, next); });
app.post(config.recordurl, (req, res, next) => { workphone_controller.record(req, res, next); });
app.post(config.recordingstatuscallback, (req, res, next) => { workphone_controller.recordstatus(req, res, next); });

app.use(function(req, res, next){
  res.status(404).send();
});

module.exports = app;
