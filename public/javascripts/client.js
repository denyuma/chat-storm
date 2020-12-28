'use strict';
/* eslint-disable no-undef */
$(() => {
  const socket = io();
  const $messages = $('[data-js-selector=messages]');
  const $messageform = $('[data-js-selector=messageform]');
  const $message = $('[data-js-selector=message]');

  socket.on('post', (post) => {
    const text = `<div> <p>${post.text}</p> <p>${post.createdDate}</p> </div>`;
    $messages.append(text);
  });

  $('.message-send-button').each((i, e) => {
    const button = $(e);

    button.click(() => {
      const roomName = button.data('room-name');
      const roomId = button.data('room-id');
      const roomPassword = button.data('room-password');
      const message = $message.val();
      console.log(message);

      $.post(
        `/room?roomName=${roomName}&roomId=${roomId}&roomPassword=${roomPassword}`,
        { message: message }
      );
    });
  });


  $messageform.submit((e) => {
    e.preventDefault();

    const post = {
      text: $message.val(),
      createdDate: new Date().toISOString
    };

    socket.emit('post', post);
    $message.val('');
  });
});


// const socket = io();

// document.querySelector('#messageform').addEventListener('submit', (e) => {
//   e.preventDefault();

//   const message = document.querySelector('#message');

//   socket.emit('post', {text: message.value});

//   message.value = '';
// });

// socket.on('post', (message) => {
//   const messages = document.querySelector('#messages');
//   const li = document.createElement('li');
//   li.innerHTML = `${message.text}`;
//   messages.insertBefore(li, messages.firstChild);
// });

// window.onload = () => {
//   document.querySelector('#message').focus();
// };