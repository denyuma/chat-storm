const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('confirm.pug');
});

module.exports = router;