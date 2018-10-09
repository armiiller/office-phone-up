var config = require('../config');
var debug = require('../debug')('workphone');
var debug_twilio = require('../debug')('workphone:twilio');
var base = require('./base');
var url = require('url');

const moment = require('moment-timezone');
const _ = require('underscore');
const VoiceReponse = require('twilio').twiml.VoiceResponse;
const MessageResponse = require('twilio').twiml.MessagingResponse;
const snsPublish = require('aws-sns-publish');
const isAbsoluteUrl = require('is-absolute-url');
const UrlJoin = require('url-join');

const fullUrl = function(req){
  var formatted_url = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
  debug(`formatted_url %s`, formatted_url);

  var stages = ["production", "staging", "development"];
  for(var i = 0; i < stages.length; i++){
    var stage = stages[i];
    var index = formatted_url.indexOf(`/${stage}`);
    if(index !== -1){
      formatted_url = formatted_url.slice(0, index + stage.length + 1);
      break;
    }
  }
  debug(`fullUrl %s`, formatted_url);
  return formatted_url;
}

const toAbsoluteURL = function(str, req){
  if(isAbsoluteUrl(str)){
    debug('Skipping conversion to relative url. Was passed absolute: %s', str);
    return str;
  }

  if(config.runtime.apibaseurl){
    var joined = UrlJoin(config.runtime.apibaseurl, str);
    debug('converted %s to absolute url: %s', str, joined);
    return joined;
  } else {
    debug('config.runtime.apibaseurl not set. Leaving as %s', str);
    return UrlJoin(fullUrl(req), str);
  }
};

const entity = class workphone extends base {
  constructor(){
    super();
  }

  incomingsms(req, res, next){
    debug_twilio(req.body);
    res.header('Content-Type', 'text/xml');
    var from = req.body.From;
    var body = req.body.Body;
    var message = `New SMS: ${from} ${body}`;
    if(config.number){
      var twiml = new MessageResponse();
      twiml.message(message, {to: config.number});
      res.status(200).send(twiml.toString());
    } else if (config.snsarn) {
      var p = snsPublish(message, {arn: config.snsarn, subject: 'New SMS'});

      // Must finish all processing before we send the response (An Up thing)
      p.then(function(result){
        res.status(200).send();
      });
    } else {
      res.status(200).send();
    }
  }

  incomingcall(req, res, next){
    debug_twilio(req.body);

    var twiml = new VoiceReponse();

    // moment() and moment(null) are not the same
    var m = config.runtime.simulate_time ? moment(onfig.runtime.simulate_time) : moment();
    var now = m.tz(config.timezone);
    var day = now.day();
    var hour = now.hour();

    debug("day: %d", day);
    debug("hour: %d", hour);

    if(config.number && _.contains(config.days, day) && (hour >= config.open && hour < config.close)){
      twiml.dial(config.number, {
        action: toAbsoluteURL(config.recordurl, req),
        timeout: config.dialtimeout
      });
    } else {
      if(config.voiceurl){
        twiml.play(config.voiceurl)
      } else {
        twiml.say(`Hi! You've reached ${config.companyname} headquarters. We are currently closed. Our hours of operation are ${config.days_friendly} ${config.hour_friendly}. Please leave a message after the beep.`, { voice: 'man' });
      }
      twiml.record({
        maxLength: config.messagemaxlength,
        recordingStatusCallback: toAbsoluteURL(config.recordingstatuscallback, req)});
    }

    res.header('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }

  record(req, res, next){
    debug_twilio(req.body);
    var twiml = new VoiceReponse();

    if(req.body.DialCallStatus == 'no-answer'){
      if(config.noanswerurl){
        twiml.play(config.noanswerurl);
      }else {
        twiml.say("Sorry we couldn't get to the phone, please leave a message after the beep.");
      }
      twiml.record({ maxLength: config.messagemaxlength, recordingStatusCallback: toAbsoluteURL(config.recordingstatuscallback, req)});
    } else if (req.body.RecordingUrl){
      if(config.thanksformessageurl){
        twiml.play(config.thanksformessageurl);
      } else {
        twiml.say("Thanks for your message! We will get back to you soon. Goodbye.");
      }
      twiml.hangup();
    }

    res.header('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }

  recordstatus(req, res, next){
    debug_twilio(req.body);
    var snsarn = config.snsarn;
    debug('snsarn %s', snsarn);

    var p = Promise.resolve(true);
    if(snsarn){
      p = snsPublish(`New Voicemail: ${req.body.RecordingUrl}`, {arn: snsarn, subject: 'New Voicemail'});
    }

    // Must finish all processing before we send the response (An Up thing)
    p.then(function(result){
      debug("recordstatus result %s", result)
      res.header('Content-Type', 'text/xml');
      res.status(200).send();
    });
  }
};

module.exports = entity;
