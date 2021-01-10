const router = require('express').Router();
const csrf = require('csrf');
const tokens = new csrf();
const { decryptString } = require('../lib/security/encrypt.js');
const { MAX_ITEM_PER_PAGE } = require('../config/app.config.js').search;

const moment = require('moment-timezone');

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.get('/', (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const keyword = req.query.keyword || '';

  const regexp = new RegExp(`.*${keyword}.*`);

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const query = {
      $and: [{ $or: [{ roomName: regexp }, { roomId: regexp }] }, { isPublic: true }]
    };

    Promise.all([
      db.collection('rooms')
        .find(query)
        .count(),
      db.collection('rooms')
        .find(query)
        .sort({ createdDate: -1 })
        .skip((page - 1) * MAX_ITEM_PER_PAGE)
        .limit(MAX_ITEM_PER_PAGE)
        .toArray()
    ]).then((results) => {
      const data = {
        keyword: keyword,
        count: results[0],
        rooms: results[1],
        pagination: {
          max: Math.ceil(results[0] / MAX_ITEM_PER_PAGE),
          current: page
        }
      };
      res.render('./rooms/list.pug', {
        data: data,
        user: req.user
      });
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});


router.get('/room', (req, res, next) => {
  // tokenが違うかった場合Errorを出す。
  if (req.query.new === 1) {
    const secret = req.session._csrf;
    const token = req.cookies._csrf;

    if (tokens.verify(secret, token) === false) {
      throw new Error('Invalid Token');
    }
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.query.roomId;
    const query = { roomId: { $eq: roomId } };

    Promise.all([
      db.collection('rooms')
        .findOne({ roomId: roomId }),
      db.collection('messages')
        .find(query)
        .toArray()
    ]).then((results) => {
      // tokenを削除
      delete req.session._csrf;
      res.clearCookie('_csrf');

      const roomName = results[0].roomName;
      const roomId = results[0].roomId;
      const roomPassword = decryptString(results[0].roomPassword);
      const messages = results[1];
      res.render('./room.pug', {
        roomName: roomName,
        roomId: roomId,
        roomPassword: roomPassword,
        messages: messages,
        user: req.user
      });
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

router.post('/room', (req, res, next) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.query.roomId;
    const message = req.body.message;
    const username = req.user ? req.user.username : req.cookies.tracking_key;
    const createdDate = req.body.createdDate;

    Promise.all([
      db.collection('rooms')
        .find({ roomId: roomId }),
      db.collection('messages').insertOne({
        roomId: roomId,
        message: message,
        username: username,
        createdDate: createdDate || moment(new Date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
      })
    ]).then((results) => {
      res.redirect(`/rooms/room?roomId=${roomId}`);
    }).catch(error => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;