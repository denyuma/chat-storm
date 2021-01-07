const express = require('express');
const router = express.Router();
const csrf = require('csrf');
const tokens = new csrf();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.post('/', (req, res) => {

  // csrf対策
  tokens.secret((error, secret) => {
    const token = tokens.create(secret);
    req.session._csrf = secret;
    res.cookie('_csrf', token);
  });

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;

    const query = { $and: [{ roomId: roomId, roomPassword: roomPassword }] };

    db.collection('rooms')
      .find(query)
      .toArray()
      .then((room) => {
        if (room.length > 0) {
          const roomName = room[0].roomName;
          const roomId = room[0].roomId;
          const roomPassword = room[0].roomPassword;

          res.render('confirm.pug', {
            roomName: roomName,
            roomId: roomId,
            roomPassword: roomPassword,
            user: req.user
          });
        } else {
          const errors = validateData(req.body, room);
          res.render('index.pug', { errors: errors });
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

function validateData(body, room) {
  let isValidated = true;
  let errors = {};

  if (!body.roomId) {
    isValidated = false;
    errors.roomId = 'ルームIDを入力してください';
  }

  if (!body.roomPassword) {
    isValidated = false;
    errors.roomPassword = 'パスワードを入力してください';
  }

  if (body.roomId && body.roomPassword && room.length === 0) {
    isValidated = false;
    errors.mistakeIdOrPass = 'ルームIDかパスワードが間違っています';
  }

  return isValidated ? undefined : errors;
}

module.exports = router;