const express = require('express');
const router = express.Router();
const getToken = require('../common/token');
const ACCESSTOKEN = getToken.token;
router.post('/', (req, res, next) => {
	// console.log('req.body: ', req.body);
	res.send('hello world');
});

module.exports = router