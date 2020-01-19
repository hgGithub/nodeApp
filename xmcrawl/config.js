'use strict';
const log4js = require('log4js');
const fs = require('fs');
const path = require('path');
let mysql = require('mysql');

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
		proLog: {appenders: ['errorLog'], level: 'all'}
	}
});

global.logger = log4js.getLogger('default')

var connection = null;
var creatConnect = () => {
	let conDb = null;
	const env  = process.env.NODE_ENV || 'development';

	if(env === 'production') {
		conDb = mysql.createConnection({
		  host     : 'localhost',
		  user     : 'root',
		  password : 'mysql123',
		  database : 'myself_db',
		  port : 3310,
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

module.exports = creatConnect;