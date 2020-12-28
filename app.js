'use strict';
const express = require('express');
const app = express();

const createError = require('http-errors');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const systemLogger = require('./lib/log/systemLogger.js');
const accessLogger = require('./lib/log/accessLogger.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.disabled('x-powered-by');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(express.static(path.join(__dirname, 'public')));
// app.use('/public', express.static(__dirname + '/public/' + (process.env.NODE_ENV === 'development' ? 'development' : 'production')));
app.use('/public', express.static(__dirname + '/public/'));

app.use(accessLogger());

app.use('/', require('./routes/index.js'));
app.use('/newroom', require('./routes/newroom.js'));
app.use('/room', require('./routes/room.js'));
app.use('/confirm', require('./routes/confirm.js'));

app.use(systemLogger());

app.use((_req, _res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// app.listen(8000);
// console.log('listening Port in 8000');