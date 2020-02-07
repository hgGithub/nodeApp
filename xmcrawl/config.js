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
		infolog: {type: 'dateFile', filename: logPath + 'info.log', pattern: '.yyyy-MM-dd', daysToKeep: 7}
		// error: {type: "logLevelFilter", level: "error", appender: 'errorLog'}

	},
	categories: {
		default: {appenders: ['std'], level: 'all'},
		proLog: {appenders: ['infolog'], level: 'all'}
	}
});

if(env === 'production') {
	global.logger = log4js.getLogger('proLog');
} else {
	global.logger = log4js.getLogger('default');
}


var connection = null;
var creatConnect = () => {
	let conDb = null;
	if(env === 'production') {
		conDb = mysql.createConnection({
		  host     : 'localhost',
		  user     : 'root',
		  password : 'root',
		  database : 'myself_db',
		  port : 3306,
		  dateStrings: true
		});
	} else {
		conDb = mysql.createConnection({
		  host     : '10.0.11.6',
		  user     : 'EI_user',
		  password : 'EI_user_11',
		  database : 'elec_invoice_db',
		  port : 3310,
		  dateStrings: true
		});
	}

	return conDb;
}

process.on('uncaughtException', function (err) { // 捕获进程错误

  global.logger.error(err);
  global.logger.error(err.stack);
});

module.exports = creatConnect;