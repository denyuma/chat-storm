'use strict';
/* eslint-disable no-undef */
$(() => {
  const socket = io();
  const $messages = $('[data-js-selector=messages]');
  const $messageform = $('[data-js-selector=messageform]');
  const $message = $('[data-js-selector=message]');

  socket.on('post', (post) => {
    const text = `<div class="item" > <p class="message" >${post.text}</p> <p>${post.createdDate}</p> </div>`;
    $messages.append(text);
  });

  $('.message-send-button').each((i, e) => {
    const button = $(e);

    button.click(() => {
      const roomId = button.data('room-id');
      
      const message = $message.val();
      
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1);
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();

      const createdDate = `${year}/${month}/${day} ${hour}:${minute}:${second}`;

      $.post(
        `/rooms/room?roomId=${roomId}`,
        {
          message: message,
          createdDate: createdDate
        }
      );
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

    const message = escape($message.val());

    const post = {
      text: message,
      createdDate: createdDate
    };

    socket.emit('post', post);
    $message.val('');
  });
});

function escape (str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/>/g, '&gt;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/"/g, '&quot;');
  str = str.replace(/'/g, '&#x27;');
  str = str.replace(/`/g, '&#x60;');
  return str;
}