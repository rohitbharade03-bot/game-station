import React from "react";
import { VEHICLES } from "../data/vehicles";

function Garage({
  money = 0,
  ownedVehicles = ["starter"],
  selectedVehicle = "starter",
  onBuy,
  onSelect,
  onClose,
}) {
  return (
    <div className="cr-garage-overlay">
      <div className="cr-garage">

        <div className="cr-garage-header">
          <div>
            <span className="cr-garage-label">
              CITY RUSH
            </span>

            <h1>GARAGE</h1>
          </div>

          <div className="cr-garage-money">
            💰 ${money}
          </div>

          <button
            className="cr-garage-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="cr-garage-grid">
          {VEHICLES.map((vehicle) => {
            const owned =
              ownedVehicles.includes(
                vehicle.id
              );

            const selected =
              selectedVehicle ===
              vehicle.id;

            return (
              <div
                key={vehicle.id}
                className={`cr-garage-card ${
                  selected
                    ? "selected"
                    : ""
                }`}
              >

                <div
                  className="cr-garage-car"
                  style={{
                    "--garage-car-color":
                      vehicle.color,
                  }}
                >
                  <div className="garage-car-window" />

                  <div className="garage-car-wheel left" />
                  <div className="garage-car-wheel right" />

                  <div className="garage-car-light" />
                </div>

                <div className="cr-garage-info">
                  <h2>
                    {vehicle.name}
                  </h2>

                  <div className="cr-car-stats">
                    <div>
                      <span>SPEED</span>

                      <div className="stat-bar">
                        <i
                          style={{
                            width: `${Math.min(
                              vehicle.maxSpeed *
                                8,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <span>POWER</span>

                      <div className="stat-bar">
                        <i
                          style={{
                            width: `${Math.min(
                              vehicle.acceleration *
                                280,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <span>HANDLING</span>

                      <div className="stat-bar">
                        <i
                          style={{
                            width: `${Math.min(
                              vehicle.handling *
                                1500,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <span>HEALTH</span>

                      <div className="stat-bar">
                        <i
                          style={{
                            width: `${Math.min(
                              vehicle.health,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="cr-garage-action">

                    {selected ? (
                      <button
                        className="garage-selected"
                        disabled
                      >
                        ✓ SELECTED
                      </button>
                    ) : owned ? (
                      <button
                        className="garage-select"
                        onClick={() =>
                          onSelect(
                            vehicle.id
                          )
                        }
                      >
                        SELECT
                      </button>
                    ) : (
                      <button
                        className="garage-buy"
                        onClick={() =>
                          onBuy(
                            vehicle
                          )
                        }
                        disabled={
                          money <
                          vehicle.price
                        }
                      >
                        {money >=
                        vehicle.price
                          ? `BUY $${vehicle.price}`
                          : `NEED $${vehicle.price}`}
                      </button>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default Garage;