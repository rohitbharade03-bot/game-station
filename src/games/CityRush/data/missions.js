export const MISSIONS = [
  {
    id: 1,
    title: "First Ride",
    type: "DRIVE",
    description: "Take your car and reach the marked destination.",
    reward: 100,
    timeLimit: 0,
    start: { x: 350, y: 900 },
    destination: { x: 1500, y: 395 },
  },

  {
    id: 2,
    title: "Package Run",
    type: "DELIVERY",
    description: "Collect the package and deliver it safely.",
    reward: 250,
    timeLimit: 55,
    pickup: { x: 260, y: 395 },
    destination: { x: 1500, y: 740 },
  },

{
  id: 3,
  title: "ESCAPE",
  description:
    "The police are after you. Lose them and reach the safe zone.",
  reward: 500,
  destination: {
    x: 280,
    y: 980,
  },
  requiredWanted: 2,
  time: 75,
},

  {
    id: 4,
    title: "Street Rescue",
    type: "RESCUE",
    description: "Reach the marked person and take them to safety.",
    reward: 500,
    timeLimit: 75,
    pickup: { x: 700, y: 390 },
    destination: { x: 1500, y: 980 },
  },

  {
    id: 5,
    title: "Time Rush",
    type: "TIME",
    description: "Reach the destination before the clock runs out.",
    reward: 600,
    timeLimit: 45,
    destination: { x: 1500, y: 395 },
  },

  {
    id: 6,
    title: "Delivery Chain",
    type: "CHAIN",
    description: "Complete multiple deliveries around the city.",
    reward: 750,
    timeLimit: 90,
    checkpoints: [
      { x: 260, y: 395 },
      { x: 1500, y: 395 },
      { x: 700, y: 740 },
      { x: 1500, y: 740 },
    ],
  },

  {
    id: 7,
    title: "City Chase",
    type: "CHASE",
    description: "Follow the target vehicle across the city.",
    reward: 900,
    timeLimit: 90,
    destination: { x: 1450, y: 740 },
  },

  {
    id: 8,
    title: "Night Run",
    type: "NIGHT",
    description: "Complete the delivery through the dark city.",
    reward: 1000,
    timeLimit: 70,
    destination: { x: 280, y: 980 },
  },

  {
    id: 9,
    title: "Risk Route",
    type: "RISK",
    description: "Take the dangerous route and finish the delivery.",
    reward: 1200,
    timeLimit: 80,
    destination: { x: 1500, y: 980 },
  },

  {
    id: 10,
    title: "Final Run",
    type: "FINAL",
    description: "Complete multiple objectives in one mission.",
    reward: 2000,
    timeLimit: 120,
    checkpoints: [
      { x: 260, y: 395 },
      { x: 1500, y: 395 },
      { x: 700, y: 740 },
      { x: 280, y: 980 },
    ],
  },
];

export function getMission(id) {
  return (
    MISSIONS.find(
      (mission) => mission.id === id
    ) || MISSIONS[0]
  );
}