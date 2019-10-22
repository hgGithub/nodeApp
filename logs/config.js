var logger = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, './logs/access.log'), {flags: 'a'});