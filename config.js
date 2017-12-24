require('dotenv').config();

var hash = {};

// This section is used for running locally
hash.runtime                 = {};
hash.runtime.server          = true;
hash.runtime.port            = process.env.PORT || 3000;
hash.runtime.environment     = process.env.NODE_ENV || 'local';

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
hash.incomingcallurl         = process.env.INCOMINGCALLURL || '/'
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
hash.snsarn                  - process.env.SNSARN || null;

module.exports = hash;
