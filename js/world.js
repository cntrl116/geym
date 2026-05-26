class World {
  constructor() {
    this.grid = [];
    this.oreCount = 0;
    this.onPlateProduced = null;
  }

  init() {
    this.grid = [];
    this.oreCount = 0;
    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        this.grid[row][col] = { type: TILE_TYPES.EMPTY };
      }
    }
    this.generateOre(12);
  }

  generateOre(count) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 500) {
      attempts++;
      const col = Math.floor(Math.random() * COLS);
      const row = Math.floor(Math.random() * ROWS);
      if (this.getTile(col, row).type === TILE_TYPES.EMPTY && !(col === 1 && row === 1)) {
        this.setTile(col, row, { type: TILE_TYPES.IRON_ORE });
        this.oreCount++;
        placed++;
      }
    }
  }

  getTile(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return this.grid[row][col];
  }

  setTile(col, row, data) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[row][col] = data;
  }

  isOccupied(col, row) {
    const tile = this.getTile(col, row);
    if (!tile) return true;
    return tile.type !== TILE_TYPES.EMPTY;
  }

  placeConveyor(col, row, dir) {
    const tile = this.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, { type: TILE_TYPES.CONVEYOR, direction: dir, items: [] });
    return true;
  }

  placeFurnace(col, row, dir) {
    const tile = this.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, {
      type: TILE_TYPES.FURNACE,
      direction: dir,
      inputBuffer: [],
      outputBuffer: [],
      smeltTimer: 0,
      isSmelting: false,
    });
    return true;
  }

  updateBelts(dt) {
    const movements = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.grid[row][col];
        if (tile.type !== TILE_TYPES.CONVEYOR) continue;
        if (!tile.items || tile.items.length === 0) continue;

        const item = tile.items[0];
        item.progress = (item.progress || 0) + BELT_SPEED * dt;

        if (item.progress >= 1) {
          const dir = tile.direction || DIR_DOWN;
          const nc = col + DIR_VEC[dir].x;
          const nr = row + DIR_VEC[dir].y;

          if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
            movements.push({ sc: col, sr: row, dc: nc, dr: nr, item: { type: item.type } });
            tile.items.shift();
          } else {
            item.progress = 0.95;
          }
        }
      }
    }

    for (const m of movements) {
      const target = this.grid[m.dr][m.dc];
      if (this.canAccept(target, m.item)) {
        this.acceptItem(target, m.item);
      } else {
        const src = this.grid[m.sr][m.sc];
        src.items.push({ type: m.item.type, progress: 0.95 });
      }
    }
  }

  updateFurnaces(dt) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.grid[row][col];
        if (tile.type !== TILE_TYPES.FURNACE) continue;

        if (!tile.isSmelting && tile.inputBuffer.length >= 5) {
          tile.isSmelting = true;
          tile.smeltTimer = 3000;
        }

        if (tile.isSmelting) {
          tile.smeltTimer -= dt;
          if (tile.smeltTimer <= 0) {
            tile.isSmelting = false;
            tile.smeltTimer = 0;
            tile.inputBuffer.splice(0, 5);
            tile.outputBuffer.push({ type: ITEM_TYPES.IRON_PLATE });
            if (this.onPlateProduced) this.onPlateProduced();
          }
        }

        if (tile.outputBuffer.length > 0) {
          const dir = tile.direction || DIR_DOWN;
          const nc = col + DIR_VEC[dir].x;
          const nr = row + DIR_VEC[dir].y;
          if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
            const nb = this.grid[nr][nc];
            if (nb.type === TILE_TYPES.CONVEYOR && (!nb.items || nb.items.length === 0)) {
              const item = tile.outputBuffer.shift();
              if (!nb.items) nb.items = [];
              nb.items.push({ type: item.type, progress: 0 });
            }
          }
        }
      }
    }
  }

  canAccept(tile, item) {
    if (tile.type === TILE_TYPES.CONVEYOR) {
      return !tile.items || tile.items.length === 0;
    }
    if (tile.type === TILE_TYPES.FURNACE && item.type === ITEM_TYPES.IRON_ORE) {
      return tile.inputBuffer.length < 5;
    }
    return false;
  }

  acceptItem(tile, item) {
    if (tile.type === TILE_TYPES.CONVEYOR) {
      if (!tile.items) tile.items = [];
      tile.items.push({ type: item.type, progress: 0 });
    } else if (tile.type === TILE_TYPES.FURNACE) {
      tile.inputBuffer.push(item);
    }
  }

  getSpriteForTile(col, row) {
    const tile = this.getTile(col, row);
    if (!tile) return null;
    switch (tile.type) {
      case TILE_TYPES.IRON_ORE: return 'box_small';
      case TILE_TYPES.CONVEYOR: return 'conveyor_stripe';
      case TILE_TYPES.FURNACE: return 'machine';
      default: return null;
    }
  }

  serialize() {
    return {
      oreCount: this.oreCount,
      grid: this.grid.map(row => row.map(tile => {
        const t = { type: tile.type };
        if (tile.type === TILE_TYPES.CONVEYOR) {
          t.direction = tile.direction;
          t.items = (tile.items || []).map(i => ({ ...i }));
        }
        if (tile.type === TILE_TYPES.FURNACE) {
          t.direction = tile.direction;
          t.inputBuffer = (tile.inputBuffer || []).map(i => ({ ...i }));
          t.outputBuffer = (tile.outputBuffer || []).map(i => ({ ...i }));
          t.smeltTimer = tile.smeltTimer || 0;
          t.isSmelting = tile.isSmelting || false;
        }
        return t;
      })),
    };
  }

  deserialize(data) {
    this.oreCount = data.oreCount || 0;
    this.grid = data.grid.map(row => row.map(tile => {
      const t = { ...tile };
      if (t.type === TILE_TYPES.CONVEYOR) {
        if (!Array.isArray(t.items)) t.items = [];
      }
      if (t.type === TILE_TYPES.FURNACE) {
        if (!Array.isArray(t.inputBuffer)) t.inputBuffer = [];
        if (!Array.isArray(t.outputBuffer)) t.outputBuffer = [];
      }
      return t;
    }));
  }
}
