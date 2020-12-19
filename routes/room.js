const router = require('express').Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;


router.get('/', (req, res) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    
    const db = client.db(DATABASE);

    const roomName = req.query.roomName;
    const roomId = req.query.roomId;
    const roomPassword = req.query.roomPassword;

    const query = { roomId: { $eq: roomId } };

    db.collection('messages')
      .find(query)
      .toArray()
      .then((messages) => {
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

router.post('/', (req, res) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomName = req.body.roomName;
    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;
    const message = req.body.message;

    // メッセージを表示してリダイレクトをする

    Promise.all([
      db.collection('messages').insertOne({
        roomId: roomId,
        message: message,
        username: 'test-user', //要修正
        createdDate: new Date()
      })
    ]).then(() => {
      res.redirect(`/room?roomName=${roomName}&roomId=${roomId}&roomPassword=${roomPassword}`);
    }).catch(error => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;