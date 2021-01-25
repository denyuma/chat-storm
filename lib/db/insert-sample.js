const { CONNECTION_URL, DATABASE, OPTIONS } = require('../../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;
const hash = require('../security/hash.js').digest;
const { encryptString, decryptString } = require('../security/encrypt');
const createUuid = require('../security/uuid').createUuid;

const insertRooms = function (db) {
  return Promise.all([
    db.collection('rooms').insertMany([{
      roomName: 'test-room-public',
      roomId: 'sample-public',
      roomPassword: encryptString('sample-room'),
      createdBy: 'test-user',
      createdDate: new Date(),
      isPublic: true
    }, {
      roomName: 'test-room-private',
      roomId: 'sample-private',
      roomPassword: encryptString('sample-room'),
      createdBy: 'test-user',
      createdDate: new Date(),
      isPublic: false
    }]),
    db.collection('rooms')
      .createIndex({ roomId: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

const insertMessages = function (db) {
  return Promise.all([
    db.collection('messages').insertMany([{
      roomId: 'sample-public',
      message: 'hello1',
      messageId: createUuid(),
      createdBy: 'test-user',
      createdDate: new Date()
    }, {
      roomId: 'sample-private',
      message: 'hello2',
      messageId: createUuid(),
      createdBy: 'test-user',
      createdDate: new Date()
    }]),
    db.collection('messages')
      .createIndex({ messageId: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

const insertUsers = function (db) {
  return Promise.all([
    db.collection('users').insertMany([{
      username: 'test-user',
      userId: 'test-user',
      password: hash('qwerty'), 
    }]),
    db.collection('users')
      .createIndex({ userId: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
  const db = client.db(DATABASE);
  Promise.all([
    insertUsers(db),
    insertRooms(db),
    insertMessages(db)
  ]).catch((error) => {
    throw error;
  }).then(() => {
    client.close();
  });
});
