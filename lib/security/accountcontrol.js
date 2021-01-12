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

const authenticateLocal = function (req, res, next) {
  passport.authenticate('local-strategy', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
};


const authorize = function() {
  return function (req, res, next) {
    if (req.isAuthenticated() && (req.user.userId === req.params.userId)) {
      next();
    } else {
      throw new Error('アクセスする権限がありません');
    }
  };
};

module.exports = {
  initialize,
  authenticate,
  authenticateLocal,
  authorize
};