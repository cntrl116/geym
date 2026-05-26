const COLS = 20;
const ROWS = 15;
const TILE_SIZE = 40;

const DIR_UP = 0;
const DIR_RIGHT = 1;
const DIR_DOWN = 2;
const DIR_LEFT = 3;

const DIR_NAMES = ['up', 'right', 'down', 'left'];

const CONVEYOR_COST = 1;
const FURNACE_COST = 3;

const DIR_VEC = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

const TILE_TYPES = {
  EMPTY: 'empty',
  IRON_ORE: 'iron_ore',
  CONVEYOR: 'conveyor',
  FURNACE: 'furnace',
};

const ITEM_TYPES = {
  IRON_ORE: 'iron_ore',
  IRON_PLATE: 'iron_plate',
};

const RECIPES = {
  iron_plate: { input: { iron_ore: 5 }, output: 'iron_plate', time: 3000 },
};

const BELT_SPEED = 0.001;
