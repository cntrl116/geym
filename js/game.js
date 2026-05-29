class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.ui = new UI();
    this.keys = {};
    this.lastTime = 0;
    this.state = 'menu';
    this.menuSection = 'main';
    this.deathTimer = 0;
    this.world = null;
    this.player = null;
    this.totalItemsProduced = 0;
    this.miningEffects = [];
    this.buildMenuOpen = false;
    this.buildMode = null;
  }

  startGame() {
    this.world = new World();
    this.player = new Player();
    this.totalItemsProduced = 0;
    this.miningEffects = [];
    this.world.spawnCol = this.player.col;
    this.world.spawnRow = this.player.row;
    this.world.init();
    this.renderer.camX = this.canvas.width / 2 - this.player.col * TILE_SIZE - TILE_SIZE / 2;
    this.renderer.camY = this.canvas.height / 2 - this.player.row * TILE_SIZE - TILE_SIZE / 2;
    this.renderer.setCamera(this.renderer.camX, this.renderer.camY);
    this.world.onItemProduced = (type) => {
      this.totalItemsProduced++;
      if (type === ITEM_TYPES.IRON_PLATE) this.player.inventory.iron_plate++;
      else if (type === ITEM_TYPES.COPPER_PLATE) this.player.inventory.copper_plate++;
      else if (type === ITEM_TYPES.CIRCUIT_BOARD) this.player.inventory.circuit_board++;
      else if (type === ITEM_TYPES.IRON_GEAR) this.player.inventory.iron_gear++;
    };
    this.world.onPlayerHit = (dmg) => {
      this.player.hp -= dmg;
      this.ui.notify('Атакован! ❤' + this.player.hp);
      if (this.player.hp <= 0) {
        this.gameOver();
      }
    };
    this.world.onEnemyKilled = () => {
      this.player.inventory.iron_ore += 2;
      this.ui.notify('Враг уничтожен! +2 Fe');
    };
    this.world.onWaveStart = (num, count) => {
      this.ui.notify('ВОЛНА ' + num + '! Врагов: ' + count);
    };
    this.state = 'playing';
  }

  start() {
    this.setupInput();
    this.renderer.loadSprites(() => {
      this.state = 'menu';
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    });
  }

  gameOver() {
    this.state = 'death';
    this.deathTimer = 2000;
  }

  setupInput() {
    this.hoverCol = -1;
    this.hoverRow = -1;

    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (['w', 'W', 'ArrowUp', 's', 'S', 'ArrowDown',
           'a', 'A', 'ArrowLeft', 'd', 'D', 'ArrowRight',
           'e', 'E', 'q', 'Q', 'f', 'F', 'g', 'G',
           'h', 'H', 'j', 'J', 't', 'T',
           'k', 'K', 'l', 'L', 'r', 'R', 'Escape'].includes(key)) {
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
      const c = Math.floor((mx - this.renderer.offsetX) / TILE_SIZE);
      const r = Math.floor((my - this.renderer.offsetY) / TILE_SIZE);
      this.hoverCol = c;
      this.hoverRow = r;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCol = -1;
      this.hoverRow = -1;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing' || !this.player || !this.world) return;

      if (this.buildMenuOpen) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hit = this.getMenuItemAt(mx, my);
        if (hit) {
          this.selectBuilding(hit);
          return;
        }
        return;
      }

      if (this.buildMode) {
        if (this.hoverCol < 0 || this.hoverRow < 0) return;
        this.placeInBuildMode(this.hoverCol, this.hoverRow);
        return;
      }

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
    if (this.state === 'menu') {
      if (key === 'Enter') {
        if (this.menuSection === 'main') this.startGame();
        else this.menuSection = 'main';
      } else if (key === 'i' || key === 'I') {
        this.menuSection = this.menuSection === 'main' ? 'instructions' : 'main';
      }
      return;
    }
    if (this.state === 'gameover') {
      if (key === 'r' || key === 'R') this.startGame();
      else if (key === 'm' || key === 'M') this.state = 'menu';
      return;
    }
    if (this.state === 'death') return;

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
          this.buildMenuOpen = !this.buildMenuOpen;
          if (this.buildMenuOpen) {
            this.buildMode = null;
            this.ui.notify('Меню построек [Q]');
          } else {
            this.ui.notify('');
          }
          break;
        case 'Escape':
          if (this.buildMenuOpen) {
            this.buildMenuOpen = false;
            this.ui.notify('');
          } else if (this.buildMode) {
            this.buildMode = null;
            this.ui.notify('Режим стройки отменён');
          }
          break;
        case 'e': case 'E': {
          const r = this.player.collectOreAdjacent(this.world);
          if (r) {
            this.miningEffects.push({ col: this.player.lastMinedCol, row: this.player.lastMinedRow, timer: 400 });
            if (r === 'iron_ore') this.ui.notify('+1 Fe');
            else if (r === 'copper_ore') this.ui.notify('+1 Cu');
          } else {
            const f = this.player.feedFurnace(this.world);
            if (f) {
              this.miningEffects.push({ col: this.player.lastMinedCol, row: this.player.lastMinedRow, timer: 400 });
              if (f === 'iron_ore') this.ui.notify('Руда загружена в печь (Fe)');
              else this.ui.notify('Руда загружена в печь (Cu)');
            } else {
              this.ui.notify('Нет руды рядом');
            }
          }
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
        case 't': case 'T':
          if (this.player.buildTurret(this.world)) {
            this.ui.notify('Турель построена');
          } else {
            this.ui.notify('Нужна пластина или место занято');
          }
          break;
        case 'y': case 'Y':
          if (this.player.buildWall(this.world)) {
            this.ui.notify('Стена построена');
          } else {
            this.ui.notify('Нужна пластина или место занято');
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

  getMenuItemAt(mx, my) {
    const cols = 2;
    const rows = Math.ceil(BUILDING_DEFS.length / cols);
    const cellW = 160;
    const cellH = 110;
    const pad = 10;
    const menuW = cols * cellW + (cols + 1) * pad;
    const menuH = rows * cellH + (rows + 1) * pad;
    const startX = (this.canvas.width - menuW) / 2;
    const startY = this.canvas.height - menuH - 30;

    for (let i = 0; i < BUILDING_DEFS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + pad + col * (cellW + pad);
      const cy = startY + pad + row * (cellH + pad);
      if (mx >= cx && mx <= cx + cellW && my >= cy && my <= cy + cellH) {
        return BUILDING_DEFS[i].id;
      }
    }
    return null;
  }

  selectBuilding(id) {
    const def = BUILDING_DEFS.find(b => b.id === id);
    if (!def) return;
    if (!this.canAffordBuild(id)) {
      this.ui.notify('Не хватает ресурсов для ' + def.name);
      return;
    }
    this.buildMode = id;
    this.buildMenuOpen = false;
    this.ui.notify('Строю: ' + def.name + ' [ЛКМ — поставить, Esc — отмена]');
  }

  canAffordBuild(id) {
    const def = BUILDING_DEFS.find(b => b.id === id);
    if (!def) return false;
    for (const [item, amount] of Object.entries(def.costs)) {
      if ((this.player.inventory[item] || 0) < amount) return false;
    }
    return true;
  }

  deductBuildCost(id) {
    const def = BUILDING_DEFS.find(b => b.id === id);
    if (!def) return;
    for (const [item, amount] of Object.entries(def.costs)) {
      this.player.inventory[item] -= amount;
    }
  }

  placeInBuildMode(col, row) {
    if (!this.buildMode) return;
    const tile = this.world.getTile(col, row);
    if (tile.type !== TILE_TYPES.EMPTY) {
      this.ui.notify('Тайл занят');
      return;
    }
    if (!this.canAffordBuild(this.buildMode)) {
      this.ui.notify('Не хватает ресурсов');
      return;
    }

    const def = BUILDING_DEFS.find(b => b.id === this.buildMode);
    let success = false;

    switch (this.buildMode) {
      case 'conveyor':
        success = this.world.placeConveyor(col, row, this.player.direction);
        break;
      case 'furnace':
        success = this.world.placeFurnace(col, row, this.player.direction);
        break;
      case 'chest':
        success = this.world.placeChest(col, row, this.player.direction);
        break;
      case 'drill':
        success = this.world.placeDrill(col, row, this.player.direction);
        break;
      default:
        this.ui.notify('Неизвестное здание');
        return;
    }

    if (success) {
      this.deductBuildCost(this.buildMode);
      this.ui.notify((def ? def.name : this.buildMode) + ' построен');
    } else {
      this.ui.notify('Не удалось построить');
    }
  }

  update(dt) {
    if (this.state === 'playing') {
      this.world.playerCol = this.player.col;
      this.world.playerRow = this.player.row;

      const targetCamX = this.canvas.width / 2 - this.player.col * TILE_SIZE - TILE_SIZE / 2;
      const targetCamY = this.canvas.height / 2 - this.player.row * TILE_SIZE - TILE_SIZE / 2;
      const camLerp = Math.min(1, dt * 0.01);
      this.renderer.camX += (targetCamX - this.renderer.camX) * camLerp;
      this.renderer.camY += (targetCamY - this.renderer.camY) * camLerp;
      this.renderer.setCamera(this.renderer.camX, this.renderer.camY);

      this.world.update(dt);
      this.renderer.update(dt);
      if (this.player.moveTimer > 0) {
        this.player.moveTimer -= dt;
        if (this.player.moveTimer < 0) this.player.moveTimer = 0;
        this.player.walkStep = (1 - this.player.moveTimer / this.player.MOVE_DURATION) * Math.PI;
      } else {
        this.player.walkStep = 0;
      }
      for (let i = this.miningEffects.length - 1; i >= 0; i--) {
        this.miningEffects[i].timer -= dt;
        if (this.miningEffects[i].timer <= 0) {
          this.miningEffects.splice(i, 1);
        }
      }
    } else if (this.state === 'death') {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.deathTimer = 0;
        this.state = 'gameover';
      }
      this.renderer.update(dt);
      for (let i = this.miningEffects.length - 1; i >= 0; i--) {
        this.miningEffects[i].timer -= dt;
        if (this.miningEffects[i].timer <= 0) {
          this.miningEffects.splice(i, 1);
        }
      }
    } else {
      this.renderer.update(dt);
    }
  }

  render() {
    try {
      this.renderer.clear();

      if (this.state === 'menu') {
        if (this.menuSection === 'main') this.renderer.renderMenu();
        else this.renderer.renderInstructions();
        return;
      }

      this.renderer.renderWorld(this.world);
      this.renderer.renderMiningEffects(this.miningEffects);
      this.renderer.renderProjectiles(this.world.projectiles);
      this.renderer.renderEnemies(this.world.enemies);
      this.renderer.renderHover(this.hoverCol, this.hoverRow);
      if (this.buildMode) {
        const canAfford = this.canAffordBuild(this.buildMode);
        this.renderer.renderGhost(this.hoverCol, this.hoverRow, this.buildMode, canAfford);
      }
      this.renderer.renderPlayer(this.player);
      this.renderer.renderCompass(this.player.col, this.player.row, this.world.spawnCol, this.world.spawnRow);

      if (this.state === 'death') {
        this.renderer.renderDeathOverlay(this.deathTimer, 2000);
      } else if (this.state === 'gameover') {
        this.renderer.renderGameOver(this.totalItemsProduced);
      }

      if (this.buildMenuOpen) {
        const canAffordMap = {};
        for (const b of BUILDING_DEFS) {
          canAffordMap[b.id] = this.canAffordBuild(b.id);
        }
        this.renderer.renderBuildMenu(BUILDING_DEFS, canAffordMap, this.buildMode);
      } else if (this.buildMode) {
        this.renderer.renderBuildModeIndicator(this.buildMode);
      }

      if (this.state === 'playing') {
        let buildInfo = '';
        buildInfo += `Направление: ${DIR_NAMES[this.player.direction]}`;
        if (this.buildMode) {
          const def = BUILDING_DEFS.find(b => b.id === this.buildMode);
          buildInfo += ` | 🛠 Строю: ${def ? def.name : this.buildMode}`;
        }
        this.ui.update(
          this.player,
          this.totalItemsProduced,
          false, buildInfo
        );
      }
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
        hp: this.player.hp,
        maxHp: this.player.maxHp,
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
      this.player.hp = data.player.hp || PLAYER_MAX_HP;
      this.player.maxHp = data.player.maxHp || PLAYER_MAX_HP;
      this.player.inventory = { ...this.player.inventory, ...data.player.inventory };
      this.world.playerCol = this.player.col;
      this.world.playerRow = this.player.row;
    }
    this.totalItemsProduced = data.totalItemsProduced || 0;
    this.state = 'playing';
    this.world.onItemProduced = (type) => {
      this.totalItemsProduced++;
      if (type === ITEM_TYPES.IRON_PLATE) this.player.inventory.iron_plate++;
      else if (type === ITEM_TYPES.COPPER_PLATE) this.player.inventory.copper_plate++;
      else if (type === ITEM_TYPES.CIRCUIT_BOARD) this.player.inventory.circuit_board++;
      else if (type === ITEM_TYPES.IRON_GEAR) this.player.inventory.iron_gear++;
    };
    this.world.onPlayerHit = (dmg) => {
      this.player.hp -= dmg;
      this.ui.notify('Атакован! ❤' + this.player.hp);
      if (this.player.hp <= 0) {
        this.gameOver();
      }
    };
    this.world.onEnemyKilled = () => {
      this.player.inventory.iron_ore += 2;
    };
    this.world.onWaveStart = (num, count) => {
      this.ui.notify('ВОЛНА ' + num + '! Врагов: ' + count);
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
    this.startGame();
    this.ui.notify('Мир сброшен');
  }
}
