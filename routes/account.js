const router = require('express').Router();
const hash = require('../lib/security/hash.js');
const { authenticate } = require('../lib/security/accountcontrol.js');
const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const { MAX_ITEM_PER_PAGE } = require('../config/app.config.js').search;
const MongoClient = require('mongodb').MongoClient;

router.get('/signup', (req, res, next) => {
  res.render('./account/signup.pug');
});

router.post('/signup', (req, res, next) => {
  const username = req.body.username || '';
  const userId = req.body.userId || '';
  const password = req.body.password;
  const role_default = 'default';

  const user = {
    username: username,
    userId: userId,
    password: hash.digest(password),
    role: role_default
  };

  let errors = validateSignUpData(req.body);
  if (errors) {
    res.render('./account/signup.pug', {
      errors: errors,
      username: username,
      userId: userId
    });
    return;
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);


    db.collection('users')
      .find()
      .toArray()
      .then((users) => {
        const errors = userIdExist(users, userId);
        if (errors) {
          res.render('./account/signup.pug', {
            errors: errors,
            username: username,
          });
        } else {
          db.collection('users')
            .insertOne(user)
            .then(() => {
              req.flash('success', '新規登録しました');
              res.redirect('/');
            }).catch((error) => {
              throw error;
            }).then(() => {
              client.close();
            });
        }
      });
  });
});

router.get('/login', (req, res, next) => {
  res.render('./account/login.pug', { error: req.flash('error') });
});

router.post('/login', authenticate());

router.post('/logout', (req, res, next) => {
  req.logout();
  req.flash('success', 'ログアウトしました');
  res.redirect('/');
});

router.get('/:userId', (req, res, next) => {
  const userId = req.params.userId;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const keyword = req.query.keyword || '';

  const regexp = new RegExp(`.*${keyword}.*`);

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    const query = {
      $and: [{ $or: [{ roomName: regexp }, { roomId: regexp }] }, { createdBy: userId }]
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
      res.render('./account/mypage.pug', {
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

/**
 * 
 * @param {Array} users 
 * @param {String} userId
 * 新規登録されたユーザーのユーザーIDが既に登録されているか判定する 
 */
function userIdExist(users, userId) {
  let isUserIdExist = false;
  let errors = {};

  for (let i = 0; i < users.length; i++) {
    console.log(users[i]);
    isUserIdExist = (userId === users[i].userId) ? true : false;
    if (isUserIdExist) {
      break;
    } else {
      continue;
    }
  }

  errors.userIdExist = isUserIdExist ? `${userId} は既に登録されています` : undefined;

  return isUserIdExist ? errors : undefined;
}

/**
 * 
 * @param {Object} body 
 * 新規登録 で送られたデータをバリデーション
 */
function validateSignUpData(body, users, userId) {
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
    errors.notUserIdHankaku = 'パスワードが半角英数字または6文字以上ではありません';
  }

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