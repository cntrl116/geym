class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.sprites = {};
    this.spritesLoaded = false;
    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
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
      'box_small', 'machine', 'machine_bed', 'robot_arm_a',
      'conveyor_stripe',
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
          case TILE_TYPES.COPPER_ORE:
            this.renderCopperOre(x, y);
            break;
          case TILE_TYPES.CONVEYOR:
            this.renderConveyor(col, row, tile.direction || 0);
            this.renderItemsOnBelt(col, row, tile);
            break;
          case TILE_TYPES.FURNACE:
            this.renderFurnace(x, y, tile);
            break;
          case TILE_TYPES.DRILL:
            this.renderDrill(x, y, tile);
            break;
          case TILE_TYPES.ASSEMBLER:
            this.renderAssembler(x, y, tile);
            break;
          case TILE_TYPES.TURRET:
            this.renderTurret(x, y, tile);
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

  renderCopperOre(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#B87333';
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = '#D4945A';
    ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }

  renderDrill(x, y, tile) {
    const ctx = this.ctx;
    const img = this.sprites['machine_bed'];
    if (img && this.spritesLoaded) {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#556677';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#778899';
      ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    }

    // Animation: пульсация при добыче
    if (tile.isMining) {
      const pulse = Math.sin(this.animTime * 0.006) * 0.15 + 0.25;
      ctx.fillStyle = `rgba(255, 200, 50, ${pulse})`;
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

      // Анимированный бур (осциллирующий кружок)
      const bob = Math.sin(this.animTime * 0.008) * 4;
      ctx.fillStyle = '#8899aa';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + bob, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile.outputBuffer && tile.outputBuffer.length > 0) {
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderAssembler(x, y, tile) {
    const ctx = this.ctx;
    const img = this.sprites['robot_arm_a'];
    if (img && this.spritesLoaded) {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#4a6a8a';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#5a8aaa';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    }

    if (tile.isCrafting) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.25)';
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    const inputCount = tile.inputBuffer ? tile.inputBuffer.length : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 2, y + 2, 36 * Math.min(inputCount / 8, 1), 4);

    if (tile.outputBuffer && tile.outputBuffer.length > 0) {
      ctx.fillStyle = '#66ff66';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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

    // Animation: бегущие полоски на ленте
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.clip();

    const dx = DIR_VEC[direction].x;
    const dy = DIR_VEC[direction].y;
    const len = Math.abs(dx) * (TILE_SIZE - 8) + Math.abs(dy) * (TILE_SIZE - 8);
    const offset = (this.animTime * 0.12) % 10;

    for (let i = -1; i < 5; i++) {
      const pos = i * 10 + offset;
      const sx = dx ? (dx > 0 ? x + pos : x + TILE_SIZE - pos - 3) : x + 8;
      const sy = dy ? (dy > 0 ? y + pos : y + TILE_SIZE - pos - 3) : y + 8;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      if (dx) ctx.fillRect(sx, sy, 3, TILE_SIZE - 16);
      else ctx.fillRect(sx, sy, TILE_SIZE - 16, 3);
    }
    ctx.restore();

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
      } else if (item.type === ITEM_TYPES.COPPER_ORE) {
        ctx.fillStyle = '#D4945A';
        ctx.beginPath();
        ctx.arc(ix, iy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#B87333';
        ctx.beginPath();
        ctx.arc(ix, iy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === ITEM_TYPES.IRON_PLATE) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(ix - 4, iy - 2, 8, 4);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(ix - 3, iy - 1, 6, 2);
      } else if (item.type === ITEM_TYPES.COPPER_PLATE) {
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(ix - 4, iy - 2, 8, 4);
        ctx.fillStyle = '#cc6633';
        ctx.fillRect(ix - 3, iy - 1, 6, 2);
      } else if (item.type === ITEM_TYPES.CIRCUIT_BOARD) {
        ctx.fillStyle = '#44cc44';
        ctx.fillRect(ix - 5, iy - 3, 10, 6);
        ctx.fillStyle = '#22aa22';
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
      const pulse = Math.sin(this.animTime * 0.004) * 0.2 + 0.3;
      ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }

    const inputCount = tile.inputBuffer ? tile.inputBuffer.length : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 2, y + 2, 36 * (inputCount / 5), 4);

    if (tile.outputBuffer && tile.outputBuffer.length > 0) {
      const outType = tile.outputBuffer[0].type;
      if (outType === ITEM_TYPES.IRON_PLATE) ctx.fillStyle = '#ffd700';
      else if (outType === ITEM_TYPES.COPPER_PLATE) ctx.fillStyle = '#ff8844';
      else ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderTurret(x, y, tile) {
    const ctx = this.ctx;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;

    const img = this.sprites['machine'];
    if (img && this.spritesLoaded) {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#445566';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = '#556677';
      ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    }

    // Вращающаяся башня
    const angle = this.animTime * 0.003;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#334455';
    ctx.fillRect(-3, -8, 6, 16);
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(-2, -6, 4, 12);
    ctx.restore();
  }

  renderEnemies(enemies) {
    const ctx = this.ctx;
    for (const e of enemies) {
      const { x, y } = this.tileToScreen(e.col, e.row);
      const cx = x + TILE_SIZE / 2;
      const cy = y + TILE_SIZE / 2;

      // Тело
      ctx.fillStyle = '#cc3333';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // Глаза
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 2, 3, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Полоска HP
      ctx.fillStyle = '#600';
      ctx.fillRect(cx - 8, cy - 14, 16, 3);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(cx - 8, cy - 14, 16 * (e.hp / ENEMY_HP), 3);
    }
  }

  renderProjectiles(projectiles) {
    const ctx = this.ctx;
    for (const p of projectiles) {
      const { x: sx, y: sy } = this.tileToScreen(p.sc, p.sr);
      const { x: dx, y: dy } = this.tileToScreen(p.dc, p.dr);
      const cx = sx + (dx - sx) * p.progress + TILE_SIZE / 2;
      const cy = sy + (dy - sy) * p.progress + TILE_SIZE / 2;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
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

  renderHover(col, row) {
    if (col < 0 || row < 0) return;
    const { x, y } = this.tileToScreen(col, row);
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
