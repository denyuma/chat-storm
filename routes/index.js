const router = require('express').Router();

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

router.get('/', (req, res) => {
  res.render('./index.pug');
});

router.post('/confirm', (req, res) => {

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;

    const query = { $and: [{ roomId: roomId, roomPassword: roomPassword }] };

    db.collection('rooms')
      .find(query)
      .toArray()
      .then((docs) => {
        if (docs.length > 0) {
          const roomName = docs[0].roomName;
          const roomId = docs[0].roomId;
          const roomPassword = docs[0].roomPassword;
        
          res.render('confirm.pug', {
            roomName: roomName,
            roomId: roomId,
            roomPassword: roomPassword
          });

        } else {
          res.render('index.pug', {error: 'その部屋は存在しません'} );
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

module.exports = router;