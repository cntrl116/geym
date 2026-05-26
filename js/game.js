class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new World();
    this.player = new Player();
    this.renderer = new Renderer(canvas);
    this.ui = new UI();
    this.keys = {};
    this.totalPlatesProduced = 0;
    this.lastTime = 0;
    this.ready = false;
  }

  init() {
    this.world.init();
    this.setupInput();
    this.renderer.loadSprites(() => {
      this.ready = true;
    });
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.handleKeyDown(e.key);
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  handleKeyDown(key) {
    switch (key) {
      case 'w': case 'W': case 'ArrowUp':
        this.player.move(0, -1, this.world); break;
      case 's': case 'S': case 'ArrowDown':
        this.player.move(0, 1, this.world); break;
      case 'a': case 'A': case 'ArrowLeft':
        this.player.move(-1, 0, this.world); break;
      case 'd': case 'D': case 'ArrowRight':
        this.player.move(1, 0, this.world); break;
      case 'q': case 'Q':
        this.player.cycleDirection(); break;
      case 'e': case 'E':
        this.collectOre(); break;
    }
  }

  collectOre() {
    const dir = DIR_VEC[this.player.direction];
    const checks = [
      { col: this.player.col + dir.x, row: this.player.row + dir.y },
      { col: this.player.col + 1, row: this.player.row },
      { col: this.player.col - 1, row: this.player.row },
      { col: this.player.col, row: this.player.row + 1 },
      { col: this.player.col, row: this.player.row - 1 },
    ];
    for (const c of checks) {
      const tile = this.world.getTile(c.col, c.row);
      if (tile && tile.type === 'iron_ore') {
        this.world.setTile(c.col, c.row, { type: 'empty' });
        this.player.inventory.iron_ore++;
        this.ui.notify('+1 руда');
        return;
      }
    }
    this.ui.notify('Нет руды рядом');
  }

  update(dt) {
  }

  render() {
    this.renderer.clear();
    this.renderer.renderWorld(this.world);
    this.renderer.renderPlayer(this.player);
    this.ui.update(this.player.inventory, this.totalPlatesProduced);
  }

  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.init();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
}
