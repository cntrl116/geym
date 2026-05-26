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
      'box_small', 'machine', 'conveyor_stripe',
      'conveyor_stripe_part_end', 'conveyor_stripe_part_middle',
      'conveyor_corner',
    ];
    let loaded = 0;
    const total = spriteList.length;

    const onDone = () => {
      loaded++;
      if (loaded >= total) {
        this.spritesLoaded = true;
        if (callback) callback();
      }
    };

    for (const name of spriteList) {
      const img = new Image();
      img.onload = onDone;
      img.onerror = onDone;
      img.src = `assets/${name}.png`;
      this.sprites[name] = img;
    }
  }

  renderWorld(world) {
    const ctx = this.ctx;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const { x, y } = this.tileToScreen(col, row);

        const shade = ((col + row) % 2 === 0) ? '#3a3a4a' : '#2e2e3e';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        const tile = world.getTile(col, row);
        if (!tile) continue;

        switch (tile.type) {
          case TILE_TYPES.IRON_ORE:
            this.renderOre(x, y);
            break;
          case TILE_TYPES.CONVEYOR:
            this.renderConveyor(col, row, tile.direction || 0);
            this.renderItemsOnBelt(col, row, tile);
            break;
          case TILE_TYPES.FURNACE:
            this.renderFurnace(x, y, tile);
            break;
        }
      }
    }
  }

  renderOre(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }

  renderConveyor(col, row, direction) {
    const { x, y } = this.tileToScreen(col, row);
    const ctx = this.ctx;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;

    const img = this.sprites['conveyor_stripe'];
    if (img && this.spritesLoaded) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(direction * Math.PI / 2);
      ctx.drawImage(img, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    } else {
      ctx.fillStyle = '#555566';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#777788';
      ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    ctx.fillStyle = '#ffcc00';
    const arrowX = [0, 10, 0, -10];
    const arrowY = [-12, 0, 12, 0];
    ctx.beginPath();
    ctx.arc(cx + arrowX[direction], cy + arrowY[direction], 4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderItemsOnBelt(col, row, tile) {
    if (!tile.items || tile.items.length === 0) return;
    const ctx = this.ctx;
    const dir = tile.direction || DIR_DOWN;
    const { x: sx, y: sy } = this.tileToScreen(col, row);
    const cx = sx + TILE_SIZE / 2;
    const cy = sy + TILE_SIZE / 2;
    const ex = cx + DIR_VEC[dir].x * TILE_SIZE;
    const ey = cy + DIR_VEC[dir].y * TILE_SIZE;

    for (const item of tile.items) {
      const p = item.progress || 0;
      const ix = cx + (ex - cx) * p;
      const iy = cy + (ey - cy) * p;

      if (item.type === ITEM_TYPES.IRON_ORE) {
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.arc(ix, iy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#707070';
        ctx.beginPath();
        ctx.arc(ix, iy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === ITEM_TYPES.IRON_PLATE) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(ix - 4, iy - 2, 8, 4);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(ix - 3, iy - 1, 6, 2);
      }
    }
  }

  renderFurnace(x, y, tile) {
    const ctx = this.ctx;

    const img = this.sprites['machine'];
    if (img && this.spritesLoaded) {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#654321';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    }

    if (tile.isSmelting) {
      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    const inputCount = tile.inputBuffer ? tile.inputBuffer.length : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 2, y + 2, 36 * (inputCount / 5), 4);

    if (tile.outputBuffer && tile.outputBuffer.length > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
