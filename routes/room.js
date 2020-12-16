const router = require('express').Router();

router.post('/', (req, res) => {
  res.render('./room.pug');
});

module.exports = router;