/* eslint-disable no-undef */
$(() => {
  const socket = io();
  const $messages = $('[data-js-selector=messages]');
  const $messageform = $('[data-js-selector=messageform]');
  const $message = $('[data-js-selector=message]');

  const listenEvent = () => {
    socket.on('post', (post) => {
      const text = `<p>${post.text},<br>${post.createdDate}</p>`;
      $messages.append(text);
    });
  };

  listenEvent();

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