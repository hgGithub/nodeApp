const express = require('express');
const router = express.Router();
const getToken = require('../common/token');
const ACCESSTOKEN = getToken.token;
router.post('/', (req, res, next) => {
	req.setEncoding('utf8');
	var rawData = '';
	req.on('data', function(chunk) {
		global.logger.info('请求反馈： ' + chunk);
    	rawData = rawData + chunk;
	});
	req.on('end', function() {
		global.logger.info('请求数据流结束： ');
		res.send(rawData);
	});
});

module.exports = router