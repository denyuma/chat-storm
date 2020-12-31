const btnSubmit_onclick = function (event) {
  const $submit = $(this);
  const $form = $submit.parents('form');
  $form.attr('method', $submit.data('method'));
  $form.attr('action', $submit.data('action'));
  $form.submit();
  $submit.off().prop('disabled', true);
  $form.on('submit', false);
};

const document_onready = function (event) {
  $('input[type="submit"').on('click', btnSubmit_onclick);
};

$(document).ready(document_onready);
