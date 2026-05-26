class Player {
  constructor() {
    this.col = 1;
    this.row = 1;
    this.direction = DIR_DOWN;
    this.inventory = { iron_ore: 0, iron_plate: 0 };
  }

  move(dCol, dRow, world) {
    const nc = this.col + dCol;
    const nr = this.row + dRow;
    if (!world.isOccupied(nc, nr)) {
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
    return false;
  }

  cycleDirection() {
    this.direction = (this.direction + 1) % 4;
  }
}
