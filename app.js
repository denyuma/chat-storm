const express = require('express');
const app = express();

app.set('view engine', 'pug');
app.disabled('x-powered-by');

// app.use('/public', express.static(__dirname + '/public/' + (process.env.NODE_ENV === 'development' ? 'development' : 'production')));

app.use('/', require('./routes.index.js'));

app.listen(8000);
console.log('listening Port in 8000');