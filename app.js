'use strict';
const express = require('express');
const app = express();


const path = require('path');
const bodyParser = require('body-parser');

const systemLogger = require('./lib/log/systemLogger.js');
const accessLogger = require('./lib/log/accessLogger.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('view engine', 'pug');
app.disabled('x-powered-by');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/public', express.static(__dirname + '/public/' + (process.env.NODE_ENV === 'development' ? 'development' : 'production')));

app.use(accessLogger());

app.use('/', require('./routes/index.js'));
app.use('/newroom', require('./routes/newroom.js'));
app.use('/room', require('./routes/room.js'));
app.use('/confirm', require('./routes/confirm.js'));

app.use(systemLogger());

app.listen(8000);
console.log('listening Port in 8000');