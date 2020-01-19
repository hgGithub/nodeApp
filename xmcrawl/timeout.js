let timeout = require('node-schedule');

var rule = new timeout.RecurrenceRule();
rule.minute = [57,58];
rule.second = 0;

// var j = timeout.scheduleJob(rule, function(){
  console.log('nihao!', new Date().toLocaleString());
// });