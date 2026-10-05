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
  if (e.target instanceof Element && e.target.closest('.paint-notepad, .mini-game')) return;

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
    e.preventDefault();
  } else {
    return;
  }
  typedEl.textContent = buffer;
  terminalBody.scrollTop = terminalBody.scrollHeight;
});

renderTabs();

/* projects drawing notepad */
const drawingCanvas = document.getElementById('notepad-canvas');
const drawingContext = drawingCanvas?.getContext('2d');
const brushSizeInput = document.getElementById('brush-size');
const brushTool = document.getElementById('brush-tool');
const paintTool = document.getElementById('paint-tool');
const eraserTool = document.getElementById('eraser-tool');
const brushCursor = document.getElementById('brush-cursor');
const paintCursor = document.getElementById('paint-cursor');
const eraserCursor = document.getElementById('eraser-cursor');
const undoDrawingButton = document.getElementById('undo-drawing');
const clearDrawingButton = document.getElementById('clear-drawing');

if (drawingCanvas && drawingContext && brushSizeInput && brushTool && paintTool && eraserTool && brushCursor && paintCursor && eraserCursor && undoDrawingButton && clearDrawingButton) {
  let drawing = false;
  let brushColor = '#202020';
  let activeTool = 'brush';
  const undoStack = [];

  const canvasPoint = (event) => {
    const bounds = drawingCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * drawingCanvas.width / bounds.width,
      y: (event.clientY - bounds.top) * drawingCanvas.height / bounds.height
    };
  };

  const setBrush = () => {
    const bounds = drawingCanvas.getBoundingClientRect();
    drawingContext.strokeStyle = activeTool === 'eraser' ? '#ffffff' : brushColor;
    drawingContext.lineWidth = Number(brushSizeInput.value) * drawingCanvas.width / bounds.width;
    drawingContext.lineCap = 'round';
    drawingContext.lineJoin = 'round';
  };

  const updateToolCursor = (event) => {
    const bounds = drawingCanvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const size = Number(brushSizeInput.value);
    [brushCursor, paintCursor, eraserCursor].forEach((cursor) => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    });
    eraserCursor.style.width = `${size}px`;
    eraserCursor.style.height = `${size}px`;
    brushCursor.classList.toggle('visible', activeTool === 'brush');
    paintCursor.classList.toggle('visible', activeTool === 'paint');
    eraserCursor.classList.toggle('visible', activeTool === 'eraser');
  };

  const hideToolCursors = () => {
    [brushCursor, paintCursor, eraserCursor].forEach((cursor) => cursor.classList.remove('visible'));
  };

  drawingCanvas.addEventListener('pointerenter', updateToolCursor);
  drawingCanvas.addEventListener('pointermove', updateToolCursor);
  drawingCanvas.addEventListener('pointerleave', hideToolCursors);

  const saveUndoState = () => {
    undoStack.push(drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
    if (undoStack.length > 20) undoStack.shift();
    undoDrawingButton.disabled = false;
  };

  const fillCanvasAt = (event) => {
    const point = canvasPoint(event);
    const width = drawingCanvas.width;
    const height = drawingCanvas.height;
    const image = drawingContext.getImageData(0, 0, width, height);
    const pixels = image.data;
    const startX = Math.max(0, Math.min(width - 1, Math.floor(point.x)));
    const startY = Math.max(0, Math.min(height - 1, Math.floor(point.y)));
    const startOffset = (startY * width + startX) * 4;
    const target = Array.from(pixels.slice(startOffset, startOffset + 4));
    const fill = [
      Number.parseInt(brushColor.slice(1, 3), 16),
      Number.parseInt(brushColor.slice(3, 5), 16),
      Number.parseInt(brushColor.slice(5, 7), 16),
      255
    ];

    if (target.every((channel, index) => channel === fill[index])) return;

    const pending = new Uint32Array(width * height);
    let next = 0;
    let count = 0;
    const addPixel = (x, y) => {
      const pixel = y * width + x;
      const offset = pixel * 4;
      if (pixels[offset] !== target[0] || pixels[offset + 1] !== target[1] || pixels[offset + 2] !== target[2] || pixels[offset + 3] !== target[3]) return;
      pixels.set(fill, offset);
      pending[count++] = pixel;
    };

    saveUndoState();
    addPixel(startX, startY);
    while (next < count) {
      const pixel = pending[next++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      if (x > 0) addPixel(x - 1, y);
      if (x < width - 1) addPixel(x + 1, y);
      if (y > 0) addPixel(x, y - 1);
      if (y < height - 1) addPixel(x, y + 1);
    }
    drawingContext.putImageData(image, 0, 0);
  };

  const setActiveTool = (tool) => {
    activeTool = tool;
    [[brushTool, 'brush'], [paintTool, 'paint'], [eraserTool, 'eraser']].forEach(([button, name]) => {
      button.setAttribute('aria-pressed', String(activeTool === name));
    });
  };

  drawingCanvas.addEventListener('pointerdown', (event) => {
    if (activeTool === 'paint') {
      fillCanvasAt(event);
      return;
    }
    drawing = true;
    drawingCanvas.setPointerCapture(event.pointerId);
    saveUndoState();
    setBrush();
    const point = canvasPoint(event);
    drawingContext.beginPath();
    drawingContext.moveTo(point.x, point.y);
    drawingContext.lineTo(point.x + 0.01, point.y + 0.01);
    drawingContext.stroke();
  });

  drawingCanvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    const point = canvasPoint(event);
    drawingContext.lineTo(point.x, point.y);
    drawingContext.stroke();
  });

  const stopDrawing = () => {
    drawing = false;
    drawingContext.closePath();
  };

  drawingCanvas.addEventListener('pointerup', stopDrawing);
  drawingCanvas.addEventListener('pointercancel', stopDrawing);

  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      brushColor = swatch.dataset.color;
      document.querySelectorAll('.color-swatch').forEach((item) => {
        const selected = item === swatch;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
    });
  });

  brushTool.addEventListener('click', () => setActiveTool('brush'));
  paintTool.addEventListener('click', () => setActiveTool('paint'));
  eraserTool.addEventListener('click', () => setActiveTool('eraser'));

  undoDrawingButton.addEventListener('click', () => {
    const previousDrawing = undoStack.pop();
    if (!previousDrawing) return;
    drawingContext.putImageData(previousDrawing, 0, 0);
    undoDrawingButton.disabled = undoStack.length === 0;
  });

  clearDrawingButton.addEventListener('click', () => {
    undoStack.push(drawingContext.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height));
    if (undoStack.length > 20) undoStack.shift();
    drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    undoDrawingButton.disabled = false;
  });
}

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