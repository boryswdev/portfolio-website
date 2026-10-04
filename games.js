(function () {
  'use strict';

  window.initializeMiniGames = function initializeMiniGames() {
    if (window.miniGamesInitialized) return;
    if (!window.Phaser) {
      document.getElementById('snake-status').textContent = 'game engine unavailable';
      return;
    }

    window.miniGamesInitialized = true;

    class SnakeScene extends Phaser.Scene {
      constructor() {
        super('SnakeScene');
      }

      create() {
        this.columns = 25;
        this.rows = 15;
        this.cell = 24;
        this.body = [];
        this.renderFrom = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.best = 0;
        this.stepTime = 0;
        this.gameElapsed = 0;
        this.active = false;
        this.paused = false;
        this.board = this.add.graphics();
        this.hiringPhrases = [
          'currently accepting interesting problems',
          'i read the error message first',
          'the refactor was intentional',
          'less guesswork, more git diff',
          'it passed locally and in CI',
          'comments save future-me time',
          'one bug down, regression test added',
          'yes, i wrote a test for that',
          'works on my machine; pending review'
        ];
        this.lastPhrase = '';
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.addCapture([
          Phaser.Input.Keyboard.KeyCodes.UP,
          Phaser.Input.Keyboard.KeyCodes.DOWN,
          Phaser.Input.Keyboard.KeyCodes.LEFT,
          Phaser.Input.Keyboard.KeyCodes.RIGHT,
          Phaser.Input.Keyboard.KeyCodes.SPACE
        ]);
        try {
          this.best = Number(localStorage.getItem('portfolio-snake-best')) || 0;
        } catch (_error) {
          this.best = 0;
        }
        this.game.canvas.setAttribute('tabindex', '0');
        this.game.canvas.setAttribute('role', 'application');
        this.game.canvas.setAttribute('aria-label', 'Snake game. Use arrow keys or W A S D to move.');
        this.game.canvas.addEventListener('keydown', (event) => {
          if (event.code !== 'Space' || event.repeat) return;
          event.preventDefault();
          this.togglePause();
        });
        this.input.on('pointerdown', () => this.game.canvas.focus());
        this.paintBoard();
        this.showOverlay('SNAKE', 'press start  /  arrows or WASD');
      }

      paintBoard() {
        this.board.clear();
        this.board.fillStyle(0xe6f1df, 1);
        this.board.fillRect(0, 0, 600, 360);
        this.board.lineStyle(1, 0xd3e4ca, 0.8);
        for (let x = 0; x <= 600; x += this.cell) {
          this.board.lineBetween(x, 0, x, 360);
        }
        for (let y = 0; y <= 360; y += this.cell) {
          this.board.lineBetween(0, y, 600, y);
        }
      }

      showOverlay(title, message) {
        this.overlay?.destroy();
        this.overlay = this.add.container(300, 180, [
          this.add.rectangle(0, 0, 600, 360, 0xf6faef, 0.84),
          this.add.text(0, -16, title, {
            fontFamily: 'Iconoplastic, sans-serif',
            fontSize: '25px',
            color: '#28633d',
            fontStyle: 'bold'
          }).setOrigin(0.5),
          this.add.text(0, 18, message, {
            fontFamily: 'Iconoplastic, sans-serif',
            fontSize: '12px',
            color: '#4a604c'
          }).setOrigin(0.5)
        ]).setDepth(5);
      }

      startGame() {
        this.body = [
          { x: 10, y: 7 },
          { x: 9, y: 7 },
          { x: 8, y: 7 },
          { x: 7, y: 7 }
        ];
        this.renderFrom = this.body.map((part) => ({ ...part }));
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.stepTime = 0;
        this.gameElapsed = 0;
        this.active = true;
        this.paused = false;
        this.game.canvas.focus();
        this.overlay?.destroy();
        this.placeFood();
        document.getElementById('snake-score').textContent = '0';
        document.getElementById('snake-best').textContent = String(this.best);
        document.getElementById('snake-status').textContent = 'playing';
        document.getElementById('snake-pause').disabled = false;
        document.getElementById('snake-pause').textContent = 'pause';
        document.getElementById('snake-pause').setAttribute('aria-label', 'Pause Snake');
        this.drawGame();
        this.showHiringPhrase();
      }

      showHiringPhrase() {
        const choices = this.hiringPhrases.filter((phrase) => phrase !== this.lastPhrase);
        const phrase = Phaser.Utils.Array.GetRandom(choices);
        const label = document.getElementById('snake-phrase');
        this.lastPhrase = phrase;
        label.textContent = phrase;
        label.classList.add('visible');
        window.clearTimeout(this.phraseTimeout);
        this.phraseTimeout = window.setTimeout(() => label.classList.remove('visible'), 1500);
      }

      togglePause() {
        if (!this.active) return;
        this.paused = !this.paused;
        const pauseButton = document.getElementById('snake-pause');
        pauseButton.textContent = this.paused ? 'resume' : 'pause';
        pauseButton.setAttribute('aria-label', this.paused ? 'Resume Snake' : 'Pause Snake');
        document.getElementById('snake-status').textContent = this.paused ? 'paused' : 'playing';
        if (this.paused) this.showOverlay('PAUSED', 'press space or resume');
        else this.overlay?.destroy();
      }

      placeFood() {
        do {
          this.food = {
            x: Phaser.Math.Between(0, this.columns - 1),
            y: Phaser.Math.Between(0, this.rows - 1)
          };
        } while (this.body.some((part) => part.x === this.food.x && part.y === this.food.y));
      }

      queueDirection(direction) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[direction] !== this.direction) this.nextDirection = direction;
      }

      readInput() {
        if (this.cursors.up.isDown || this.wasd.up.isDown) this.queueDirection('up');
        else if (this.cursors.down.isDown || this.wasd.down.isDown) this.queueDirection('down');
        else if (this.cursors.left.isDown || this.wasd.left.isDown) this.queueDirection('left');
        else if (this.cursors.right.isDown || this.wasd.right.isDown) this.queueDirection('right');
      }

      update(_time, delta) {
        if (!this.active || this.paused) return;
        this.readInput();
        this.stepTime += delta;
        this.gameElapsed += delta;
        const stepDuration = Math.max(90, 145 - this.score * 2);
        while (this.stepTime >= stepDuration && this.active) {
          this.stepTime -= stepDuration;
          if (!this.advanceOneStep()) return;
        }
        this.drawGame(this.stepTime / stepDuration);
      }

      advanceOneStep() {
        this.direction = this.nextDirection;
        const vector = {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 }
        }[this.direction];
        const head = { x: this.body[0].x + vector.x, y: this.body[0].y + vector.y };
        const eating = head.x === this.food.x && head.y === this.food.y;
        const collisionBody = eating ? this.body : this.body.slice(0, -1);

        if (head.x < 0 || head.x >= this.columns || head.y < 0 || head.y >= this.rows || collisionBody.some((part) => part.x === head.x && part.y === head.y)) {
          this.endGame();
          return false;
        }

        this.renderFrom = this.body.map((part) => ({ ...part }));
        this.body.unshift(head);
        if (eating) {
          this.score += 1;
          this.showHiringPhrase();
          this.best = Math.max(this.best, this.score);
          try {
            localStorage.setItem('portfolio-snake-best', String(this.best));
          } catch (_error) {
            // Keep the current run playable when storage is unavailable.
          }
          document.getElementById('snake-score').textContent = String(this.score);
          document.getElementById('snake-best').textContent = String(this.best);
          this.placeFood();
        } else {
          this.body.pop();
        }
        return true;
      }

      drawGame(progress = 1) {
        this.paintBoard();
        if (!this.body.length) return;
        const interpolation = Phaser.Math.Clamp(progress, 0, 1);
        const positions = this.body.map((part, index) => {
          const previous = this.renderFrom[Math.min(index, this.renderFrom.length - 1)] || part;
          return {
            x: Phaser.Math.Linear(previous.x, part.x, interpolation),
            y: Phaser.Math.Linear(previous.y, part.y, interpolation)
          };
        });
        const pulse = 1 + Math.sin(this.gameElapsed / 170) * 0.1;
        this.board.fillStyle(0xb92d32, 1);
        this.board.fillCircle((this.food.x + 0.5) * this.cell, (this.food.y + 0.5) * this.cell, 8 * pulse);
        this.board.fillStyle(0xea4335, 1);
        this.board.fillCircle((this.food.x + 0.5) * this.cell, (this.food.y + 0.5) * this.cell, 5 * pulse);
        positions.forEach((part, index) => {
          this.board.fillStyle(index === 0 ? 0x34a853 : 0x69b75c, 1);
          this.board.fillRoundedRect(part.x * this.cell + 2, part.y * this.cell + 2, this.cell - 4, this.cell - 4, 9);
        });
        const head = positions[0];
        const vectors = {
          up: { x: 0, y: -1, px: 1, py: 0 },
          down: { x: 0, y: 1, px: -1, py: 0 },
          left: { x: -1, y: 0, px: 0, py: -1 },
          right: { x: 1, y: 0, px: 0, py: 1 }
        }[this.direction];
        const centerX = (head.x + 0.5) * this.cell + vectors.x * 5;
        const centerY = (head.y + 0.5) * this.cell + vectors.y * 5;
        this.board.fillStyle(0x17372d, 1);
        this.board.fillCircle(centerX + vectors.px * 4, centerY + vectors.py * 4, 2);
        this.board.fillCircle(centerX - vectors.px * 4, centerY - vectors.py * 4, 2);
      }

      endGame() {
        this.active = false;
        this.paused = false;
        document.getElementById('snake-pause').disabled = true;
        document.getElementById('snake-pause').textContent = 'pause';
        document.getElementById('snake-status').textContent = 'game over';
        this.showOverlay('GAME OVER', `score ${this.score}  /  best ${this.best}`);
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 600,
      height: 360,
      parent: 'snake-stage',
      backgroundColor: '#e6f1df',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 600,
        height: 360
      },
      render: { antialias: true, pixelArt: false },
      scene: [SnakeScene]
    });

    document.getElementById('snake-start').addEventListener('click', () => game.scene.getScene('SnakeScene').startGame());
    document.getElementById('snake-restart').addEventListener('click', () => game.scene.getScene('SnakeScene').startGame());
    document.getElementById('snake-pause').addEventListener('click', () => game.scene.getScene('SnakeScene').togglePause());

  };
})();