const express = require('express');
const router = express.Router();

function randomGenerator() {
  return require('crypto').randomBytes(4).toString('hex');
}

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.post('/', (req, res, next) => {
  const roomName = req.body.roomName;
  const roomId = randomGenerator();
  const roomPassword = randomGenerator();

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);
    db.collection('rooms').insertOne({
      roomName: roomName,
      roomId: roomId,
      roomPassword: roomPassword
    }).then((doc) => {
      console.log(doc);
      res.render('./newroom.pug', {doc: doc.ops[0]});
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;

// roomId作成