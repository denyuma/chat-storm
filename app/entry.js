'use strict';
import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import popperjs from 'popper.js';
import Sortable from 'sortablejs';

// メッセージをソートする
const messages = document.getElementById('messages');
new Sortable(messages, {
  animation: 200
});

// メッセージをpostする
const socket = io();
const $messages = $('#messages');
const $messageform = $('#messageform');
const $message = $('#message');

socket.on('post', (message) => {
  const text = `<div class="item" > <p class="message" >${message.text}</p> <p>${message.createdDate}</p> </div>`;
  $messages.append(text);
});

$('#message-send-button').each((i, e) => {
  const button = $(e);

  button.click(() => {
    const roomId = button.data('room-id');

    const message = $message.val();

    // メッセージがpostされた時間を設定
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1);
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const createdDate = `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    $.post(`/rooms/room/${roomId}/post`, {
      message: message,
      createdDate: createdDate
    });
  });
});


$messageform.submit((e) => {
  e.preventDefault();

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1);
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const createdDate = `${year}/${month}/${day} ${hour}:${minute}:${second}`;

  const message = $message.val();

  const post = {
    text: message,
    createdDate: createdDate
  };

  socket.emit('post', post);
  $message.val('');
});