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
  }

  init() {
    this.world.init();
    this.setupInput();
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
    }
  }

  update(dt) {
  }

  render() {
    this.renderer.clear();
    this.renderer.renderGrid();
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
