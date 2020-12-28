'use strict';
/* eslint-disable no-undef */
import $ from '../third_party/jquery/jquery.js';

$(() => {
  const socket = io();
  console.log('hoge');
  const $messages = $('[data-js-selector=messages]');
  const $messageform = $('[data-js-selector=messageform]');
  const $message = $('[data-js-selector=message]');

  socket.on('post', (post) => {
    const text = `<p>${post.text} <br> ${post.createdDate}</p>`;
    $messages.append(text);
  });


  $messageform.submit((e) => {
    e.preventDefault();

    const post = {
      text: $message.val(),
      createdDate: new Date()
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