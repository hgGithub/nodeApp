var createError = require('http-errors');
var express = require('express');
var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');

var router = require('./routes/index');
var app = express();
var logs = require('./logs/config');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

const curentEnvironment = process.env.NODE_ENV || 'development';
let logger = undefined;
if('development' === curentEnvironment) {
	logger = logs.getLogger('default');
} else {
	logger = logs.getLogger('http');
}

// 接入日志组件
app.use(logs.connectLogger(logger));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
router(app);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	logger.error('Something happened: ', err);
	logs.shutdown();
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {error: err.message});
});

module.exports = app;
