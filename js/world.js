class World {
  constructor() {
    this.tiles = new Map();
    this.buildingPositions = [];
    this.oreCount = 0;
    this.copperOreCount = 0;
    this.onItemProduced = null;
    this.enemies = [];
    this.projectiles = [];
    this.onPlayerHit = null;
    this.onEnemyKilled = null;
    this.onWaveStart = null;
    this.playerCol = 1;
    this.playerRow = 1;
    this.spawnCol = 0;
    this.spawnRow = 0;
    this.waveState = 'waiting';
    this.waveTimer = 0;
    this.waveNumber = 0;
    this.waveEnemyCount = 0;
    this.waveStartDelay = 0;
  }

  init() {
    this.tiles = new Map();
    this.buildingPositions = [];
    this.oreCount = 0;
    this.copperOreCount = 0;
    this.enemies = [];
    this.projectiles = [];
    this.waveState = 'waiting';
    this.waveTimer = 0;
    this.waveNumber = 0;
    this.waveEnemyCount = 0;
    this.waveStartDelay = 15000;
    this.generateInitialOre(15, TILE_TYPES.IRON_ORE, 'oreCount');
    this.generateInitialOre(10, TILE_TYPES.COPPER_ORE, 'copperOreCount');
  }

  tileHash(col, row) {
    let h = col * 374761393 + row * 668265263 + 1234567;
    h = ((h ^ (h >> 13)) * 1274126177) ^ ((h >> 16) * 374761393);
    return ((h >> 16) ^ h) & 0x7FFFFFFF;
  }

  generateTile(col, row) {
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      return { type: TILE_TYPES.EMPTY };
    }
    const cx = Math.floor(col / 4);
    const cy = Math.floor(row / 4);
    const ch = this.tileHash(cx, cy) % 100;
    if (ch < 12) {
      if (this.tileHash(col, row) % 100 < 40) {
        return { type: TILE_TYPES.IRON_ORE };
      }
    } else if (ch < 17) {
      if (this.tileHash(col + 1000, row + 1000) % 100 < 35) {
        return { type: TILE_TYPES.COPPER_ORE };
      }
    }
    return { type: TILE_TYPES.EMPTY };
  }

  getTile(col, row) {
    const key = col + ',' + row;
    if (this.tiles.has(key)) return this.tiles.get(key);
    const tile = this.generateTile(col, row);
    this.tiles.set(key, tile);
    return tile;
  }

  setTile(col, row, data) {
    const key = col + ',' + row;
    this.tiles.set(key, data);
    if (data.type !== TILE_TYPES.EMPTY && data.type !== TILE_TYPES.IRON_ORE && data.type !== TILE_TYPES.COPPER_ORE) {
      const idx = this.buildingPositions.findIndex(p => p.col === col && p.row === row);
      if (idx >= 0) {
        this.buildingPositions[idx].type = data.type;
      } else {
        this.buildingPositions.push({ col, row, type: data.type });
      }
    }
  }

  isOccupied(col, row) {
    const tile = this.getTile(col, row);
    return tile.type !== TILE_TYPES.EMPTY;
  }

  placeConveyor(col, row, dir) {
    const tile = this.getTile(col, row);
    if (tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, { type: TILE_TYPES.CONVEYOR, direction: dir, items: [] });
    return true;
  }

  placeFurnace(col, row, dir) {
    const tile = this.getTile(col, row);
    if (tile.type !== TILE_TYPES.EMPTY) return false;
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
    if (tile.type !== TILE_TYPES.EMPTY) return false;
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
    if (tile.type !== TILE_TYPES.EMPTY) return false;
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

  placeTurret(col, row, dir) {
    const tile = this.getTile(col, row);
    if (tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, {
      type: TILE_TYPES.TURRET,
      direction: dir,
      cooldown: 0,
    });
    return true;
  }

  placeWall(col, row, dir) {
    const tile = this.getTile(col, row);
    if (tile.type !== TILE_TYPES.EMPTY) return false;
    this.setTile(col, row, { type: TILE_TYPES.WALL, direction: dir, hp: WALL_HP, maxHp: WALL_HP });
    return true;
  }

  generateInitialOre(count, tileType, countField) {
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

  updateBelts(dt) {
    const movements = [];
    for (const pos of this.buildingPositions) {
      if (pos.type !== TILE_TYPES.CONVEYOR) continue;
      const tile = this.getTile(pos.col, pos.row);
      if (!tile.items || tile.items.length === 0) continue;

      const item = tile.items[0];
      item.progress = (item.progress || 0) + BELT_SPEED * dt;

      if (item.progress >= 1) {
        const dir = tile.direction || DIR_DOWN;
        const nc = pos.col + DIR_VEC[dir].x;
        const nr = pos.row + DIR_VEC[dir].y;
        movements.push({ sc: pos.col, sr: pos.row, dc: nc, dr: nr, item: { type: item.type } });
        tile.items.shift();
      }
    }

    for (const m of movements) {
      const target = this.getTile(m.dc, m.dr);
      if (this.canAccept(target, m.item)) {
        this.acceptItem(target, m.item);
      } else {
        const src = this.getTile(m.sc, m.sr);
        if (!src.items) src.items = [];
        src.items.push({ type: m.item.type, progress: 0.95 });
      }
    }
  }

  outputToBelt(tile, col, row) {
    if (!tile.outputBuffer || tile.outputBuffer.length === 0) return;
    const dir = tile.direction || DIR_DOWN;
    const nc = col + DIR_VEC[dir].x;
    const nr = row + DIR_VEC[dir].y;
    const nb = this.getTile(nc, nr);
    if (nb.type === TILE_TYPES.CONVEYOR && (!nb.items || nb.items.length < 2)) {
      const item = tile.outputBuffer.shift();
      if (!nb.items) nb.items = [];
      nb.items.push({ type: item.type, progress: 0 });
    }
  }

  updateFurnaces(dt) {
    for (const pos of this.buildingPositions) {
      if (pos.type !== TILE_TYPES.FURNACE) continue;
      const tile = this.getTile(pos.col, pos.row);

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

      this.outputToBelt(tile, pos.col, pos.row);
    }
  }

  updateDrills(dt) {
    for (const pos of this.buildingPositions) {
      if (pos.type !== TILE_TYPES.DRILL) continue;
      const tile = this.getTile(pos.col, pos.row);

      let oreType = null;
      for (let d = 0; d < 4; d++) {
        const nc = pos.col + DIR_VEC[d].x;
        const nr = pos.row + DIR_VEC[d].y;
        const adj = this.getTile(nc, nr);
        if (adj.type === TILE_TYPES.IRON_ORE) {
          oreType = ITEM_TYPES.IRON_ORE;
          break;
        } else if (adj.type === TILE_TYPES.COPPER_ORE) {
          oreType = ITEM_TYPES.COPPER_ORE;
          break;
        }
      }

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

      this.outputToBelt(tile, pos.col, pos.row);
    }
  }

  updateAssemblers(dt) {
    for (const pos of this.buildingPositions) {
      if (pos.type !== TILE_TYPES.ASSEMBLER) continue;
      const tile = this.getTile(pos.col, pos.row);

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

      this.outputToBelt(tile, pos.col, pos.row);
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
    if (!tile) return false;
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
    if (tile.type === TILE_TYPES.DRILL || tile.type === TILE_TYPES.TURRET) {
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

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let col, row;
    const spawnDist = 15;
    if (side === 0) { col = this.playerCol + Math.floor(Math.random() * 7) - 3; row = this.playerRow - spawnDist; }
    else if (side === 1) { col = this.playerCol + spawnDist; row = this.playerRow + Math.floor(Math.random() * 7) - 3; }
    else if (side === 2) { col = this.playerCol + Math.floor(Math.random() * 7) - 3; row = this.playerRow + spawnDist; }
    else { col = this.playerCol - spawnDist; row = this.playerRow + Math.floor(Math.random() * 7) - 3; }
    this.enemies.push({
      col, row,
      prevCol: col, prevRow: row,
      hp: ENEMY_HP,
      targetCol: this.playerCol, targetRow: this.playerRow,
      attackCooldown: 0,
      moveTimer: 0,
      wallTarget: null,
    });
  }

  startWave() {
    this.waveState = 'active';
    this.waveTimer = 0;
    this.waveEnemyCount = BASE_ENEMIES_PER_WAVE + this.waveNumber * ENEMIES_PER_WAVE_INCREASE;
    if (this.onWaveStart) this.onWaveStart(this.waveNumber + 1, this.waveEnemyCount);
  }

  startRetreat() {
    this.waveState = 'retreating';
    this.waveTimer = 0;
    for (const e of this.enemies) {
      const dx = e.col - this.spawnCol;
      const dy = e.row - this.spawnRow;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      if (dist > 1) {
        e.retreatDirX = dx / dist;
        e.retreatDirY = dy / dist;
      } else {
        e.retreatDirX = 1;
        e.retreatDirY = 0;
      }
    }
  }

  endWave() {
    this.enemies = [];
    this.waveState = 'waiting';
    this.waveTimer = 0;
    this.waveNumber++;
  }

  updateEnemies(dt) {
    if (this.waveStartDelay > 0) {
      this.waveStartDelay -= dt;
      return;
    }

    this.waveTimer += dt;

    if (this.waveState === 'waiting') {
      if (this.waveTimer >= WAVE_COOLDOWN) {
        this.startWave();
      }
      return;
    }

    if (this.waveState === 'active') {
      if (this.enemies.length < this.waveEnemyCount) {
        this.spawnEnemy();
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        e.targetCol = this.playerCol;
        e.targetRow = this.playerRow;
        e.moveTimer = (e.moveTimer || 0) + dt;

        if (e.moveTimer >= ENEMY_MOVE_INTERVAL) {
          e.moveTimer -= ENEMY_MOVE_INTERVAL;

          const dx = Math.sign(e.targetCol - e.col);
          const dy = Math.sign(e.targetRow - e.row);
          let moveCol = e.col, moveRow = e.row;
          let moved = false;

          if (dx !== 0) {
            const nc = e.col + dx;
            const t = this.getTile(nc, e.row);
            if (t.type !== TILE_TYPES.TURRET && t.type !== TILE_TYPES.WALL) {
              moveCol = nc;
              moved = true;
            } else if (t.type === TILE_TYPES.WALL) {
              e.wallTarget = { col: nc, row: e.row };
            }
          }
          if (!moved && dy !== 0) {
            const nr = e.row + dy;
            const t = this.getTile(e.col, nr);
            if (t.type !== TILE_TYPES.TURRET && t.type !== TILE_TYPES.WALL) {
              moveRow = nr;
              moved = true;
            } else if (t.type === TILE_TYPES.WALL) {
              e.wallTarget = { col: e.col, row: nr };
            }
          }

          if (moved) {
            e.prevCol = e.col;
            e.prevRow = e.row;
            e.col = moveCol;
            e.row = moveRow;
          }
        }

        e.attackCooldown = Math.max(0, (e.attackCooldown || 0) - dt);
        if (e.col === this.playerCol && e.row === this.playerRow) {
          if (e.attackCooldown <= 0) {
            if (this.onPlayerHit) this.onPlayerHit(ENEMY_DAMAGE);
            e.attackCooldown = ENEMY_ATTACK_COOLDOWN;
          }
        } else if (e.wallTarget && e.attackCooldown <= 0) {
          const wt = this.getTile(e.wallTarget.col, e.wallTarget.row);
          if (wt.type === TILE_TYPES.WALL) {
            wt.hp -= ENEMY_DAMAGE;
            e.attackCooldown = ENEMY_ATTACK_COOLDOWN;
            if (wt.hp <= 0) {
              this.setTile(e.wallTarget.col, e.wallTarget.row, { type: TILE_TYPES.EMPTY });
            }
          }
          e.wallTarget = null;
        }
      }

      if (this.waveTimer >= WAVE_ACTIVE_DURATION) {
        this.startRetreat();
      } else if (this.enemies.length === 0 && this.waveTimer > 2000) {
        this.endWave();
      }
    } else if (this.waveState === 'retreating') {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        e.moveTimer = (e.moveTimer || 0) + dt;

        if (e.moveTimer >= ENEMY_MOVE_INTERVAL) {
          e.moveTimer -= ENEMY_MOVE_INTERVAL;

          const dc = Math.round(e.retreatDirX);
          const dr = Math.round(e.retreatDirY);

          e.prevCol = e.col;
          e.prevRow = e.row;
          e.col += dc;
          e.row += dr;

          const edgeDist = 20;
          if (Math.abs(e.col - this.spawnCol) > edgeDist || Math.abs(e.row - this.spawnRow) > edgeDist) {
            this.enemies.splice(i, 1);
          }
        }
      }

      if (this.waveTimer >= WAVE_RETREAT_DURATION) {
        this.endWave();
      }
    }
  }

  updateTurrets(dt) {
    const toProjectile = [];
    for (const pos of this.buildingPositions) {
      if (pos.type !== TILE_TYPES.TURRET) continue;
      const tile = this.getTile(pos.col, pos.row);

      tile.cooldown = Math.max(0, (tile.cooldown || 0) - dt);

      if (tile.cooldown <= 0) {
        let closestDist = Infinity;
        let closestIdx = -1;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          const d = Math.abs(e.col - pos.col) + Math.abs(e.row - pos.row);
          if (d <= TURRET_RANGE && d < closestDist) {
            closestDist = d;
            closestIdx = i;
          }
        }
        if (closestIdx >= 0) {
          const e = this.enemies[closestIdx];
          this.projectiles.push({ sc: pos.col, sr: pos.row, dc: e.col, dr: e.row, progress: 0 });
          tile.cooldown = TURRET_COOLDOWN;
        }
      }
    }

    const deadProjectiles = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      p.progress += 0.02 * dt;
      if (p.progress >= 1) {
        for (let j = 0; j < this.enemies.length; j++) {
          if (this.enemies[j].col === p.dc && this.enemies[j].row === p.dr) {
            this.enemies[j].hp--;
            if (this.enemies[j].hp <= 0) {
              this.enemies.splice(j, 1);
              if (this.onEnemyKilled) this.onEnemyKilled();
            }
            break;
          }
        }
        deadProjectiles.push(i);
      }
    }
    for (let i = deadProjectiles.length - 1; i >= 0; i--) {
      this.projectiles.splice(deadProjectiles[i], 1);
    }
  }

  update(dt) {
    this.updateBelts(dt);
    this.updateFurnaces(dt);
    this.updateDrills(dt);
    this.updateAssemblers(dt);
    this.updateEnemies(dt);
    this.updateTurrets(dt);
  }

  getSpriteForTile(col, row) {
    const tile = this.getTile(col, row);
    switch (tile.type) {
      case TILE_TYPES.IRON_ORE: return 'box_small';
      case TILE_TYPES.COPPER_ORE: return 'box_small';
      case TILE_TYPES.CONVEYOR: return 'conveyor_stripe';
      case TILE_TYPES.FURNACE: return 'machine';
      case TILE_TYPES.DRILL: return 'machine_bed';
      case TILE_TYPES.ASSEMBLER: return 'robot_arm_a';
      case TILE_TYPES.TURRET: return 'machine';
      case TILE_TYPES.WALL: return 'machine';
      default: return null;
    }
  }

  serialize() {
    const tilesObj = {};
    for (const [key, tile] of this.tiles) {
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
      if (tile.type === TILE_TYPES.TURRET) {
        t.direction = tile.direction;
        t.cooldown = tile.cooldown || 0;
      }
      if (tile.type === TILE_TYPES.WALL) {
        t.hp = tile.hp || WALL_HP;
        t.maxHp = tile.maxHp || WALL_HP;
        t.direction = tile.direction;
      }
      tilesObj[key] = t;
    }
    return {
      oreCount: this.oreCount,
      copperOreCount: this.copperOreCount,
      tiles: tilesObj,
      buildingPositions: this.buildingPositions.map(p => ({ ...p })),
    };
  }

  deserialize(data) {
    this.oreCount = data.oreCount || 0;
    this.copperOreCount = data.copperOreCount || 0;
    this.enemies = [];
    this.projectiles = [];
    this.tiles = new Map();
    if (data.tiles) {
      for (const [key, tile] of Object.entries(data.tiles)) {
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
        if (t.type === TILE_TYPES.TURRET) {
          t.cooldown = t.cooldown || 0;
        }
        if (t.type === TILE_TYPES.WALL) {
          t.hp = t.hp || WALL_HP;
          t.maxHp = t.maxHp || WALL_HP;
        }
        this.tiles.set(key, t);
      }
    }
    this.buildingPositions = data.buildingPositions || [];
  }
}
