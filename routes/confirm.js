const express = require('express');
const router = express.Router();
const csrf = require('csrf');
const tokens = new csrf();
const { encryptString, decryptString } = require('../lib/security/encrypt.js');

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.get('/', (req, res, next) => {
  const roomId = req.query.roomId;

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({roomId: roomId})
      .then((room) => {
        if (room) {
          room.roomPassword = decryptString(room.roomPassword);
          res.render('confirm.pug', {
            room: room,
            user: req.user
          });
        }else {
          const err = new Error('指定された部屋は存在しません');
          err.status = 404;
          next(err);
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

router.post('/', (req, res, next) => {
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
      .findOne(query)
      .then((room) => {
        if (room) {
          res.redirect(`/confirm?roomId=${room.roomId}`);
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

  if (body.roomId && body.roomPassword && room === null) {
    isValidated = false;
    errors.mistakeIdOrPass = 'ルームIDまたはパスワードが間違っています';
  }

  return isValidated ? undefined : errors;
}

module.exports = router;