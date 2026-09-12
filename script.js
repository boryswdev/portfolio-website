/* terminal typing */
const typedEl = document.getElementById('typed');
const terminalBody = document.getElementById('terminal-body');
const currentPathEl = document.getElementById('current-path');
const tabsContainer = document.getElementById('tabs-container');
let buffer = '';

const folders = ['main', 'aboutme', 'projects', 'contactme'];
let currentFolder = 'main';
let openTabs = ['main'];

let cmdHistory = [];
let historyIndex = -1;

function focusTerminal() {
  window.focus();
}

if (terminalBody) {
  terminalBody.addEventListener('click', focusTerminal);
  focusTerminal();
}

function buildPromptPrefix(folder) {
  const wrapper = document.createElement('span');
  wrapper.className = 'prompt-prefix';
  const host = document.createElement('span');
  host.className = 'host';
  host.textContent = 'borys@portfolio';
  const path = document.createElement('span');
  path.className = 'path';
  path.textContent = `~/${folder}`;
  wrapper.append(host, ':', path, '$ ');
  return wrapper;
}

function printLine(text, className) {
  if (!terminalBody) return;
  const promptLine = terminalBody.querySelector('.prompt-line');
  const output = document.createElement('div');
  output.className = className ? `line ${className}` : 'line';
  output.textContent = text;
  terminalBody.insertBefore(output, promptLine);
}

/* ---------- tabs ---------- */

function renderTabs() {
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  openTabs.forEach((folder) => {
    const tab = document.createElement('button');
    tab.className = folder === currentFolder ? 'tab active' : 'tab';
    tab.dataset.folder = folder;

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = '📁';

    const label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = folder;

    tab.append(icon, label);

    if (openTabs.length > 1) {
      const close = document.createElement('span');
      close.className = 'tab-close';
      close.textContent = '×';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(folder);
      });
      tab.appendChild(close);
    }

    tab.addEventListener('click', () => switchFolder(folder));
    tabsContainer.appendChild(tab);
  });
}

function switchFolder(folder) {
  currentFolder = folder;
  if (currentPathEl) currentPathEl.textContent = `~/${folder}`;

  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.dataset.view === folder);
  });

  renderTabs();
}

function openTab(folder) {
  if (!folders.includes(folder)) return;
  if (!openTabs.includes(folder)) openTabs.push(folder);
  switchFolder(folder);
}

function closeTab(folder) {
  const idx = openTabs.indexOf(folder);
  if (idx === -1 || openTabs.length === 1) return;
  openTabs.splice(idx, 1);
  if (currentFolder === folder) {
    switchFolder(openTabs[Math.max(0, idx - 1)]);
  } else {
    renderTabs();
  }
}

/* ---------- commands ---------- */

function submitCommand() {
  if (!terminalBody) return;
  const promptLine = terminalBody.querySelector('.prompt-line');
  if (!promptLine) return;
  const raw = buffer.trim();
  const [cmd, ...args] = raw.split(/\s+/).filter(Boolean);

  const finishedLine = document.createElement('div');
  finishedLine.className = 'line';
  finishedLine.appendChild(buildPromptPrefix(currentFolder));
  finishedLine.appendChild(document.createTextNode(buffer));
  terminalBody.insertBefore(finishedLine, promptLine);

  if (raw) {
    cmdHistory.push(raw);
    historyIndex = cmdHistory.length;
  }

  if (!cmd) {
    // just an empty enter, do nothing
  } else if (cmd === 'pwd') {
    printLine(`/home/borys/${currentFolder}`);
  } else if (cmd === 'ls') {
    const output = document.createElement('div');
    output.className = 'line';
    output.innerHTML = folders
      .map(f => (f === currentFolder ? `<span class="ls-current">${f}</span>` : f))
      .join('  ');
    terminalBody.insertBefore(output, promptLine);
  } else if (cmd === 'cd') {
    const target = args[0];
    if (!target || target === '~') {
      openTab('main');
    } else if (folders.includes(target)) {
      openTab(target);
    } else {
      printLine(`bash: cd: ${target}: No such file or directory`, 'line-error');
    }
  } else if (cmd === 'clear') {
    terminalBody.querySelectorAll('.line').forEach((line) => line.remove());
  } else {
    printLine(`bash: ${cmd}: command not found`, 'line-error');
  }

  buffer = '';
  if (typedEl) typedEl.textContent = '';
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

window.addEventListener('keydown', (e) => {
  if (!typedEl || !terminalBody) return;

  if (e.key === 'Backspace') {
    buffer = buffer.slice(0, -1);
    e.preventDefault();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    submitCommand();
    return;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdHistory.length === 0) return;
    historyIndex = Math.max(0, historyIndex - 1);
    buffer = cmdHistory[historyIndex] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (cmdHistory.length === 0) return;
    historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
    buffer = cmdHistory[historyIndex] || '';
  } else if (e.key.length === 1) {
    buffer += e.key;
  } else {
    return;
  }
  typedEl.textContent = buffer;
  terminalBody.scrollTop = terminalBody.scrollHeight;
});

renderTabs();

/* heading letters fall into place on load */
function buildFallingHeading() {
  const heading = document.getElementById('heading');
  if (!heading) return;
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

if (collapseBtn && pageContent && folderMenu && explorerBar) {
  const closeFolder = () => {
    pageContent.classList.add('closing');
    pageContent.addEventListener('animationend', function handler() {
      pageContent.classList.remove('closing');
      pageContent.classList.add('hidden');
      explorerBar.style.display = 'none';
      folderMenu.classList.add('visible');
      pageContent.removeEventListener('animationend', handler);
    });
  };

  const openFolder = () => {
    folderMenu.classList.remove('visible');
    explorerBar.style.display = 'flex';
    pageContent.classList.remove('hidden');
    pageContent.classList.add('opening');
    pageContent.addEventListener('animationend', function handler() {
      pageContent.classList.remove('opening');
      pageContent.removeEventListener('animationend', handler);
    });
  };

  collapseBtn.addEventListener('click', closeFolder);

  folderMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.folder-item');
    if (!item) return;
    openFolder();
    openTab(item.dataset.folder);
  });
}