'use strict';
/**
 * Module dependencies.
 */
const express = require('express');
const app = express();

// const createError = require('http-errors');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

const systemLogger = require('./lib/log/systemLogger.js');
// const accessLogger = require('./lib/log/accessLogger.js');

const accountcontrol = require('./lib/security/accountcontrol.js');
const { SESSION_SECRET } = require('./config/app.config.js').security;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.disabled('x-powered-by');

app.use('/public', express.static(__dirname + '/public/'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  name: 'sid'
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (!req.cookies.tracking_key){
    const trackingIdKey = 'tracking_key';
    const trackingId = require('crypto').randomBytes(6).toString('base64');
    const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
    res.cookie(trackingIdKey, trackingId, { expires: tomorrow });
  }
  next();
});

app.use(flash());
app.use(...accountcontrol.initialize());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use(accessLogger());

/**
 * rooting 
 */

app.use('/', require('./routes/index.js'));
app.use('/newroom', require('./routes/newroom.js'));
app.use('/rooms', require('./routes/rooms.js'));
app.use('/confirm', require('./routes/confirm.js'));
app.use('/account', require('./routes/account.js'));

app.use(systemLogger());

app.use((req, res, next) => {
  const errorData = {
    method: req.method,
    protocol: req.protocol,
    version: req.httpVersion,
    url: req.url
  };

  res.status(404);
  if (req.xhr) {
    res.json(errorData);
  } else {
    res.render('./error/404.pug', {
      errorData: errorData,
      user: req.user
    });
  }
});

app.use((err, req, res, next) => {
  const errorData = {
    method: req.method,
    protocol: req.protocol,
    version: req.httpVersion,
    url: req.url,
    name: err.name,
    message: err.message,
    stack: err.stack
  };

  res.status(err.status || 500);
  if (req.xhr) {
    res.json(errorData);
  } else {
    res.render('./error/500.pug', {
      errorData: errorData,
      user: req.user
    });
  }
});

module.exports = app;