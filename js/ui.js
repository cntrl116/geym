class UI {
  constructor() {
    this.hud = document.getElementById('hud');
    this.elements = {};
    this.create();
  }

  create() {
    this.elements.inv = document.createElement('div');
    this.hud.appendChild(this.elements.inv);
    this.elements.plates = document.createElement('div');
    this.hud.appendChild(this.elements.plates);
    this.elements.controls = document.createElement('div');
    this.elements.controls.style.marginTop = '8px';
    this.elements.controls.style.fontSize = '12px';
    this.elements.controls.style.opacity = '0.6';
    this.elements.controls.innerHTML =
      'WASD — движение | E — сбор руды | Q — направление';
    this.hud.appendChild(this.elements.controls);
    this.elements.notify = document.createElement('div');
    this.elements.notify.style.marginTop = '4px';
    this.elements.notify.style.fontSize = '13px';
    this.elements.notify.style.color = '#ffcc00';
    this.hud.appendChild(this.elements.notify);
    this.update({ iron_ore: 0, iron_plate: 0 }, 0);
  }

  update(inventory, totalPlates) {
    this.elements.inv.textContent =
      `\u2692 Руда: ${inventory.iron_ore} | Пластины: ${inventory.iron_plate}`;
    this.elements.plates.textContent =
      `\u2699 Произведено пластин: ${totalPlates || 0}`;
  }

  notify(msg) {
    this.elements.notify.textContent = msg;
    clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(() => {
      this.elements.notify.textContent = '';
    }, 1500);
  }
}
