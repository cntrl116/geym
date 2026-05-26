class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new World();
    this.player = new Player();
    this.renderer = new Renderer(canvas);
    this.ui = new UI();
    this.keys = {};
    this.totalItemsProduced = 0;
    this.lastTime = 0;
  }

  init() {
    this.world.init();
    this.world.onItemProduced = (type) => {
      this.totalItemsProduced++;
      if (type === ITEM_TYPES.IRON_PLATE) this.player.inventory.iron_plate++;
      else if (type === ITEM_TYPES.COPPER_PLATE) this.player.inventory.copper_plate++;
      else if (type === ITEM_TYPES.CIRCUIT_BOARD) this.player.inventory.circuit_board++;
    };
    this.setupInput();
    this.renderer.loadSprites();
    this.tryAutoLoad();
  }

  setupInput() {
    this.hoverCol = -1;
    this.hoverRow = -1;

    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (['w', 'W', 'ArrowUp', 's', 'S', 'ArrowDown',
           'a', 'A', 'ArrowLeft', 'd', 'D', 'ArrowRight',
           'e', 'E', 'q', 'Q', 'f', 'F', 'g', 'G',
           'h', 'H', 'j', 'J',
           'k', 'K', 'l', 'L', 'r', 'R'].includes(key)) {
        e.preventDefault();
      }
      this.keys[key] = true;
      this.handleKeyDown(key);
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const c = Math.floor(mx / TILE_SIZE);
      const r = Math.floor(my / TILE_SIZE);
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        this.hoverCol = c;
        this.hoverRow = r;
      } else {
        this.hoverCol = -1;
        this.hoverRow = -1;
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCol = -1;
      this.hoverRow = -1;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.hoverCol < 0 || this.hoverRow < 0) return;
      if (e.button === 2) {
        if (this.player.buildFurnaceAt(this.hoverCol, this.hoverRow, this.world)) {
          this.ui.notify('Печь построена');
        } else {
          this.ui.notify('Нужна руда или место занято');
        }
      } else if (e.button === 0) {
        if (this.player.buildConveyorAt(this.hoverCol, this.hoverRow, this.world)) {
          this.ui.notify('Конвейер построен');
        }
      }
    });
  }

  handleKeyDown(key) {
    try {
      switch (key) {
        case 'w': case 'W': case 'ArrowUp': {
          const r = this.player.move(0, -1, this.world);
          if (r === 'ore') this.ui.notify('+1 Fe');
          else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          break;
        }
        case 's': case 'S': case 'ArrowDown': {
          const r = this.player.move(0, 1, this.world);
          if (r === 'ore') this.ui.notify('+1 Fe');
          else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          break;
        }
        case 'a': case 'A': case 'ArrowLeft': {
          const r = this.player.move(-1, 0, this.world);
          if (r === 'ore') this.ui.notify('+1 Fe');
          else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          break;
        }
        case 'd': case 'D': case 'ArrowRight': {
          const r = this.player.move(1, 0, this.world);
          if (r === 'ore') this.ui.notify('+1 Fe');
          else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          break;
        }
        case 'q': case 'Q':
          this.player.cycleDirection();
          this.ui.notify(`Направление: ${DIR_NAMES[this.player.direction]}`);
          break;
        case 'e': case 'E': {
          const r = this.player.collectOreAdjacent(this.world);
          if (r === 'iron_ore') this.ui.notify('+1 Fe');
          else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          else if (!r) this.ui.notify('Нет руды рядом');
          break;
        }
        case 'f': case 'F':
          if (this.player.buildConveyor(this.world)) {
            this.ui.notify('Конвейер построен');
          } else {
            this.ui.notify('Нужна руда или место занято');
          }
          break;
        case 'g': case 'G':
          if (this.player.buildFurnace(this.world)) {
            this.ui.notify('Печь построена');
          } else {
            this.ui.notify('Нужна руда или место занято');
          }
          break;
        case 'h': case 'H':
          if (this.player.buildDrill(this.world)) {
            this.ui.notify('Бур построен');
          } else {
            this.ui.notify('Нужна руда или место занято');
          }
          break;
        case 'j': case 'J':
          if (this.player.buildAssembler(this.world)) {
            this.ui.notify('Сборщик построен');
          } else {
            this.ui.notify('Нужна руда или место занято');
          }
          break;
        case 'k': case 'K':
          this.saveGame();
          break;
        case 'l': case 'L':
          this.loadGame();
          break;
        case 'r': case 'R':
          this.resetGame();
          break;
      }
    } catch (err) {
      this.ui.notify('ERR: ' + err.message);
    }
  }

  update(dt) {
    this.world.update(dt);
  }

  render() {
    try {
      this.renderer.clear();
      this.renderer.renderWorld(this.world);
      this.renderer.renderHover(this.hoverCol, this.hoverRow);
      this.renderer.renderPlayer(this.player);

      let buildInfo = '';
      buildInfo += `Направление: ${DIR_NAMES[this.player.direction]}`;
      this.ui.update(
        this.player.inventory,
        this.totalItemsProduced,
        this.player.col, this.player.row,
        false, buildInfo
      );
    } catch (err) {
      this.ui.notify('RENDER ERR: ' + err.message);
    }
  }

  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.update(Math.min(dt, 100));
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.init();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  tryAutoLoad() {
    try {
      const raw = localStorage.getItem('gejmSave');
      if (raw) {
        const data = JSON.parse(raw);
        this.deserialize(data);
        this.ui.notify('Загружено автосохранение');
      }
    } catch (_) {}
  }

  serialize() {
    return {
      world: this.world.serialize(),
      player: {
        col: this.player.col,
        row: this.player.row,
        direction: this.player.direction,
        inventory: { ...this.player.inventory },
      },
      totalItemsProduced: this.totalItemsProduced,
    };
  }

  deserialize(data) {
    if (data.world) this.world.deserialize(data.world);
    if (data.player) {
      this.player.col = data.player.col;
      this.player.row = data.player.row;
      this.player.direction = data.player.direction;
      this.player.inventory = { ...this.player.inventory, ...data.player.inventory };
    }
    this.totalItemsProduced = data.totalItemsProduced || 0;
    this.world.onItemProduced = (type) => {
      this.totalItemsProduced++;
      if (type === ITEM_TYPES.IRON_PLATE) this.player.inventory.iron_plate++;
      else if (type === ITEM_TYPES.COPPER_PLATE) this.player.inventory.copper_plate++;
      else if (type === ITEM_TYPES.CIRCUIT_BOARD) this.player.inventory.circuit_board++;
    };
  }

  saveGame() {
    const data = this.serialize();
    localStorage.setItem('gejmSave', JSON.stringify(data));
    this.ui.updateSaveLoad('Сохранено (S)');
    this.ui.notify('Игра сохранена');
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('gejmSave');
      if (!raw) { this.ui.notify('Нет сохранения'); return; }
      const data = JSON.parse(raw);
      this.deserialize(data);
      this.ui.notify('Игра загружена');
    } catch (e) {
      this.ui.notify('Ошибка загрузки');
    }
  }

  resetGame() {
    localStorage.removeItem('gejmSave');
    this.totalItemsProduced = 0;
    this.player = new Player();
    this.world = new World();
    this.world.init();
    this.world.onItemProduced = (type) => {
      this.totalItemsProduced++;
      if (type === ITEM_TYPES.IRON_PLATE) this.player.inventory.iron_plate++;
      else if (type === ITEM_TYPES.COPPER_PLATE) this.player.inventory.copper_plate++;
      else if (type === ITEM_TYPES.CIRCUIT_BOARD) this.player.inventory.circuit_board++;
    };
    this.ui.notify('Мир сброшен');
  }
}
