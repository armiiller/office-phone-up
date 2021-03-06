// call the actual module here so we don't have a circular dependancy
var debugprefix = process.env.DEBUGPREFIX || 'workphone-up';
var debug = require('debug')(`${debugprefix}:config`);
const parse_result = require('dotenv').config();

if(parse_result.error){
  debug(parse_result.error);
}

const _ = require('underscore');

var hash = {};

// This section is used for running locally
hash.runtime                 = {};
hash.runtime.server          = true;
hash.runtime.port            = process.env.PORT || 3000;
hash.runtime.environment     = process.env.NODE_ENV || 'local';
hash.runtime.simulate_time   = process.env.SIMULATE_TIME || null;
hash.runtime.stage           = process.env.UP_STAGE || null;
hash.runtime.apibaseurl      = process.env.APIBASEURL || null;
hash.runtime.debugprefix     = debugprefix;

// company settings
hash.companyname             = process.env.COMPANYNAME || "our";
hash.number                  = process.env.NUMBER || '';

// hours of operation
hash.days                    = process.env.DAYS ? _.map(process.env.DAYS.split(','), x => parseInt(x)) : [1,2,3,4,5];
hash.days_friendly           = process.env.DAYS_FRIENDLY || "Monday thru Friday";
hash.open                    = parseInt(process.env.HOUR_OPEN) || 8;
hash.close                   = parseInt(process.env.HOUR_CLOSE) || 17;
hash.hour_friendly           = process.env.HOUR_FRIENDLY || '8 AM to 5 PM';
hash.timezone                = process.env.TIMEZONE || "America/Los_Angeles";

// route handlers
hash.incomingcallurl         = process.env.INCOMINGCALLURL || '/';
hash.incomingsmsurl          = process.env.INCOMINGSMSURL || '/sms';
hash.recordingstatuscallback = process.env.RECORDINGSTATUSURL || '/recordstatus';
hash.recordurl               = process.env.RECORDURL || '/record';

// URLs to .mp3 recordings
hash.voiceurl                = process.env.VOICEURL || null;
hash.thanksformessageurl     = process.env.THANKSFORMESSAGEURL || null;
hash.noanswerurl             = process.env.NOANSWERURL || null;

// Twilio Settings
hash.dialtimeout             = process.env.DIALTIMEOUT ? parseInt(process.env.DIALTIMEOUT) : 15;
hash.messagemaxlength        = process.env.MESSAGEMAXLENGTH ? parseInt(process.env.MESSAGEMAXLENGTH) : 30;

// SNS settings
hash.snsarn                  = process.env.SNSARN || null;

hash.twilio                  = {};
hash.twilio.authtoken        = process.env.TWILIO_AUTH_TOKEN || null;

debug(hash);

module.exports = hash;
