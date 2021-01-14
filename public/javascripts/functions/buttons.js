function disableButton (e) {
  e.disabled = true;
  e.form.submit();
}

function confirmButton () {
  if (window.confirm('本当に削除しますか')) {
    return true;
  } else {
    return false;
  }
}