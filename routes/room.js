const router = require('express').Router();
const csrf = require('csrf');
const tokens = new csrf();

const moment = require('moment-timezone');

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;


router.get('/', (req, res) => {
  // tokenが違うかった場合Errorを出す。
  if (req.query.new === 1){
    const secret = req.session._csrf;
    const token = req.cookies._csrf;
  
    if (tokens.verify(secret, token) === false) {
      throw new Error('Invalid Token');
    }
  }

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
        // tokenを削除
        delete req.session._csrf;
        res.clearCookie('_csrf');
        res.render('./room.pug', {
          messages: messages,
          roomName: roomName,
          roomId: roomId,
          roomPassword: roomPassword,
          user: req.user
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

    Promise.all([
      db.collection('messages').insertOne({
        roomId: roomId,
        message: message,
        username: 'test-user', //todos
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