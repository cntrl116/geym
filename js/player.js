class Player {
  constructor() {
    this.col = 1;
    this.row = 1;
    this.direction = DIR_DOWN;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.inventory = { iron_ore: 0, copper_ore: 0, iron_plate: 0, copper_plate: 0, circuit_board: 0 };
  }

  move(dCol, dRow, world) {
    const nc = this.col + dCol;
    const nr = this.row + dRow;
    const tile = world.getTile(nc, nr);
    if (!tile) return false;

    if (tile.type === TILE_TYPES.IRON_ORE) {
      world.setTile(nc, nr, { type: TILE_TYPES.EMPTY });
      this.col = nc;
      this.row = nr;
      this.inventory.iron_ore++;
      return 'ore';
    }

    if (tile.type === TILE_TYPES.COPPER_ORE) {
      world.setTile(nc, nr, { type: TILE_TYPES.EMPTY });
      this.col = nc;
      this.row = nr;
      this.inventory.copper_ore++;
      return 'copper_ore';
    }

    if (tile.type !== TILE_TYPES.EMPTY) return false;

    this.col = nc;
    this.row = nr;
    if (dCol !== 0 || dRow !== 0) {
      if (dCol === 0 && dRow === -1) this.direction = DIR_UP;
      else if (dCol === 1 && dRow === 0) this.direction = DIR_RIGHT;
      else if (dCol === 0 && dRow === 1) this.direction = DIR_DOWN;
      else if (dCol === -1 && dRow === 0) this.direction = DIR_LEFT;
    }
    return true;
  }

  cycleDirection() {
    this.direction = (this.direction + 1) % 4;
  }

  buildConveyor(world) {
    const dir = DIR_VEC[this.direction];
    const tc = this.col + dir.x;
    const tr = this.row + dir.y;
    const tile = world.getTile(tc, tr);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < CONVEYOR_COST) return false;
    this.inventory.iron_ore -= CONVEYOR_COST;
    return world.placeConveyor(tc, tr, this.direction);
  }

  buildFurnace(world) {
    const dir = DIR_VEC[this.direction];
    const tc = this.col + dir.x;
    const tr = this.row + dir.y;
    const tile = world.getTile(tc, tr);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < FURNACE_COST) return false;
    this.inventory.iron_ore -= FURNACE_COST;
    return world.placeFurnace(tc, tr, this.direction);
  }

  buildDrill(world) {
    const dir = DIR_VEC[this.direction];
    const tc = this.col + dir.x;
    const tr = this.row + dir.y;
    const tile = world.getTile(tc, tr);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < DRILL_COST) return false;
    this.inventory.iron_ore -= DRILL_COST;
    return world.placeDrill(tc, tr, this.direction);
  }

  buildAssembler(world) {
    const dir = DIR_VEC[this.direction];
    const tc = this.col + dir.x;
    const tr = this.row + dir.y;
    const tile = world.getTile(tc, tr);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < ASSEMBLER_COST) return false;
    this.inventory.iron_ore -= ASSEMBLER_COST;
    return world.placeAssembler(tc, tr, this.direction);
  }

  buildTurret(world) {
    const dir = DIR_VEC[this.direction];
    const tc = this.col + dir.x;
    const tr = this.row + dir.y;
    const tile = world.getTile(tc, tr);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_plate < TURRET_COST) return false;
    this.inventory.iron_plate -= TURRET_COST;
    return world.placeTurret(tc, tr, this.direction);
  }

  buildConveyorAt(col, row, world) {
    const tile = world.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < CONVEYOR_COST) return false;
    this.inventory.iron_ore -= CONVEYOR_COST;
    return world.placeConveyor(col, row, this.direction);
  }

  buildFurnaceAt(col, row, world) {
    const tile = world.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < FURNACE_COST) return false;
    this.inventory.iron_ore -= FURNACE_COST;
    return world.placeFurnace(col, row, this.direction);
  }

  buildDrillAt(col, row, world) {
    const tile = world.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < DRILL_COST) return false;
    this.inventory.iron_ore -= DRILL_COST;
    return world.placeDrill(col, row, this.direction);
  }

  buildAssemblerAt(col, row, world) {
    const tile = world.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_ore < ASSEMBLER_COST) return false;
    this.inventory.iron_ore -= ASSEMBLER_COST;
    return world.placeAssembler(col, row, this.direction);
  }

  buildTurretAt(col, row, world) {
    const tile = world.getTile(col, row);
    if (!tile || tile.type !== TILE_TYPES.EMPTY) return false;
    if (this.inventory.iron_plate < TURRET_COST) return false;
    this.inventory.iron_plate -= TURRET_COST;
    return world.placeTurret(col, row, this.direction);
  }

  collectOreAdjacent(world) {
    for (let d = 0; d < 4; d++) {
      const nc = this.col + DIR_VEC[d].x;
      const nr = this.row + DIR_VEC[d].y;
      const tile = world.getTile(nc, nr);
      if (tile && (tile.type === TILE_TYPES.IRON_ORE || tile.type === TILE_TYPES.COPPER_ORE)) {
        const isIron = tile.type === TILE_TYPES.IRON_ORE;
        world.setTile(nc, nr, { type: TILE_TYPES.EMPTY });
        if (isIron) this.inventory.iron_ore++;
        else this.inventory.copper_ore++;
        return isIron ? 'iron_ore' : 'copper_ore';
      }
    }
    return false;
  }
}
