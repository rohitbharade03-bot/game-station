import React from "react";

function Vehicle({
  vehicle,
  isPlayer = false,
  selected = false,
  onClick,
}) {
  if (!vehicle) return null;

  const {
    x = 0,
    y = 0,
    angle = 0,
    color = "#e52f3f",
    name = "Vehicle",
  } = vehicle;

  return (
    <div
      className={`cr-vehicle ${
        isPlayer ? "cr-player-vehicle" : ""
      } ${selected ? "cr-selected-vehicle" : ""}`}
      style={{
        left: `${x - 25}px`,
        top: `${y - 42}px`,
        transform: `rotate(${angle}rad)`,
        "--vehicle-color": color,
      }}
      onClick={onClick}
      title={name}
    >
      <div className="cr-vehicle-light front" />

      <div className="cr-vehicle-body">
        <div className="cr-vehicle-window" />

        <div className="cr-vehicle-stripe" />

        <div className="cr-vehicle-wheel wheel-left" />
        <div className="cr-vehicle-wheel wheel-right" />
      </div>

      <div className="cr-vehicle-light rear" />

      {isPlayer && (
        <div className="cr-vehicle-player-marker">
          YOU
        </div>
      )}
    </div>
  );
}

export default Vehicle;