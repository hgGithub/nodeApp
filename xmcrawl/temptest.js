'use strict';
const log4js = require('log4js');
const fs = require('fs');
const path = require('path');
let mysql = require('mysql');

const logPath = path.join(__dirname, './');
const env  = process.env.NODE_ENV || 'development';

log4js.configure({
	appenders: {
		std: {type: 'console'},
		// httpLog: { type: "dateFile", filename: logPath + 'info.log', pattern: 'yyyyMMdd', alwaysIncludePattern: true, keepFileExt: true, flags: 'a'},
		infolog: {type: 'dateFile', filename: logPath + 'testinfo.log', pattern: '.yyyy-MM-dd-hh', daysToKeep: 7}
		// error: {type: "logLevelFilter", level: "error", appender: 'errorLog'}

	},
	categories: {
		default: {appenders: ['std'], level: 'all'},
		proLog: {appenders: ['infolog'], level: 'all'}
	}
});

var logger = log4js.getLogger('proLog');


var timing = setInterval(()=>{
	logger.info('测试 log4js rolling！');
}, 1800000)
