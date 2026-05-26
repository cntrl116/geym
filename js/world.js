class World {
  constructor() {
    this.grid = [];
    this.oreCount = 0;
    this.copperOreCount = 0;
    this.onItemProduced = null;
  }

  init() {
    this.grid = [];
    this.oreCount = 0;
    this.copperOreCount = 0;
    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        this.grid[row][col] = { type: TILE_TYPES.EMPTY };
      }
    }
    this.generateOre(10, TILE_TYPES.IRON_ORE, 'oreCount');
    this.generateOre(6, TILE_TYPES.COPPER_ORE, 'copperOreCount');
  }

  generateOre(count, tileType, countField) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 500) {
      attempts++;
      const col = Math.floor(Math.random() * COLS);
      const row = Math.floor(Math.random() * ROWS);
      if (this.getTile(col, row).type === TILE_TYPES.EMPTY && !(col === 1 && row === 1)) {
        this.setTile(col, row, { type: tileType });
        this[countField]++;
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
      currentRecipe: null,
    });
    return true;
  }

  placeDrill(col, row, dir) {
    const tile = this.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, {
      type: TILE_TYPES.DRILL,
      direction: dir,
      outputBuffer: [],
      drillTimer: 0,
      isMining: false,
    });
    return true;
  }

  placeAssembler(col, row, dir) {
    const tile = this.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, {
      type: TILE_TYPES.ASSEMBLER,
      direction: dir,
      inputBuffer: [],
      outputBuffer: [],
      craftTimer: 0,
      isCrafting: false,
      currentRecipe: null,
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

  outputToBelt(tile, col, row) {
    if (!tile.outputBuffer || tile.outputBuffer.length === 0) return;
    const dir = tile.direction || DIR_DOWN;
    const nc = col + DIR_VEC[dir].x;
    const nr = row + DIR_VEC[dir].y;
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return;
    const nb = this.grid[nr][nc];
    if (nb.type === TILE_TYPES.CONVEYOR && (!nb.items || nb.items.length === 0)) {
      const item = tile.outputBuffer.shift();
      if (!nb.items) nb.items = [];
      nb.items.push({ type: item.type, progress: 0 });
    }
  }

  updateFurnaces(dt) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.grid[row][col];
        if (tile.type !== TILE_TYPES.FURNACE) continue;

        if (!tile.isSmelting && tile.inputBuffer.length >= 5) {
          const firstType = tile.inputBuffer[0].type;
          let recipeId = null;
          if (firstType === ITEM_TYPES.IRON_ORE) recipeId = 'iron_plate';
          else if (firstType === ITEM_TYPES.COPPER_ORE) recipeId = 'copper_plate';

          if (recipeId && this.matchesRecipe(tile.inputBuffer, recipeId)) {
            tile.isSmelting = true;
            tile.currentRecipe = recipeId;
            tile.smeltTimer = RECIPES[recipeId].time;
          }
        }

        if (tile.isSmelting) {
          tile.smeltTimer -= dt;
          if (tile.smeltTimer <= 0) {
            tile.isSmelting = false;
            tile.smeltTimer = 0;
            const recipe = RECIPES[tile.currentRecipe];
            if (recipe) {
              this.consumeRecipe(tile.inputBuffer, tile.currentRecipe);
              for (let i = 0; i < recipe.output.count; i++) {
                tile.outputBuffer.push({ type: recipe.output.type });
              }
              if (this.onItemProduced) this.onItemProduced(recipe.output.type);
            }
            tile.currentRecipe = null;
          }
        }

        this.outputToBelt(tile, col, row);
      }
    }
  }

  updateDrills(dt) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.grid[row][col];
        if (tile.type !== TILE_TYPES.DRILL) continue;

        const dir = tile.direction || DIR_DOWN;
        const nc = col + DIR_VEC[dir].x;
        const nr = row + DIR_VEC[dir].y;
        const front = this.getTile(nc, nr);

        let oreType = null;
        if (front && front.type === TILE_TYPES.IRON_ORE) oreType = ITEM_TYPES.IRON_ORE;
        else if (front && front.type === TILE_TYPES.COPPER_ORE) oreType = ITEM_TYPES.COPPER_ORE;

        if (oreType) {
          tile.isMining = true;
          tile.drillTimer += dt;
          if (tile.drillTimer >= DRILL_SPEED) {
            tile.drillTimer -= DRILL_SPEED;
            tile.outputBuffer.push({ type: oreType });
          }
        } else {
          tile.isMining = false;
          tile.drillTimer = 0;
        }

        this.outputToBelt(tile, col, row);
      }
    }
  }

  updateAssemblers(dt) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this.grid[row][col];
        if (tile.type !== TILE_TYPES.ASSEMBLER) continue;

        if (!tile.isCrafting) {
          let foundRecipe = null;
          for (const [id, recipe] of Object.entries(RECIPES)) {
            if (recipe.building === 'assembler' && this.matchesRecipe(tile.inputBuffer, id)) {
              foundRecipe = id;
              break;
            }
          }
          if (foundRecipe) {
            tile.isCrafting = true;
            tile.currentRecipe = foundRecipe;
            tile.craftTimer = RECIPES[foundRecipe].time;
          }
        }

        if (tile.isCrafting) {
          tile.craftTimer -= dt;
          if (tile.craftTimer <= 0) {
            tile.isCrafting = false;
            tile.craftTimer = 0;
            const recipe = RECIPES[tile.currentRecipe];
            if (recipe) {
              this.consumeRecipe(tile.inputBuffer, tile.currentRecipe);
              for (let i = 0; i < recipe.output.count; i++) {
                tile.outputBuffer.push({ type: recipe.output.type });
              }
              if (this.onItemProduced) this.onItemProduced(recipe.output.type);
            }
            tile.currentRecipe = null;
          }
        }

        this.outputToBelt(tile, col, row);
      }
    }
  }

  matchesRecipe(inputBuffer, recipeId) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return false;
    const counts = {};
    for (const item of inputBuffer) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    for (const [type, needed] of Object.entries(recipe.input)) {
      if ((counts[type] || 0) < needed) return false;
    }
    return true;
  }

  consumeRecipe(inputBuffer, recipeId) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return;
    const needed = { ...recipe.input };
    const remaining = [];
    for (const item of inputBuffer) {
      if (needed[item.type] && needed[item.type] > 0) {
        needed[item.type]--;
      } else {
        remaining.push(item);
      }
    }
    inputBuffer.length = 0;
    for (const r of remaining) inputBuffer.push(r);
  }

  canAccept(tile, item) {
    if (tile.type === TILE_TYPES.CONVEYOR) {
      return !tile.items || tile.items.length === 0;
    }
    if (tile.type === TILE_TYPES.FURNACE) {
      if (tile.inputBuffer.length >= 5) return false;
      if (tile.isSmelting) return false;
      if (tile.inputBuffer.length === 0) return item.type === ITEM_TYPES.IRON_ORE || item.type === ITEM_TYPES.COPPER_ORE;
      return tile.inputBuffer[0].type === item.type;
    }
    if (tile.type === TILE_TYPES.ASSEMBLER) {
      if (tile.isCrafting) return false;
      if (tile.inputBuffer.length >= 8) return false;
      return item.type === ITEM_TYPES.IRON_PLATE || item.type === ITEM_TYPES.COPPER_PLATE;
    }
    if (tile.type === TILE_TYPES.DRILL) {
      return false;
    }
    return false;
  }

  acceptItem(tile, item) {
    if (tile.type === TILE_TYPES.CONVEYOR) {
      if (!tile.items) tile.items = [];
      tile.items.push({ type: item.type, progress: 0 });
    } else if (tile.type === TILE_TYPES.FURNACE || tile.type === TILE_TYPES.ASSEMBLER) {
      tile.inputBuffer.push(item);
    }
  }

  update(dt) {
    this.updateBelts(dt);
    this.updateFurnaces(dt);
    this.updateDrills(dt);
    this.updateAssemblers(dt);
  }

  getSpriteForTile(col, row) {
    const tile = this.getTile(col, row);
    if (!tile) return null;
    switch (tile.type) {
      case TILE_TYPES.IRON_ORE: return 'box_small';
      case TILE_TYPES.COPPER_ORE: return 'box_small';
      case TILE_TYPES.CONVEYOR: return 'conveyor_stripe';
      case TILE_TYPES.FURNACE: return 'machine';
      case TILE_TYPES.DRILL: return 'machine_bed';
      case TILE_TYPES.ASSEMBLER: return 'robot_arm_a';
      default: return null;
    }
  }

  serialize() {
    return {
      oreCount: this.oreCount,
      copperOreCount: this.copperOreCount,
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
          t.currentRecipe = tile.currentRecipe || null;
        }
        if (tile.type === TILE_TYPES.DRILL) {
          t.direction = tile.direction;
          t.outputBuffer = (tile.outputBuffer || []).map(i => ({ ...i }));
          t.drillTimer = tile.drillTimer || 0;
          t.isMining = tile.isMining || false;
        }
        if (tile.type === TILE_TYPES.ASSEMBLER) {
          t.direction = tile.direction;
          t.inputBuffer = (tile.inputBuffer || []).map(i => ({ ...i }));
          t.outputBuffer = (tile.outputBuffer || []).map(i => ({ ...i }));
          t.craftTimer = tile.craftTimer || 0;
          t.isCrafting = tile.isCrafting || false;
          t.currentRecipe = tile.currentRecipe || null;
        }
        return t;
      })),
    };
  }

  deserialize(data) {
    this.oreCount = data.oreCount || 0;
    this.copperOreCount = data.copperOreCount || 0;
    this.grid = data.grid.map(row => row.map(tile => {
      const t = { ...tile };
      if (t.type === TILE_TYPES.CONVEYOR) {
        if (!Array.isArray(t.items)) t.items = [];
      }
      if (t.type === TILE_TYPES.FURNACE) {
        if (!Array.isArray(t.inputBuffer)) t.inputBuffer = [];
        if (!Array.isArray(t.outputBuffer)) t.outputBuffer = [];
      }
      if (t.type === TILE_TYPES.DRILL) {
        if (!Array.isArray(t.outputBuffer)) t.outputBuffer = [];
      }
      if (t.type === TILE_TYPES.ASSEMBLER) {
        if (!Array.isArray(t.inputBuffer)) t.inputBuffer = [];
        if (!Array.isArray(t.outputBuffer)) t.outputBuffer = [];
      }
      return t;
    }));
  }
}
