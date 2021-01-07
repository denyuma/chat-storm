const router = require('express').Router();


router.get('/', (req, res, next) => {
  res.render('./index.pug', {
    user: req.user,
    successMessage: req.flash('success')
  });
});

router

module.exports = router;