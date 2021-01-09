const {HASH_SALT, HASH_STRETCH} = require('../../config/app.config.js').security;
const crypto = require('crypto');

const digest = function (text) {
  text += HASH_SALT;

  for (let i = 0; i < HASH_STRETCH; i++) {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    text = hash.digest('hex');
  }

  return text;
};

module.exports = {
  digest
};