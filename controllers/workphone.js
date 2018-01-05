var config = require('../config');
var debug = require('../debug')('workphone');
var debug_twilio = require('../debug')('workphone:twilio');
var base = require('./base');

const moment = require('moment-timezone');
const _ = require('underscore');
const VoiceReponse = require('twilio').twiml.VoiceResponse;
const snsPublish = require('aws-sns-publish');
const isAbsoluteUrl = require('is-absolute-url');
const UrlJoin = require('url-join');

const toAbsoluteURL = function(str){
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
    return str;
  }
};

const entity = class workphone extends base {
  constructor(){
    super();
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
        action: toAbsoluteURL(config.recordurl),
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
        recordingStatusCallback: toAbsoluteURL(config.recordingstatuscallback)});
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
      twiml.record({ maxLength: config.messagemaxlength, recordingStatusCallback: toAbsoluteURL(config.recordingstatuscallback)});
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
