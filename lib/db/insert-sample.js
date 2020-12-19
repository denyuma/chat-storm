const { CONNECTION_URL, DATABASE, OPTIONS } = require('../../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

const insertRooms = function (db) {
  return Promise.all([
    db.collection('rooms').insertOne({
      roomName: 'test',
      roomId: 'sample',
      roomPassword: 'sample567',
      roomUrl: 'test'
    }),
    db.collection('rooms')
      .createIndex({ roomId: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

const insertMessages = function (db) {
  return Promise.all([
    db.collection('messages').insertMany([{
      message: 'hello1',
      roomId: 'sample',
      username: 'sample1',
      createdDate: new Date()
    }, {
      message: 'hello2',
      roomId: 'sample',
      username: 'sample2',
      createdDate: new Date()
    }]),
    db.collection('messages')
      .createIndex({ createdDate: 1, username: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

const insertUsers = function (db) {
  return Promise.all([
    db.collection('users').insertMany([{
      email: 'sample1@sample.com',
      username: 'sample1',
      password: 'qwerty', //'qwerty', // '77d1fb804f4e1e6059377122046c95de5e567cb9fd374639cb96e7f5cc07dba1'
      role: 'owner'
    }, {
      email: 'sample2@sample.com',
      username: 'sample2',
      password: 'qwerty', //'qwerty', // '77d1fb804f4e1e6059377122046c95de5e567cb9fd374639cb96e7f5cc07dba1'
      role: 'default'
    },{
      email: 'sample3@sample.com',
      username: 'sample3',
      password: 'qwerty', //'qwerty', // '77d1fb804f4e1e6059377122046c95de5e567cb9fd374639cb96e7f5cc07dba1'
      role: 'default'
    }]),
    db.collection('users')
      .createIndex({ email: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

const insertPrivileges = function (db) {
  return Promise.all([
    db.collection('privileges').insertMany([
      { role: 'default', permissions: ['read'] },
      { role: 'owner', permissions: ['readWrite'] }
    ]),
    db.collection('privileges')
      .createIndex({ role: 1 }, { unique: true, background: true })
  ]).catch(error => {
    throw error;
  });
};

MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
  const db = client.db(DATABASE);
  Promise.all([
    insertUsers(db),
    insertRooms(db),
    insertMessages(db),
    insertPrivileges(db)
  ]).catch((error) => {
    throw error;
  }).then(() => {
    client.close();
  });
});
