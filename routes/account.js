const router = require('express').Router();
const { authenticate } = require('../lib/security/accountcontrol.js');
const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const passport = require('passport');
const MongoClient = require('mongodb').MongoClient;

router.get('/signup', (req, res, next) => {
  res.render('./signup.pug');
});

router.post('/signup', (req, res, next) => {
  const username = req.body.username || '';
  const userId = req.body.userId || '';
  const password = req.body.password;
  const role_default = 'default';

  const user = {
    username: username,
    userId: userId,
    password: password,
    role: role_default
  };

  const errors = validateSignUpData(req.body);
  if (errors) {
    res.render('./signup.pug', {
      errors: errors,
      username: username,
      userId: userId
    });
    return;
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('users')
      .insertOne(user)
      .then(() => {
        req.login(user, function(err) {
          if (err) { return next(err); }
          return res.redirect('/');
        });
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
}).post('/login');

router.get('/login', (req, res, next) => {
  res.render('./login.pug', { error: req.flash('error') });
});

router.post('/login', authenticate());

/**
 * 
 * @param {Object} body 
 * 新規登録 で送られたデータをバリデーション
 */
function validateSignUpData(body) {
  let isValidate = true;
  let errors = {};

  if (!body.userId || !body.username || !body.password || !body.passwordConfirm) {
    isValidate = false;
    errors.notInput = '入力できていない項目があります';
  }

  if ((body.password && body.passwordConfirm && !(body.password === body.passwordConfirm))) {
    isValidate = false;
    errors.notInput = 'パスワードが一致しません';
  }

  if (body.userId && !(checkUserId(body.userId))) {
    isValidate = false;
    errors.notUserIdHankaku = 'ユーザーIDが半角英数字ではありません';
  }

  if (body.password && !(checkPassword(body.password))) {
    isValidate = false;
    errors.notUserIdHankaku = 'パスワードがが半角英数字または6文字以上ではありません';
  }

  // todos ユーザーIDが被らないようにする

  return isValidate ? undefined : errors;
}

/**
 * 
 * @param {string} userId 
 * ユーザーIDが半角英数字かを判定する
 */
function checkUserId(userId) {
  userId = (userId === undefined) ? '' : userId;
  const userIdRegExp = new RegExp(/^[a-zA-Z0-9]+$/);
  if (userIdRegExp.test(userId)) {
    return true;
  } else {
    return false;
  }
}

/**
 * 
 * @param {string} password
 * ユーザーパスワードが半角英数字かつ6文字以上か判定する
 */
function checkPassword(password) {
  password = (password === undefined) ? '' : password;
  const passwordRegExp = new RegExp(/^([a-zA-Z0-9]{6,})$/);
  if (passwordRegExp.test(password)) {
    return true;
  } else {
    return false;
  }
}

module.exports = router;