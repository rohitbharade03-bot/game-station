export const WORLD = {
  width: 1800,
  height: 1200,
};

export const ROADS = [
  {
    id: "road-1",
    x: 100,
    y: 340,
    w: 1600,
    h: 120,
  },

  {
    id: "road-2",
    x: 100,
    y: 690,
    w: 1600,
    h: 100,
  },

  {
    id: "road-3",
    x: 430,
    y: 100,
    w: 110,
    h: 1000,
  },

  {
    id: "road-4",
    x: 810,
    y: 100,
    w: 110,
    h: 1000,
  },

  {
    id: "road-5",
    x: 1210,
    y: 100,
    w: 110,
    h: 1000,
  },
];

export const BUILDINGS = [
  { id: 1, x: 150, y: 140, w: 280, h: 170 },
  { id: 2, x: 570, y: 140, w: 240, h: 170 },
  { id: 3, x: 950, y: 140, w: 260, h: 170 },
  { id: 4, x: 1350, y: 140, w: 270, h: 170 },

  { id: 5, x: 150, y: 480, w: 230, h: 170 },
  { id: 6, x: 550, y: 480, w: 260, h: 170 },
  { id: 7, x: 950, y: 480, w: 250, h: 170 },
  { id: 8, x: 1350, y: 480, w: 270, h: 170 },

  { id: 9, x: 150, y: 800, w: 280, h: 160 },
  { id: 10, x: 570, y: 800, w: 240, h: 160 },
  { id: 11, x: 950, y: 800, w: 250, h: 160 },
  { id: 12, x: 1350, y: 800, w: 270, h: 160 },
];

export const CITY_START = {
  player: {
    x: 250,
    y: 930,
  },

  vehicle: {
    x: 350,
    y: 900,
    angle: 0,
    speed: 0,
  },
};

export const NPCS = [
  {
    id: 1,
    x: 650,
    y: 395,
    color: "#ffb36b",
  },

  {
    id: 2,
    x: 1040,
    y: 395,
    color: "#65b9ff",
  },

  {
    id: 3,
    x: 1450,
    y: 740,
    color: "#e68cff",
  },

  {
    id: 4,
    x: 720,
    y: 740,
    color: "#6ee7a5",
  },
];

export const TRAFFIC = [
  {
    id: 1,
    x: 250,
    y: 395,
    angle: 0,
    speed: 1.8,
    color: "#f04444",
  },

  {
    id: 2,
    x: 1050,
    y: 395,
    angle: 0,
    speed: 1.5,
    color: "#36a3ff",
  },

  {
    id: 3,
    x: 1450,
    y: 740,
    angle: 0,
    speed: 1.7,
    color: "#ffc928",
  },

  {
    id: 4,
    x: 650,
    y: 740,
    angle: 0,
    speed: 1.4,
    color: "#b56cff",
  },
];