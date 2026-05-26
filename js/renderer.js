class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.sprites = {};
    this.spritesLoaded = false;
  }

  tileToScreen(col, row) {
    return {
      x: col * TILE_SIZE + this.offsetX,
      y: row * TILE_SIZE + this.offsetY,
    };
  }

  setCamera(ox, oy) {
    this.offsetX = ox;
    this.offsetY = oy;
  }

  loadSprites(callback) {
    const spriteList = [
      'conveyor_stripe', 'conveyor_stripe_part_end',
      'conveyor_stripe_part_middle', 'conveyor_corner',
      'machine', 'machine_window', 'box_small',
      'building_a', 'building_b', 'building_c',
    ];
    let loaded = 0;
    const total = spriteList.length;

    for (const name of spriteList) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded >= total) {
          this.spritesLoaded = true;
          if (callback) callback();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded >= total) {
          this.spritesLoaded = true;
          if (callback) callback();
        }
      };
      img.src = `assets/${name}.png`;
      this.sprites[name] = img;
    }
  }

  renderGrid() {
    const ctx = this.ctx;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.renderTileEmpty(col, row);
      }
    }
  }

  renderTileEmpty(col, row) {
    const { x, y } = this.tileToScreen(col, row);
    const ctx = this.ctx;
    const shade = ((col + row) % 2 === 0) ? '#3a3a4a' : '#333340';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#4a4a5a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  renderPlayer(player) {
    const { x, y } = this.tileToScreen(player.col, player.row);
    const ctx = this.ctx;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;
    const r = TILE_SIZE / 2 - 4;

    const gradient = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, r);
    gradient.addColorStop(0, '#66aaff');
    gradient.addColorStop(1, '#3366cc');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const dir = DIR_VEC[player.direction];
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dir.x * r, cy + dir.y * r);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  renderSprite(col, row, spriteName) {
    const img = this.sprites[spriteName];
    if (!img) return;
    const { x, y } = this.tileToScreen(col, row);
    this.ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
