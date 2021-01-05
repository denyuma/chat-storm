const express = require('express');
const router = express.Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

function randomStringGenerator() {
  return require('crypto').randomBytes(4).toString('hex');
}

router.get('/', (req, res, next) => {
  const roomId = req.query.roomId;
  
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({ roomId: roomId })
      .then((document) => {
        const roomName = document.roomName;
        const roomId = document.roomId;
        const roomPassword = document.roomPassword;
        res.render('./newroom.pug', {
          roomName: roomName,
          roomId: roomId,
          roomPassword: roomPassword,
          isAuthenticated: req.isAuthenticated()
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