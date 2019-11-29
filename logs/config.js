const log4js = require('log4js');
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, './');

log4js.configure({
 appenders: {
 	std: {type: 'console'},
 	httpLog: { type: "dateFile", filename: logPath + 'info.log', pattern: 'yyyyMMdd', alwaysIncludePattern: true, keepFileExt: true, flags: 'a'},
 	errorLog: {type: 'dateFile', filename: logPath + 'error.log', pattern: 'yyyyMMdd', alwaysIncludePattern: true, keepFileExt: true, flags: 'a'},
 	error: {type: "logLevelFilter", level: "error", appender: 'errorLog'}

 },
 categories: {
 	default: {appenders: ['std'], level: 'all'},
 	http: {appenders: ['httpLog', 'error'], level: 'info'}
 }
});

module.exports = log4js;


