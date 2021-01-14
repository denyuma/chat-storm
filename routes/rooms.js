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
        .aggregate([
          { $match: {$and: [{ $or: [{ roomName: regexp }, { roomId: regexp }] }, { isPublic: true }]}},
          { $sort: {createdDate: -1}},
          { $skip: (page - 1) * MAX_ITEM_PER_PAGE},
          { $limit: MAX_ITEM_PER_PAGE},
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: 'userId',
              as: 'user'
            }
          }
        ])
        .toArray()
    ]).then((results) => {
      const count = results[0];
      const rooms = results[1];
      // 部屋作成者がアカウント登録しているときroom.usernameにuser.usernameを付与、なければroom.createdBy
      rooms.map((room) => room.username = ( room.user[0] !== undefined ? room.user[0].username : room.createdBy)); 
      console.log(rooms);
      const data = {
        keyword: keyword,
        count: count,
        rooms: rooms,
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

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.query.roomId || req.body.roomId;
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
      const room = {
        roomName: results[0].roomName,
        roomId: results[0].roomId,
        roomPassword: decryptString(results[0].roomPassword)
      };
      const messages = results[1];
      res.render('./room.pug', {
        user: req.user,
        room: room,
        messages: messages
      });
    }).catch((error) => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

router.post('/room', (req, res, next) => {
  // 部屋作成時と入室時tokenが違うかった場合Errorを出す。
  const secret = req.session._csrf;
  const token = req.cookies._csrf;

  if (tokens.verify(secret, token) === false) {
    throw new Error('Invalid Token');
  }

  const roomId = req.query.roomId || req.body.roomId;
  res.redirect(`/rooms/room?roomId=${roomId}`);
});

router.post('/room/:roomId/post', (req, res, next) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.params.roomId;
    const message = req.body.message;
    const userId = req.user ? req.user.userId : req.cookies.tracking_key;
    const createdDate = req.body.createdDate;

    db.collection('messages').insertOne({
      roomId: roomId,
      message: message,
      createdBy: userId,
      createdDate: createdDate || moment(new Date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss')
    }).then(() => {
      res.redirect(`/rooms/room?roomId=${roomId}`);
    }).catch(error => {
      throw error;
    }).then(() => {
      client.close();
    });
  });
});

module.exports = router;