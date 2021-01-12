const router = require('express').Router();

router.get('/', (req, res, next) => {


  res.render('./index.pug', {
    user: req.user,
    successMessage: req.flash('success'),
    errorMessage: req.flash('errors')[0],
    info: req.flash('info')
  });
});

module.exports = router;