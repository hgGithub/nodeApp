const express = require('express');
const router = express.Router();
const getToken = require('../common/token');
const ACCESSTOKEN = getToken.token;
router.get('/', (req, res, next) => {

	res.render('index');
});

module.exports = router