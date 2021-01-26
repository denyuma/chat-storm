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
const $message = $('#message');
const $messageform = $('#message-form');

// postされたときの設定
socket.on('post', (post) => {
  const text =
    ` <div class="item" align="center" id=${post.messageId} >
        <div class="item-message" >
          <p class="item-message-value" >${post.message}</p> 
        </div>
        <div class="message-data mb-2">
          <span class="item-createdBy mr-3" >${post.username}</span>
          <span class="item-createdDate mr-3 " >${post.createdDate}</span>
        </div>
      </div>`;
  $messages.append(text);
});

$('#message-send-button').each((i, e) => {
  const button = $(e);

  button.on('click', () => {
    const roomId = button.data('room-id');
    const messageId = createUuid();
    const username = button.data('username');

    const message = escape($message.val());
    if (!message) { //入力欄が空の時何もしない
      return -1;
    }

    // メッセージが送信された時間を設定
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1);
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const createdDate = `${year}/${month}/${day} ${hour}:${minute}:${second}`;

    const post = {
      message: message,
      messageId: messageId,
      createdDate: createdDate,
      username: username,
      roomId: roomId
    };

    socket.emit('post', post);

    $.post(`/rooms/room/${roomId}/post`, {
      message: message,
      messageId: messageId,
      createdDate: createdDate
    });

    $message.val('');
  });
});

$messageform.on('submit', (e) => {
  e.preventDefault();
});