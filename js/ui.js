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

    this.elements.plates = document.createElement('div');
    h.appendChild(this.elements.plates);

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
      'WASD — движение | E — сбор | Q — напр. | F — конвейер | G — печь | K — сохр | L — загр | R — сброс';
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

    this.update({ iron_ore: 0, iron_plate: 0 }, 0, 0, 0, false, '');
  }

  update(inventory, totalPlates, col, row, buildMode, buildInfo) {
    this.elements.pos.textContent = `[${col || 0}, ${row || 0}]`;
    this.elements.inv.textContent =
      `\u2692 Руда: ${inventory.iron_ore} | Пластины: ${inventory.iron_plate}`;
    this.elements.plates.textContent =
      `\u2699 Произведено пластин: ${totalPlates || 0}`;
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
