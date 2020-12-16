const router = require('express').Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;


router.post('/:roomId&:roomPassword', (req, res) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomName = req.body.roomName;
    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;


    const query = { roomId: { $eq: roomId } };

    db.collection('messages')
      .find(query)
      .toArray()
      .then((messages) => {
        console.log(messages);
        res.render('./room.pug', {
          messages: messages,
          roomName: roomName,
          roomId: roomId,
          roomPassword: roomPassword
        });
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

module.exports = router;