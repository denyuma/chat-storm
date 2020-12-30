const express = require('express');
const router = express.Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

function randomStringGenerator() {
  return require('crypto').randomBytes(4).toString('hex');
}

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
      res.render('./newroom.pug', {
        roomName: doc.ops[0].roomName,
        roomId: doc.ops[0].roomId,
        roomPassword: doc.ops[0].roomPassword
      });
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;

// roomId作成