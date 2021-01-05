const router = require('express').Router();


router.get('/', (req, res, next) => {
  res.render('./index.pug', {
    isAuthenticated: req.isAuthenticated()
  });
});

router.post('/', (req, res, next) => {
  res.redirect('/');
});


module.exports = router;