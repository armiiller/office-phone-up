var config = require('../config');
var base = require('./base');

const moment = require('moment-timezone');
const _ = require('underscore');
const VoiceReponse = require('twilio').twiml.VoiceResponse;
const snsPublish = require('aws-sns-publish');

const entity = class workphone extends base {
  constructor(){
    super();
  }

  incomingcall(req, res, next){
    var twiml = new VoiceReponse();

    var now = moment(config.runtime.simulate_time).tz(config.timezone);
    var day = now.day();
    var hour = now.hour();

    if(config.number && _.contains(config.days, day) && (hour >= config.open && hour < config.close)){
      twiml.dial(config.number, {action: config.recordurl, timeout: config.dialtimeout});
    } else {
      if(config.voiceurl){
        twiml.play(config.voiceurl)
      } else {
        twiml.say(`Hi! You've reached ${config.companyname} headquarters. We are currently closed. Our hours of operation are ${config.days_friendly} ${config.hour_friendly}. Please leave a message after the beep.`, { voice: 'man' });
      }
      twiml.record({ maxLength: config.messagemaxlength, recordingStatusCallback: config.recordingstatuscallback});
    }

    res.header('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }

  record(req, res, next){
    var twiml = new VoiceReponse();

    switch(req.body.DialCallStatus){
      case 'no-answer':
        if(config.noanswerurl){
          twiml.play(config.noanswerurl);
        }else {
          twiml.say("Sorry we couldn't get to the phone, please leave a message after the beep.");
        }
        twiml.record({ maxLength: config.messagemaxlength, recordingStatusCallback: config.recordingstatuscallback});
        break;
      default:
        if(config.thanksformessageurl){
          twiml.play(config.thanksformessageurl);
        } else {
          twiml.say("Thanks for your message! We will get back to you soon. Goodbye.");
        }
        twiml.hangup();
        break;
    }

    res.header('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }

  recordstatus(req, res, next){
    var snsarn = config.snsarn;

    var p = Promise.resolve(true);
    if(snsarn){
      p = snsPublish(`New Voicemail: ${req.body.RecordingUrl}`, {arn: snsarn, subject: 'New Voicemail'});
    }

    // Must finish all processing before we send the response (An Up thing)
    p.then(function(){
      res.header('Content-Type', 'text/xml');
      res.status(200).send();
    });
  }
};

module.exports = entity;
