'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const hash = require('../lib/security/hash').digest;
const { encryptString, decryptString } = require('../lib/security/encrypt');

const { CONNECTION_URL, DATABASE, OPTIONS } = require('../config/mongodb.config.js');
const MongoClient = require('mongodb').MongoClient;

describe('/account/login', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ userId: 'test-user', password: hash('qwerty') });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  test('ログインのフォームが存在するか', () => {
    return request(app)
      .get('/account/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<form action="\/account\/login" method="post"/)
      .expect(200);
  });

  test('ログインしたときにログアウトボタンが表示される', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<button class="btn btn-success my-2 my-sm-2" type="submit"/)
  });
});

describe('/account/logout', () => {
  test('ログアウトしたとき / にリダイレクトされる', () => {
    return request(app)
      .post('/account/logout')
      .expect('Location', '/')
      .expect(302);
  });
});

describe('/confirm', () => {
  test('roomIdとroomPasswordで部屋に入った時に確認画面にリダイレクト', () => {
    return request(app)
      .post('/confirm')
      .send({ roomId: 'sample-public', roomPassword: 'sample-room' })
      .expect('Location', '/confirm?roomId=sample-public')
      .expect(302)
      .end((err, res) => {
        const roomPath = res.headers.location;
        console.log(res);
        console.log(roomPath);
        request(app)
          .get(roomPath)
          .expect(/test-room-public/)
          .expect(/sample-public/)
          .expect(/sample-room/)
          .expect(200)
          .end();
      });
  });

  test('roomIdとroomPasswordが存在しない部屋の時 / にリダイレクトし、エラーメッセージを表示', () => {
    return request(app)
      .post('/confirm')
      .send({ roomId: 'wrong-roomId', roomPassword: 'wrong-roomPassword' })
      .expect('Location', '/')
      .expect(302)
      .end((err, res) => {
        const roomPath = res.headers.location;
        require(app)
          .get(roomPath)
          .expect(/ルームIDまたはパスワードが間違っています/)
          .expect(200)
          .end();
      });
  });
});

describe('/rooms', () => {
  test('/roomsにはisPublicがtrueの物を表示する', () => {
    return request(app)
      .get('/rooms')
      .expect(/test-room-public/)
      .expect(200)
      .end();
  });

  test('/roomsで検索を行ったとき一致する部屋を取得', () => {
    return request(app)
      .get('/rooms')
      .except('Location', '/rooms?keyword=test-room-public')
      .except(302)
      .end((err, res) => {
        request(app)
          .get(res.headers.location)
          .expect(/test-room-public/)
          .expect(200)
          .end();
      });
  });
});


