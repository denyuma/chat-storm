const router = require('express').Router();

const moment = require('moment-timezone');

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

    const roomName = req.query.roomName;
    const roomId = req.query.roomId;
    const roomPassword = req.query.roomPassword ;
    const message = req.body.message;
    const createdDate = req.body.createdDate;

    // メッセージを表示してリダイレクトをする

    Promise.all([
      db.collection('messages').insertOne({
        roomId: roomId,
        message: message,
        username: 'test-user', //要修正
        createdDate: createdDate || moment(new Date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
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