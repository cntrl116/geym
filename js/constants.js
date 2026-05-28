const COLS = 30;
const ROWS = 20;
const TILE_SIZE = 40;

const DIR_UP = 0;
const DIR_RIGHT = 1;
const DIR_DOWN = 2;
const DIR_LEFT = 3;

const DIR_NAMES = ['up', 'right', 'down', 'left'];

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
  TURRET: 'turret',
  WALL: 'wall',
  CHEST: 'chest',
};

const ITEM_TYPES = {
  IRON_ORE: 'iron_ore',
  COPPER_ORE: 'copper_ore',
  IRON_PLATE: 'iron_plate',
  COPPER_PLATE: 'copper_plate',
  CIRCUIT_BOARD: 'circuit_board',
  IRON_GEAR: 'iron_gear',
};

const RECIPES = {
  iron_plate: { input: { iron_ore: 5 }, output: { type: 'iron_plate', count: 1 }, time: 3000, building: 'furnace' },
  copper_plate: { input: { copper_ore: 5 }, output: { type: 'copper_plate', count: 1 }, time: 3000, building: 'furnace' },
  circuit_board: { input: { iron_plate: 2, copper_plate: 2 }, output: { type: 'circuit_board', count: 1 }, time: 4000, building: 'assembler' },
  iron_gear: { input: { iron_plate: 2 }, output: { type: 'iron_gear', count: 1 }, time: 2000, building: 'assembler' },
};

const CHEST_CAPACITY = 100;

const BUILDING_DEFS = [
  { id: 'conveyor', name: 'Конвейер',      iconChar: '⇨',  color: '#777788', tileType: TILE_TYPES.CONVEYOR, costs: { iron_plate: 1 } },
  { id: 'furnace',  name: 'Печь',          iconChar: '⏽',  color: '#8B4513', tileType: TILE_TYPES.FURNACE,  costs: { iron_plate: 5 } },
  { id: 'chest',    name: 'Склад',         iconChar: '▣',  color: '#8B6914', tileType: TILE_TYPES.CHEST,    costs: { iron_plate: 5 } },
  { id: 'drill',    name: 'Рудокопатель',  iconChar: '⛏',  color: '#556677', tileType: TILE_TYPES.DRILL,    costs: { iron_plate: 10, iron_gear: 2 } },
];

const CONVEYOR_COST = 1;
const FURNACE_COST = 3;
const DRILL_COST = 5;
const ASSEMBLER_COST = 8;

const BELT_SPEED = 0.001;
const DRILL_SPEED = 2000;

const TURRET_COST = 5;
const TURRET_RANGE = 5;
const TURRET_COOLDOWN = 800;

const WALL_COST = 2;
const WALL_HP = 20;

const ENEMY_HP = 5;
const ENEMY_DAMAGE = 1;
const ENEMY_SPAWN_INTERVAL = 20000;
const ENEMY_ATTACK_COOLDOWN = 2000;
const ENEMY_MOVE_INTERVAL = 400;

const WAVE_COOLDOWN = 10000;
const WAVE_ACTIVE_DURATION = 15000;
const WAVE_RETREAT_DURATION = 5000;
const BASE_ENEMIES_PER_WAVE = 4;
const ENEMIES_PER_WAVE_INCREASE = 2;

const PLAYER_MAX_HP = 10;
