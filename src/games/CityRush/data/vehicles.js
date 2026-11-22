export const VEHICLES = [
  {
    id: "starter",
    name: "Street Runner",
    price: 0,
    maxSpeed: 7,
    acceleration: 0.18,
    handling: 0.045,
    health: 100,
    color: "#e52f3f",
    unlocked: true,
  },
  {
    id: "shadow",
    name: "Shadow GT",
    price: 1500,
    maxSpeed: 8.5,
    acceleration: 0.22,
    handling: 0.052,
    health: 90,
    color: "#17191d",
    unlocked: false,
  },
  {
    id: "bolt",
    name: "Bolt X",
    price: 3000,
    maxSpeed: 10,
    acceleration: 0.27,
    handling: 0.058,
    health: 80,
    color: "#ffd229",
    unlocked: false,
  },
  {
    id: "guardian",
    name: "Guardian",
    price: 4500,
    maxSpeed: 7.5,
    acceleration: 0.17,
    handling: 0.042,
    health: 150,
    color: "#277cff",
    unlocked: false,
  },
  {
    id: "phantom",
    name: "Phantom RS",
    price: 6500,
    maxSpeed: 11,
    acceleration: 0.30,
    handling: 0.062,
    health: 85,
    color: "#8b5cf6",
    unlocked: false,
  },
];

export function getVehicle(id) {
  return (
    VEHICLES.find(
      (vehicle) => vehicle.id === id
    ) || VEHICLES[0]
  );
}