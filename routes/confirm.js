const express = require('express');
const router = express.Router();
const csrf = require('csrf');
const tokens = new csrf();
const {encryptString, decryptString} = require('../lib/security/encrypt.js');

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.post('/', (req, res) => {

  // csrf対策 tokenを作成
  tokens.secret((error, secret) => {
    const token = tokens.create(secret);
    req.session._csrf = secret;
    res.cookie('_csrf', token);
  });

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.body.roomId;
    const roomPassword = encryptString(req.body.roomPassword);

    const query = { $and: [{ roomId: roomId, roomPassword: roomPassword }] };

    db.collection('rooms')
      .find(query)
      .toArray()
      .then((room) => {
        if (room.length > 0) {
          const roomName = room[0].roomName;
          const roomId = room[0].roomId;
          const roomPassword = decryptString(room[0].roomPassword);

          res.render('confirm.pug', {
            roomName: roomName,
            roomId: roomId,
            roomPassword: roomPassword,
            user: req.user
          });
        } else {
          const errors = validateData(req.body, room);
          req.flash('errors', errors);
          res.redirect('/');
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

  if (!body.roomId || !body.roomPassword) {
    isValidated = false;
    errors.notEntered = 'ルームIDまたはル―ムパスワードが未入力です';
  }

  if (body.roomId && body.roomPassword && room.length === 0) {
    isValidated = false;
    errors.mistakeIdOrPass = 'ルームIDまたはパスワードが間違っています';
  }

  return isValidated ? undefined : errors;
}

module.exports = router;