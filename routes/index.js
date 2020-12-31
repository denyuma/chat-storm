const router = require('express').Router();


router.get('/', (req, res, next) => {
  res.render('./index.pug');
});

router.post('/', (req, res, next) => {
  res.render('./index.pug');
});


module.exports = router;