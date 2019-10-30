const logger = require('morgan');
const fs = require('fs');
const path = require('path');
const accessLogStream = fs.createWriteStream(path.join(__dirname, './access.log'), {flags: 'a'});

module.exports = {'logger': logger, 'als': accessLogStream}