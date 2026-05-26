class UI {
  constructor() {
    this.hud = document.getElementById('hud');
    this.elements = {};
    this.create();
  }

  create() {
    const h = this.hud;

    this.elements.pos = document.createElement('div');
    this.elements.pos.style.fontSize = '11px';
    this.elements.pos.style.opacity = '0.5';
    h.appendChild(this.elements.pos);

    this.elements.inv = document.createElement('div');
    h.appendChild(this.elements.inv);

    this.elements.prod = document.createElement('div');
    h.appendChild(this.elements.prod);

    this.elements.buildInfo = document.createElement('div');
    this.elements.buildInfo.style.marginTop = '6px';
    this.elements.buildInfo.style.fontSize = '12px';
    this.elements.buildInfo.style.color = '#aaddff';
    h.appendChild(this.elements.buildInfo);

    this.elements.controls = document.createElement('div');
    this.elements.controls.style.marginTop = '8px';
    this.elements.controls.style.fontSize = '12px';
    this.elements.controls.style.opacity = '0.6';
    this.elements.controls.innerHTML =
      'WASD — движение | E — сбор | Q — напр. | F — конвейер | G — печь | H — бур | J — сборщик | T — турель | K — сохр | L — загр | R — сброс | ЛКМ — конвейер | ПКМ — печь';
    h.appendChild(this.elements.controls);

    this.elements.saveLoad = document.createElement('div');
    this.elements.saveLoad.style.marginTop = '8px';
    this.elements.saveLoad.style.fontSize = '12px';
    h.appendChild(this.elements.saveLoad);

    this.elements.notify = document.createElement('div');
    this.elements.notify.style.marginTop = '4px';
    this.elements.notify.style.fontSize = '13px';
    this.elements.notify.style.color = '#ffcc00';
    h.appendChild(this.elements.notify);

    this.update({ hp: 10, maxHp: 10, inventory: { iron_ore: 0, copper_ore: 0, iron_plate: 0, copper_plate: 0, circuit_board: 0 }, col: 0, row: 0 }, 0, false, '');
  }

  update(player, totalItems, buildMode, buildInfo) {
    const inv = player.inventory;
    this.elements.pos.textContent = `[${player.col || 0}, ${player.row || 0}]`;
    let hpStr = '';
    for (let i = 0; i < (player.maxHp || 10); i++) {
      hpStr += (i < player.hp) ? '❤' : '🖤';
    }
    this.elements.inv.textContent =
      `${hpStr}  \u2692 Fe: ${inv.iron_ore} Cu: ${inv.copper_ore} | \u2699 Fe: ${inv.iron_plate} Cu: ${inv.copper_plate} | \u2691 Плата: ${inv.circuit_board}`;
    this.elements.prod.textContent =
      `\u2699 Произведено: ${totalItems || 0}`;
    this.elements.buildInfo.textContent = buildInfo || '';
  }

  updateSaveLoad(text) {
    this.elements.saveLoad.textContent = text;
  }

  notify(msg) {
    this.elements.notify.textContent = msg;
    clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(() => {
      this.elements.notify.textContent = '';
    }, 2000);
  }
}
