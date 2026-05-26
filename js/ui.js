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
      'WASD — движение | E — сбор | Q — направление | F — конвейер | R — печь';
    this.hud.appendChild(this.elements.controls);
    this.update({ iron_ore: 0, iron_plate: 0 }, 0);
  }

  update(inventory, totalPlates) {
    this.elements.inv.textContent =
      `\u2692 Руда: ${inventory.iron_ore} | Пластины: ${inventory.iron_plate}`;
    this.elements.plates.textContent =
      `\u2699 Произведено пластин: ${totalPlates || 0}`;
  }
}
