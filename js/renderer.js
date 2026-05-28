class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.camX = 0;
    this.camY = 0;
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
      'oopi',
      'structure_wall',
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

    const startCol = Math.floor(-this.offsetX / TILE_SIZE);
    const startRow = Math.floor(-this.offsetY / TILE_SIZE);
    const visCols = Math.ceil(this.canvas.width / TILE_SIZE) + 2;
    const visRows = Math.ceil(this.canvas.height / TILE_SIZE) + 2;

    for (let row = startRow; row < startRow + visRows; row++) {
      for (let col = startCol; col < startCol + visCols; col++) {
        const { x, y } = this.tileToScreen(col, row);

        const shade = ((col + row) % 2 === 0) ? '#3a3a4a' : '#2e2e3e';
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        const tile = world.getTile(col, row);

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
          case TILE_TYPES.WALL:
            this.renderWall(x, y, tile);
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

      // Прогресс-бар
      const progress = Math.min(tile.drillTimer / DRILL_SPEED, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 3, y + TILE_SIZE - 7, TILE_SIZE - 6, 4);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x + 3, y + TILE_SIZE - 7, (TILE_SIZE - 6) * progress, 4);
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

      // Прогресс-бар
      if (tile.currentRecipe) {
        const progress = 1 - tile.craftTimer / RECIPES[tile.currentRecipe].time;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + 3, y + TILE_SIZE - 7, TILE_SIZE - 6, 4);
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(x + 3, y + TILE_SIZE - 7, (TILE_SIZE - 6) * progress, 4);
      }
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

      // Прогресс-бар
      if (tile.currentRecipe) {
        const progress = 1 - tile.smeltTimer / RECIPES[tile.currentRecipe].time;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + 3, y + TILE_SIZE - 7, TILE_SIZE - 6, 4);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(x + 3, y + TILE_SIZE - 7, (TILE_SIZE - 6) * progress, 4);
      }
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

  renderWall(x, y, tile) {
    const ctx = this.ctx;
    const img = this.sprites['structure_wall'];
    if (img && this.spritesLoaded) {
      ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(x + 4 + i * 12, y + 4, 8, TILE_SIZE - 8);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + 6 + i * 12, y + 6, 4, TILE_SIZE - 12);
      }
    }

    const hpRatio = tile.hp / tile.maxHp;
    ctx.fillStyle = '#400';
    ctx.fillRect(x + 4, y + TILE_SIZE - 5, TILE_SIZE - 8, 3);
    ctx.fillStyle = hpRatio > 0.5 ? '#0a0' : '#a80';
    ctx.fillRect(x + 4, y + TILE_SIZE - 5, (TILE_SIZE - 8) * hpRatio, 3);

    if (hpRatio < 0.33) {
      ctx.fillStyle = `rgba(255,0,0,${Math.sin(this.animTime * 0.008) * 0.2 + 0.1})`;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  renderEnemies(enemies) {
    const ctx = this.ctx;
    for (const e of enemies) {
      const progress = e.moveTimer / ENEMY_MOVE_INTERVAL;
      const col = e.prevCol + (e.col - e.prevCol) * progress;
      const row = e.prevRow + (e.row - e.prevRow) * progress;
      const { x, y } = this.tileToScreen(col, row);
      const cx = x + TILE_SIZE / 2;
      const cy = y + TILE_SIZE / 2;

      const pulse = Math.sin(this.animTime * 0.006) * 2;

      // Тень
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Тело — тёмно-красный силуэт с зазубренным краем
      ctx.fillStyle = '#8a1a1a';
      ctx.beginPath();
      for (let a = 0; a < 12; a++) {
        const angle = (a / 12) * Math.PI * 2;
        const r = 11 + (a % 2 === 0 ? 2 : 0) + Math.sin(angle * 3 + this.animTime * 0.004) * 1;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r - 2 + pulse;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Внутреннее свечение
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.arc(cx, cy - 2 + pulse, 7, 0, Math.PI * 2);
      ctx.fill();

      // Рога
      ctx.fillStyle = '#331111';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 7 + pulse);
      ctx.lineTo(cx - 9, cy - 15 + pulse);
      ctx.lineTo(cx - 4, cy - 9 + pulse);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + 5, cy - 7 + pulse);
      ctx.lineTo(cx + 9, cy - 15 + pulse);
      ctx.lineTo(cx + 4, cy - 9 + pulse);
      ctx.fill();

      // Руки-клешни
      ctx.fillStyle = '#5a0a0a';
      ctx.fillRect(cx - 14, cy - 2 + pulse, 6, 3);
      ctx.fillRect(cx + 8, cy - 2 + pulse, 6, 3);

      // Глаза — горящие красные
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 3 + pulse, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 3 + pulse, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6600';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 3 + pulse, 1.2, 0, Math.PI * 2);
      ctx.arc(cx + 4, cy - 3 + pulse, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Полоска HP
      ctx.fillStyle = '#400';
      ctx.fillRect(cx - 8, cy - 17 + pulse, 16, 3);
      ctx.fillStyle = e.hp > 1 ? '#ff3333' : '#ff8800';
      ctx.fillRect(cx - 8, cy - 17 + pulse, 16 * (e.hp / ENEMY_HP), 3);
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
    let col = player.col;
    let row = player.row;
    if (player.moveTimer > 0) {
      const t = 1 - player.moveTimer / player.MOVE_DURATION;
      col = player.prevCol + (player.col - player.prevCol) * t;
      row = player.prevRow + (player.row - player.prevRow) * t;
    }
    const { x, y } = this.tileToScreen(col, row);
    const ctx = this.ctx;

    const bob = Math.sin(player.walkStep) * 3;
    const dy = player.walkStep > 0 ? bob : 0;

    const img = this.sprites['oopi'];
    if (img && this.spritesLoaded) {
      if (player.direction === DIR_LEFT) {
        ctx.save();
        ctx.translate(x + TILE_SIZE / 2, y + dy + TILE_SIZE / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        ctx.restore();
      } else {
        ctx.drawImage(img, x, y + dy, TILE_SIZE, TILE_SIZE);
      }
    } else {
      const cx = x + TILE_SIZE / 2;
      const cy = y + TILE_SIZE / 2 + dy;
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
      const eyeX = cx + dir.x * 4;
      const eyeY = cy + dir.y * 4 - 2;

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(eyeX - 4, eyeY, 3.5, 0, Math.PI * 2);
      ctx.arc(eyeX + 4, eyeY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(eyeX + dir.x * 2 - 4, eyeY + dir.y * 2, 1.8, 0, Math.PI * 2);
      ctx.arc(eyeX + dir.x * 2 + 4, eyeY + dir.y * 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderHover(col, row) {
    if (col < 0 || row < 0) return;
    const { x, y } = this.tileToScreen(col, row);
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  renderMiningEffects(effects) {
    const ctx = this.ctx;
    for (const fx of effects) {
      const { x, y } = this.tileToScreen(fx.col, fx.row);
      const t = fx.timer;
      const alpha = t / 400;

      ctx.fillStyle = `rgba(255, 220, 80, ${alpha * 0.5})`;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      const count = 6;
      for (let s = 0; s < count; s++) {
        const angle = (s / count) * Math.PI * 2 + t * 0.02;
        const dist = (1 - alpha) * 24;
        const px = x + TILE_SIZE / 2 + Math.cos(angle) * dist;
        const py = y + TILE_SIZE / 2 + Math.sin(angle) * dist;
        const size = Math.max(1, alpha * 4);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderMenu() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ГЭЙМ', w / 2, h * 0.28);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '20px monospace';
    ctx.fillText('Factory Automation', w / 2, h * 0.28 + 42);

    const pulse = Math.sin(this.animTime * 0.004) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
    ctx.font = '24px monospace';
    ctx.fillText('[ Enter ] - Начать игру', w / 2, h * 0.50);

    ctx.fillStyle = '#667788';
    ctx.font = '14px monospace';
    const controls = [
      'WASD / Стрелки - движение',
      'E - собрать руду / загрузить в печь',
      'Q - поворот',
      'F - конвейер | G - печь',
      'H - бур | J - сборщик',
      'T - турель | Y - стена',
    ];
    for (let i = 0; i < controls.length; i++) {
      ctx.fillText(controls[i], w / 2, h * 0.66 + i * 22);
    }

    ctx.fillStyle = '#556677';
    ctx.font = '14px monospace';
    ctx.fillText('[ I ] - Инструкция', w / 2, h * 0.66 + 6 * 22 + 10);
  }

  renderInstructions() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ИНСТРУКЦИЯ', w / 2, 50);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '14px monospace';
    const lines = [
      'WASD / Стрелки — передвижение по миру',
      'E — собрать руду с земли или загрузить руду в печь',
      'Q — повернуть направление строительства',
      '',
      'СТРОИТЕЛЬСТВО:',
      'F — конвейер (перемещает предметы)',
      'G — печь (плавит 5 руды в 1 пластину)',
      'H — бур (добывает руду из соседней жилы)',
      'J — сборщик (собирает 2 пластины в 1 плату)',
      'T — турель (автоматически стреляет во врагов)',
      'Y — стена (блокирует врагов, 2 железных пластины)',
      '',
      'КАК ИГРАТЬ:',
      '1. Соберите руду (E) и постройте бур (H) рядом с жилой',
      '2. Направьте бур конвейером (F) к печи (G)',
      '3. Печь плавит руду в пластины — стройте больше!',
      '4. Из пластин сборщик (J) делает платы',
      '5. Стены (Y) блокируют врагов — стройте укрепления!',
      '6. Турели (T) защищают базу от врагов',
      '',
      'ВРАГИ:',
      'Волны врагов наступают каждые 10 секунд',
      'Враги идут к игроку, затем отступают',
      'За убийство врага даётся +2 железной руды',
      '',
      'СОХРАНЕНИЕ:',
      'K — сохранить игру | L — загрузить',
      'R — сбросить мир',
    ];
    const startY = 95;
    for (let i = 0; i < lines.length; i++) {
      const isHeader = lines[i].endsWith(':') && lines[i].length > 3;
      ctx.fillStyle = isHeader ? '#88ccff' : '#8899aa';
      ctx.fillText(lines[i], w / 2, startY + i * 18);
    }

    const pulse = Math.sin(this.animTime * 0.004) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
    ctx.font = '18px monospace';
    ctx.fillText('[ Enter / I ] - Назад', w / 2, h - 30);
  }

  renderCompass(playerCol, playerRow, spawnCol, spawnRow) {
    const ctx = this.ctx;
    const cx = this.canvas.width - 60;
    const cy = 60;
    const r = 22;

    const angle = Math.atan2(spawnRow - playerRow, spawnCol - playerCol);

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(0, -r + 5);
    ctx.lineTo(-5, 8);
    ctx.lineTo(5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#8899aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 0);

    ctx.restore();
  }

  renderDeathOverlay(timer, duration) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const progress = 1 - timer / duration;

    const alpha = progress * 0.6;
    ctx.fillStyle = `rgba(180, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, w, h);

    if (progress > 0.3) {
      const textAlpha = Math.min(1, (progress - 0.3) / 0.3);
      ctx.fillStyle = `rgba(255, 100, 100, ${textAlpha})`;
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ПОТРАЧЕНО', w / 2, h * 0.4);
    }
  }

  renderGameOver(totalItems) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', w / 2, h * 0.3);

    ctx.fillStyle = '#cccccc';
    ctx.font = '20px monospace';
    ctx.fillText('Предметов произведено: ' + totalItems, w / 2, h * 0.42);

    ctx.fillStyle = '#88ccff';
    ctx.font = '22px monospace';
    ctx.fillText('[ R ] - Начать заново', w / 2, h * 0.58);
    ctx.fillText('[ M ] - Главный экран', w / 2, h * 0.66);
  }

  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
