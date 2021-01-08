const express = require('express');
const router = express.Router();
const csrf = require('csrf');
const tokens = new csrf();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

function randomStringGenerator() {
  return require('crypto').randomBytes(4).toString('hex');
}

router.get('/', (req, res, next) => {
  const roomId = req.query.roomId;

  // tokenとsessionにcsrfを作成
  tokens.secret((error, secret) => {
    const token = tokens.create(secret);
    req.session._csrf = secret;
    res.cookie('_csrf', token);
  });
  
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({ roomId: roomId })
      .then((room) => {
        const roomName = room.roomName;
        const roomId = room.roomId;
        const roomPassword = room.roomPassword;
        res.render('./newroom.pug', {
          roomName: roomName,
          roomId: roomId,
          roomPassword: roomPassword,
          user: req.user
        });
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

router.post('/', (req, res, next) => {
  const roomName = req.body.roomName || '(部屋名未設定)';
  const roomId = randomStringGenerator();
  const roomPassword = randomStringGenerator();

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms').insertOne({
      roomName: roomName,
      roomId: roomId,
      roomPassword: roomPassword
    }).then((doc) => {
      res.redirect(`/newroom?roomId=${roomId}`);
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;