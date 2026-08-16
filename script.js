/* terminal typing */
const typedEl = document.getElementById('typed');
const terminalBody = document.getElementById('terminal-body');
let buffer = '';

const folders = ['aboutme', 'contactme', 'main', 'projects'];
let currentFolder = 'main';

function focusTerminal() {
  window.focus();
}

terminalBody.addEventListener('click', focusTerminal);
focusTerminal();

function submitCommand() {
  const promptLine = document.querySelector('.prompt-line');
  const cmd = buffer.trim();

  const finishedLine = document.createElement('div');
  finishedLine.className = 'line';
  finishedLine.textContent = `borys@portfolio:~$ ${buffer}`;
  terminalBody.insertBefore(finishedLine, promptLine);

  if (cmd === 'pwd') {
    const output = document.createElement('div');
    output.className = 'line';
    output.textContent = '/home';
    terminalBody.insertBefore(output, promptLine);
  } else if (cmd === 'ls') {
    const output = document.createElement('div');
    output.className = 'line';
    output.innerHTML = folders
      .map(f => (f === currentFolder ? `<span class="ls-current">${f}</span>` : f))
      .join('  ');
    terminalBody.insertBefore(output, promptLine);
  }

  buffer = '';
  typedEl.textContent = '';
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace') {
    buffer = buffer.slice(0, -1);
    e.preventDefault();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    submitCommand();
    return;
  } else if (e.key.length === 1) {
    buffer += e.key;
  } else {
    return;
  }
  typedEl.textContent = buffer;
  terminalBody.scrollTop = terminalBody.scrollHeight;
});

/* heading letters fall into place on load */
function buildFallingHeading() {
  const heading = document.getElementById('heading');
  const plain = "hi, i'm ";
  const name = "borys";
  heading.innerHTML = '';

  const makeLetter = (ch, index, highlighted) => {
    const span = document.createElement('span');
    span.className = highlighted ? 'letter highlight' : 'letter';
    span.style.animationDelay = `${index * 0.045}s`;
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    return span;
  };

  [...plain].forEach((ch, i) => heading.appendChild(makeLetter(ch, i, false)));
  [...name].forEach((ch, i) => heading.appendChild(makeLetter(ch, plain.length + i, true)));
}

buildFallingHeading();

/* folder collapse / expand */
const collapseBtn = document.getElementById('collapse-btn');
const pageContent = document.getElementById('page-content');
const folderMenu = document.getElementById('folder-menu');
const explorerBar = document.getElementById('explorer-bar');

function closeFolder() {
  pageContent.classList.add('closing');
  pageContent.addEventListener('animationend', function handler() {
    pageContent.classList.remove('closing');
    pageContent.classList.add('hidden');
    explorerBar.style.display = 'none';
    folderMenu.classList.add('visible');
    pageContent.removeEventListener('animationend', handler);
  });
}

function openFolder() {
  folderMenu.classList.remove('visible');
  explorerBar.style.display = 'flex';
  pageContent.classList.remove('hidden');
  pageContent.classList.add('opening');
  pageContent.addEventListener('animationend', function handler() {
    pageContent.classList.remove('opening');
    pageContent.removeEventListener('animationend', handler);
  });
}

collapseBtn.addEventListener('click', closeFolder);

folderMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.folder-item');
  if (!item) return;
  if (item.dataset.folder === 'main') {
    openFolder();
  }
});