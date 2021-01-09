const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const hash = require('./hash.js');

const { CONNECTION_URL, OPTIONS, DATABASE } = require('../../config/mongodb.config');
const MongoClient = require('mongodb').MongoClient;

passport.serializeUser((userId, done) => {
  done(null, userId);
});

passport.deserializeUser((userId, done) => {
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);
    db.collection('users').findOne({
      userId: userId
    }).then((user) => {
      done(null, user);
    }).catch((error) => {
      done(error);
    }).then(() => {
      client.close();
    });
  });
});

passport.use('local-strategy',
  new LocalStrategy({
    usernameField: 'userId',
    passwordField: 'password',
    passReqToCallback: true
  }, (req, userId, password, done) => {
    MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
      const db = client.db(DATABASE);
      db.collection('users').findOne({
        userId: userId,
        password: hash.digest(password)
      }).then((user) => {
        if (user) {
          req.session.regenerate((error) => {
            if (error) {
              done(error);
            } else {
              done(null, user.userId, req.flash('success', 'ログインに成功しました'));
            }
          });
        } else {
          done(null, false, req.flash('error', 'ユーザーIDまたはパスワードが違います'));
        }
      }).catch((error) => {
        done(error);
      }).then(() => {
        client.close();
      });
    });
  })
);


const initialize = function () {
  return [
    passport.initialize(),
    passport.session()
  ];
};

const authenticate = function () {
  return passport.authenticate(
    'local-strategy', {
      successRedirect: '/',
      failureRedirect: '/account/login',
      failureFlash: true,
      badRequestMessage: 'ユーザーIDとパスワードは必須入力です'
    }
  );
};

module.exports = {
  initialize,
  authenticate
};