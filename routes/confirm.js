const express = require('express');
const router = express.Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.post('/', (req, res) => {

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;

    const query = { $and: [{ roomId: roomId, roomPassword: roomPassword }] };

    db.collection('rooms')
      .find(query)
      .toArray()
      .then((docs) => {
        if (docs.length > 0) {
          const roomName = docs[0].roomName;
          const roomId = docs[0].roomId;
          const roomPassword = docs[0].roomPassword;

          res.render('confirm.pug', {
            roomName: roomName,
            roomId: roomId,
            roomPassword: roomPassword
          });
        } else {
          const errors = validateData(req.body, docs);
          res.render('index.pug', { errors: errors });
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

function validateData(body, docs) {
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

  if (body.roomId && body.roomPassword && docs.length === 0) {
    isValidated = false;
    errors.mistakeIdOrPass = 'ルームIDかパスワードが間違っています';
  }

  return isValidated ? undefined : errors;
}

module.exports = router;