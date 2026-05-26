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
  COPPER_ORE: 'copper_ore',
  CONVEYOR: 'conveyor',
  FURNACE: 'furnace',
  DRILL: 'drill',
  ASSEMBLER: 'assembler',
};

const ITEM_TYPES = {
  IRON_ORE: 'iron_ore',
  COPPER_ORE: 'copper_ore',
  IRON_PLATE: 'iron_plate',
  COPPER_PLATE: 'copper_plate',
  CIRCUIT_BOARD: 'circuit_board',
};

const RECIPES = {
  iron_plate: { input: { iron_ore: 5 }, output: { type: 'iron_plate', count: 1 }, time: 3000, building: 'furnace' },
  copper_plate: { input: { copper_ore: 5 }, output: { type: 'copper_plate', count: 1 }, time: 3000, building: 'furnace' },
  circuit_board: { input: { iron_plate: 2, copper_plate: 2 }, output: { type: 'circuit_board', count: 1 }, time: 4000, building: 'assembler' },
};

const CONVEYOR_COST = 1;
const FURNACE_COST = 3;
const DRILL_COST = 5;
const ASSEMBLER_COST = 8;

const BELT_SPEED = 0.001;
const DRILL_SPEED = 2000;
