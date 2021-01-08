const express = require('express');
const router = express.Router();
const csrf = require('csrf');
const tokens = new csrf();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

// roomPasswordを作成
function createPasswordGenerator() {
  return require('crypto').randomBytes(4).toString('hex');
}


// roomIdを作成 (roomIdは被らないようにしている)
function createRoomIdGenerator(rooms) {
  let roomId = require('crypto').randomBytes(4).toString('hex');
  let isRoomIdExist = rooms.some(user => user.roomId === roomId);

  if (isRoomIdExist) {
    do {
      roomId = Math.floor( Math.random() * 3 );
      isRoomIdExist = require('crypto').randomBytes(4).toString('hex');
      if (!isRoomIdExist) {
        break;
      }
    } while (isRoomIdExist);
    return roomId;
  } else {
    return roomId;
  }
}


router.get('/', (req, res, next) => {
  const roomId = req.query.roomId;

  // tokenとsessionにcsrfを作成
  tokens.secret((error, secret) => {
    const token = tokens.create(secret);
    req.session._csrf = secret;
    res.cookie('_csrf', token);
  });

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({ roomId: roomId })
      .then((room) => {
        const roomName = room.roomName;
        const roomId = room.roomId;
        const roomPassword = room.roomPassword;
        res.render('./newroom.pug', {
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

router.post('/', (req, res, next) => {

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);


    db.collection('rooms')
      .find()
      .toArray()
      .then((rooms) => {
        const roomName = req.body.roomName || '(部屋名未設定)';
        const roomId = createRoomIdGenerator(rooms);
        const roomPassword = createPasswordGenerator();
        db.collection('rooms').insertOne({
          roomName: roomName,
          roomId: roomId,
          roomPassword: roomPassword
        }).then(() => {
          res.redirect(`/newroom?roomId=${roomId}`);
        }).catch((error) => {
          throw error;
        }).then(() => {
          client.close();
        });
      });
  });
});

module.exports = router;