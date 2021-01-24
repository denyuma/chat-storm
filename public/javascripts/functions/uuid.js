function createUuid() {
  const uuid = 'xxxxxxxx-xxxx-4xxx-Zxxx-xxxxxxxxxxxx'.split('');
  const uuidLength = uuid.length;
  for (let i = 0; i < uuidLength; i++) {
    switch (uuid[i]) {
      case '4':
        break;
      case '-':
        break;
      case 'x':
        uuid[i] = Math.floor(Math.random() * 16).toString(16);
        break;
      case 'Z':
        uuid[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
        break;
    }
  }
  // 配列を結合して１つの文字列に変換
  return uuid.join('');
}