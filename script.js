const typedEl = document.getElementById('typed');
const body = document.getElementById('terminal-body');
let buffer = '';

function focusTerminal() {
  window.focus();
}

body.addEventListener('click', focusTerminal);
focusTerminal();

window.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace') {
    buffer = buffer.slice(0, -1);
    e.preventDefault();
  } else if (e.key.length === 1) {
    buffer += e.key;
  } else {
    return;
  }
  typedEl.textContent = buffer;
  body.scrollTop = body.scrollHeight;
});
