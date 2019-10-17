'use strict';

const env  = process.env.NODE_ENV || 'development';
const curEnv = {};

const envConfig = () => {
	switch(env) {
		case 'development':
			curEnv = require('../config/development');
			break;
		case 'production':
			curEnv = require('../config/production');
			break;
		case 'test':
			curEnv = require('../config/test');
			break;
		default:
			curEnv = require('../config/development');

	}
}

module.exports = curEnv;