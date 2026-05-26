class World {
  constructor() {
    this.grid = [];
    this.oreCount = 0;
  }

  init() {
    this.grid = [];
    this.oreCount = 0;
    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        this.grid[row][col] = { type: 'empty' };
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
      if (this.getTile(col, row).type === 'empty' && !(col === 1 && row === 1)) {
        this.setTile(col, row, { type: 'iron_ore' });
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
    return tile.type !== 'empty';
  }

  getSpriteForTile(col, row) {
    const tile = this.getTile(col, row);
    if (!tile) return null;
    switch (tile.type) {
      case 'iron_ore': return 'box_small';
      default: return null;
    }
  }
}
