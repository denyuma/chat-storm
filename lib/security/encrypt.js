const crypto = require('crypto');
const {ENCRYPTION_KEY, BUFFER_KEY} = require('../../config/app.config.js').security;

const encryptString = function (text) {
  let iv = Buffer.from(BUFFER_KEY);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return encrypted.toString('hex');
};

const decryptString = function (encrypted) {
  let iv = Buffer.from(BUFFER_KEY);
  let encryptedText = Buffer.from(encrypted, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

module.exports = {
  encryptString,
  decryptString
};