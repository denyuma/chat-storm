const router = require('express').Router();

router.get('/', (req, res, next) => {


  res.render('./index.pug', {
    user: req.user,
    success: req.flash('success'), // 新規登録、ログインをしたとき
    errors: req.flash('errors')[0],
    info: req.flash('info')  // ログアウトしたとき
  });
});

module.exports = router;