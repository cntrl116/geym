class World {
  constructor() {
    this.grid = [];
  }

  init() {
    this.grid = [];
    for (let row = 0; row < ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < COLS; col++) {
        this.grid[row][col] = { type: 'empty' };
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
}
