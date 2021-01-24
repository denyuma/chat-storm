const router = require('express').Router();
const hash = require('../lib/security/hash.js');
const { authenticate, authenticateLocal, authorize } = require('../lib/security/accountcontrol.js');
const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const { MAX_ITEM_PER_PAGE } = require('../config/app.config.js').search;
const MongoClient = require('mongodb').MongoClient;
const { decryptString } = require('../lib/security/encrypt.js');

router.get('/signup', (req, res, next) => {
  res.render('./account/signup.pug');
});

router.post('/signup', (req, res, next) => {
  const username = req.body.username || '';
  const userId = req.body.userId || '';
  const password = req.body.password;

  const user = {
    username: username,
    userId: userId,
    password: hash.digest(password) //パスワードのハッシュ化
  };

  const errors = validateSignUpData(req.body);
  if (errors) { // バリデーションしたときにエラーが出ればエラー表示
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
      .findOne({ userId: userId })
      .then((foundUser) => {
        if (foundUser) {
          const errors = { userIdExist: `${userId}は既に使用されています` };
          res.render('./account/signup.pug', {
            errors: errors,
            username: username,
            userId: userId
          });
        } else {
          db.collection('users')
            .insertOne(user)
            .then(() => {
              authenticateLocal(req, res, next); //自動でログインする
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

router.post('/login', authenticate()); //ログイン処理

router.post('/logout', (req, res, next) => {
  req.logout();
  req.flash('info', 'ログアウトしました');
  res.redirect('/');
});

router.get('/:userId', authorize(), (req, res, next) => {
  const userId = req.params.userId;

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('users')
      .findOne({ userId: userId })
      .then((user) => {
        if (user) {
          res.render('./account/useredit.pug', {
            user: user,
            error: req.flash('error')
          });
        } else {
          const err = new Error('指定されたユーザーは見つかりません');
          err.status = 404;
          next(err);
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

router.post('/:userId', authorize(), (req, res, next) => {
  if (parseInt(req.query.delete) === 1) {
    req.logout();

    const userId = req.params.userId;

    MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
      const db = client.db(DATABASE);

      const query = { userId: userId };

      db.collection('users')
        .deleteOne(query)
        .then(() => {
          req.flash('success', 'アカウントを消去しました');
          res.redirect('/');
        });
    });
  } else {
    const err = new Error('不正なリクエストです');
    err.status = 400;
    next(err);
  }
});

router.get('/:userId/rooms', (req, res, next) => {
  const userId = req.params.userId;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const keyword = req.query.keyword || '';

  const regexp = new RegExp(`.*${keyword}.*`);

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('users')
      .findOne({ userId: userId }) //パラメータのuserIdからユーザーを所得
      .then((user) => {
        if (user) {
          const query = {
            $and: [{ $or: [{ roomName: regexp }, { roomId: regexp }] }, { createdBy: userId }]
          };
          Promise.all([
            db.collection('rooms')
              .find(query)
              .count(),
            db.collection('rooms') //公開されている部屋の数を所得
              .find({
                $and: [{ $or: [{ roomName: regexp }, { roomId: regexp }] }, { createdBy: userId }, {isPublic: true}]
              })
              .count(),
            db.collection('rooms')
              .find(query)
              .sort({ createdDate: -1 })
              .skip((page - 1) * MAX_ITEM_PER_PAGE)
              .limit(MAX_ITEM_PER_PAGE)
              .toArray()
          ]).then((results) => {
            const publicRooms = results[2].filter((a) => (a.isPublic === true));
            const data = {
              keyword: keyword,
              count: results[0],
              publicRoomsCount: results[1],
              rooms: results[2],
              publicRooms: publicRooms,
              isCreateUser: req.user ? (req.user.userId === req.params.userId) : false,
              pagination: {
                max: Math.ceil(results[0] / MAX_ITEM_PER_PAGE),
                current: page
              }
            };
            res.render('./account/rooms/roomlist.pug', {
              data: data,
              createUser: user, // 部屋作成者
              user: req.user,
              success: req.flash('success')
            });
          }).catch((error) => {
            throw error;
          }).then(() => {
            client.close();
          });
        } else {
          const err = new Error('指定されたユーザーは存在しません');
          err.status = 404;
          next(err);
        }
      });


  });
});

router.get('/:userId/rooms/:roomId', (req, res, next) => {
  const roomId = req.params.roomId;
  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({ roomId: roomId })
      .then((room) => {
        if (isMine(req, room)) { // 部屋が存在するか,また部屋を作成したユーザーだけが編集画面に行ける
          room.roomPassword = decryptString(room.roomPassword);
          res.render('./account/roomedit.pug', {
            room: room,
            user: req.user,
            error: req.flash('error')
          });
        } else {
          const err = new Error('指定された部屋がない、または編集する権限がありません');
          err.status = 404;
          next(err);
        }
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

router.post('/:userId/rooms/:roomId', (req, res, next) => {
  const userId = req.params.userId;
  const roomId = req.params.roomId;
  const roomName = req.body.roomName;
  const isPublic = req.body.isPublic ? true : false;

  if (!roomName) {
    req.flash('error', '部屋名が未入力です');
    return res.redirect(`/account/${userId}/rooms/${roomId}`);
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);

    db.collection('rooms')
      .findOne({ roomId: roomId })
      .then((room) => {
        if (isMine(req, room)) { // 部屋が存在するか,また部屋を作成したユーザーだけが編集できる
          if (parseInt(req.query.edit) === 1) { // 編集のとき
            db.collection('rooms')
              .findOneAndUpdate({ roomId: roomId }, { '$set': { roomName: roomName, isPublic: isPublic } })
              .then(() => {
                req.flash('success', '部屋を編集しました');
                return res.redirect(`/account/${userId}/rooms`);
              }).catch((error) => {
                throw error;
              }).then(() => {
                client.close();
              });
          } else if (parseInt(req.query.delete) === 1) { // 削除のとき
            Promise.all([
              db.collection('rooms')
                .findOneAndDelete({ roomId: roomId }),
              db.collection('messages')
                .deleteMany({ roomId: roomId })
            ]).then(() => {
              req.flash('success', '部屋を削除しました');
              res.redirect(`/account/${userId}/rooms`);
            }).catch((error) => {
              throw error;
            }).then(() => {
              client.close();
            });
          } else {
            const err = new Error('不正なリクエストです');
            err.status = 400;
            next(err);
          }
        } else {
          const err = new Error('指定された部屋がない、または編集する権限がありません');
          err.status = 404;
          next(err);
        }
      });
  });
});

/**
 * 自分が作成した部屋かどうか判定する
 * @param {object} req 
 * @param {object} room 
 */
function isMine(req, room) {
  return room && req.user && (req.user.userId === room.createdBy);
}

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