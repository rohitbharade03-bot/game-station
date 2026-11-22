import React from "react";

function MobileControls({
  onKeyDown,
  onKeyUp,
  onAction,
  inVehicle,
}) {
  const hold = (key) => {
    onKeyDown(key);
  };

  const release = (key) => {
    onKeyUp(key);
  };

  const Control = ({
    keyName,
    children,
  }) => (
    <button
      className="city-mobile-key"
      onPointerDown={() =>
        hold(keyName)
      }
      onPointerUp={() =>
        release(keyName)
      }
      onPointerLeave={() =>
        release(keyName)
      }
      onPointerCancel={() =>
        release(keyName)
      }
    >
      {children}
    </button>
  );

  return (
    <div className="city-mobile-controls">
      <div className="city-dpad">
        <Control keyName="a">
          ←
        </Control>

        <Control keyName="s">
          ↓
        </Control>

        <Control keyName="d">
          →
        </Control>

        <div className="city-up">
          <Control keyName="w">
            ↑
          </Control>
        </div>
      </div>

      <div className="city-action-buttons">
        <button
          className="city-action"
          onClick={onAction}
        >
          {inVehicle
            ? "EXIT"
            : "ENTER"}
        </button>
      </div>
    </div>
  );
}

export default MobileControls;